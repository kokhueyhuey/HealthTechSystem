using HealthTech.API.Data;
using HealthTech.API.Models;
using HealthTech.API.Observer;
using Microsoft.EntityFrameworkCore;

namespace HealthTech.API.Services
{
    // ─────────────────────────────────────────────────────────────────────────
    // OBSERVER PATTERN — The Subject (Concrete)
    //
    // This class IS the heart of the Observer pattern in your system.
    // It:
    //   1. Maintains the list of observers (_observers)
    //   2. Lets callers register / remove observers
    //   3. Notifies ALL observers after every appointment change
    //
    // CONCEPT — Architecture:
    //   The Service Layer sits between the Controller (HTTP) and the
    //   Database (EF Core). The Controller handles HTTP, the Service
    //   handles business rules + pattern, the DB handles persistence.
    //   Clean layered architecture — each layer has one responsibility.
    //
    // CONCEPT — Encapsulation:
    //   _observers is private. Nobody outside this class can directly
    //   manipulate the observer list — they must use Register/Remove.
    //   The appointment validation logic (slot taken, 2-hour rule) is
    //   also hidden inside this service.
    //
    // CONCEPT — Modularity:
    //   AppointmentService only deals with appointments.
    //   It doesn't know about prescriptions, inventory, or queue — 
    //   those are separate services/modules.
    //
    // CONCEPT — Refactoring:
    //   Previously, notification logic was scattered across the Controller
    //   (like your existing PatientsController sends SignalR directly).
    //   Refactoring moves ALL notification responsibility here, making the
    //   Controller thin and the Service testable.
    //
    // SOLID — SRP: this class owns appointment lifecycle. One responsibility.
    // SOLID — DIP: depends on IAppointmentObserver (interface), not concrete classes.
    // SOLID — OCP: new observers are registered externally; this class never changes.
    // ─────────────────────────────────────────────────────────────────────────

    public class AppointmentService : IAppointmentSubject
    {
        private readonly AppDbContext _context;

        // ── Observer list (private — Encapsulation) ───────────────────────
        // This is the core data structure of the Observer pattern.
        // It holds every registered observer at runtime.
        private readonly List<IAppointmentObserver> _observers = new();

        public AppointmentService(AppDbContext context)
        {
            _context = context;

            // ── Register all three observers at construction time ──────────
            // CONCEPT — Refinement:
            //   At a high level we say "notify relevant parties".
            //   Here we refine that into three specific concrete observers.
            RegisterObserver(new PatientObserver());
            RegisterObserver(new DoctorObserver());
            RegisterObserver(new PharmacistObserver());
        }

        // ── IAppointmentSubject implementation ────────────────────────────

        public void RegisterObserver(IAppointmentObserver observer)
        {
            _observers.Add(observer);
        }

        public void RemoveObserver(IAppointmentObserver observer)
        {
            _observers.Remove(observer);
        }

        // 🔴 BREAKPOINT A — set a breakpoint on the foreach line below.
        //    Step through: you will see PatientObserver.Update() → DoctorObserver.Update()
        //    → PharmacistObserver.Update() fire in sequence.
        //    To prove OCP: comment out RegisterObserver(new DoctorObserver()) above,
        //    re-run — only Patient and Pharmacist fire. The loop itself never changes.

        public void NotifyObservers(Appointment appointment, string eventType)
        {
            // 🔴 BREAKPOINT A — step INTO each iteration ↓
            foreach (var observer in _observers)
            {
                observer.Update(appointment, eventType);   // polymorphic dispatch
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // USE CASE: Book Appointment
        // Basic Flow steps 3-6 from your use case table
        // ─────────────────────────────────────────────────────────────────
        public async Task<(bool Success, string Message, Appointment? Result)>
            BookAppointmentAsync(int patientId, int doctorId, DateTime appointmentDate, string notes = "")
        {
            // Alternative Flow A1: slot already taken (same doctor + overlapping time ±30 min)
            bool slotTaken = await _context.Appointments.AnyAsync(a =>
                a.DoctorId == doctorId &&
                a.Status != "Cancelled" &&
                Math.Abs(EF.Functions.DateDiffMinute(a.AppointmentDate, appointmentDate)) < 30);

            if (slotTaken)
                return (false, "Selected time slot is already taken. Please choose another slot.", null);

            // Alternative Flow A2: doctor does not exist
            var doctor = await _context.Doctors.FindAsync(doctorId);
            if (doctor == null)
                return (false, "No available slots — doctor not found.", null);

            // Alternative Flow: appointment date must be in the future
            if (appointmentDate <= DateTime.UtcNow)
                return (false, "Appointment date must be in the future.", null);

            // Basic Flow step 5-6: confirm booking and save
            var appointment = new Appointment
            {
                PatientId       = patientId,
                DoctorId        = doctorId,
                AppointmentDate = appointmentDate,
                Status          = "Pending",          // encapsulated default — caller cannot skip this
                Notes           = notes
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            // 🔴 BREAKPOINT B — set here to watch NotifyObservers fire after save.
            //    Inspect: appointment.Id will now have the DB-generated ID.
            NotifyObservers(appointment, "Booked");    // 🔴 BREAKPOINT B

            return (true, "Appointment booked successfully.", appointment);
        }

        // ─────────────────────────────────────────────────────────────────
        // USE CASE: View Appointment Status  (Patient — Basic Flow step 3)
        // USE CASE: View Daily Appointments  (Doctor  — Basic Flow step 3)
        // ─────────────────────────────────────────────────────────────────
        public async Task<List<Appointment>> GetAppointmentsByPatientAsync(int patientId)
        {
            return await _context.Appointments
                .Include(a => a.Doctor)
                .Where(a => a.PatientId == patientId)
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();
        }

        public async Task<List<Appointment>> GetAppointmentsByDoctorAsync(int doctorId, DateTime? date = null)
        {
            var query = _context.Appointments
                .Include(a => a.Patient)
                .Where(a => a.DoctorId == doctorId);

            if (date.HasValue)
                query = query.Where(a => a.AppointmentDate.Date == date.Value.Date);

            return await query.OrderBy(a => a.AppointmentDate).ToListAsync();
        }

        // ─────────────────────────────────────────────────────────────────
        // USE CASE: Cancel or Reschedule Appointment
        // Use case: patient must be > 2 hours before; pharmacist has no restriction
        // ─────────────────────────────────────────────────────────────────
        public async Task<(bool Success, string Message)>
            CancelAppointmentAsync(int appointmentId, string requestedByRole)
        {
            var appointment = await _context.Appointments.FindAsync(appointmentId);
            if (appointment == null)
                return (false, "Appointment not found.");

            // Alternative Flow A3: already completed — no modification allowed
            if (appointment.Status == "Completed")
                return (false, "Cannot cancel a completed appointment.");

            // Alternative Flow A1: patient 2-hour rule
            if (requestedByRole == "Patient")
            {
                var hoursUntil = (appointment.AppointmentDate - DateTime.UtcNow).TotalHours;
                if (hoursUntil < 2)
                    return (false, "Cannot cancel — appointment is less than 2 hours away. Please call the clinic.");
            }
            // Pharmacist has no time restriction (per your use case: they manage on behalf of doctor/patient)

            appointment.Status = "Cancelled";
            await _context.SaveChangesAsync();

            NotifyObservers(appointment, "Cancelled");  // 🔴 all three observers fire here too

            return (true, "Appointment cancelled successfully.");
        }

        public async Task<(bool Success, string Message)>
            RescheduleAppointmentAsync(int appointmentId, DateTime newDate, string requestedByRole)
        {
            var appointment = await _context.Appointments.FindAsync(appointmentId);
            if (appointment == null)
                return (false, "Appointment not found.");

            if (appointment.Status == "Completed")
                return (false, "Cannot reschedule a completed appointment.");

            // Patient 2-hour rule
            if (requestedByRole == "Patient")
            {
                var hoursUntil = (appointment.AppointmentDate - DateTime.UtcNow).TotalHours;
                if (hoursUntil < 2)
                    return (false, "Cannot reschedule — appointment is less than 2 hours away.");
            }

            // Alternative Flow A2: new slot already taken
            bool newSlotTaken = await _context.Appointments.AnyAsync(a =>
                a.DoctorId == appointment.DoctorId &&
                a.Id != appointmentId &&
                a.Status != "Cancelled" &&
                Math.Abs(EF.Functions.DateDiffMinute(a.AppointmentDate, newDate)) < 30);

            if (newSlotTaken)
                return (false, "The requested new time slot is not available. Please choose another.");

            appointment.AppointmentDate = newDate;
            appointment.Status          = "Pending";  // reset to Pending after reschedule
            await _context.SaveChangesAsync();

            NotifyObservers(appointment, "Rescheduled");

            return (true, "Appointment rescheduled successfully.");
        }

        // ─────────────────────────────────────────────────────────────────
        // USE CASE: Update Appointment Status (Doctor — Basic Flow step 2-4)
        // Pending → InProgress → Completed
        // ─────────────────────────────────────────────────────────────────
        public async Task<(bool Success, string Message)>
            UpdateStatusAsync(int appointmentId, string newStatus, int doctorId)
        {
            var appointment = await _context.Appointments.FindAsync(appointmentId);

            // Alternative Flow A1: invalid appointment
            if (appointment == null)
                return (false, "Appointment not found.");

            if (appointment.DoctorId != doctorId)
                return (false, "You are not authorised to update this appointment.");

            var allowed = new[] { "Pending", "InProgress", "Completed", "Cancelled" };
            if (!allowed.Contains(newStatus))
                return (false, $"Invalid status '{newStatus}'.");

            appointment.Status = newStatus;
            await _context.SaveChangesAsync();

            NotifyObservers(appointment, "StatusUpdated");  // real-time update to patient queue

            return (true, $"Status updated to '{newStatus}'.");
        }

        // ─────────────────────────────────────────────────────────────────
        // USE CASE: Manage Appointment Due to Doctor Unavailability
        // Pharmacist calls this to get all affected appointments for a doctor
        // ─────────────────────────────────────────────────────────────────
        public async Task<List<Appointment>> GetAffectedAppointmentsAsync(int doctorId)
        {
            return await _context.Appointments
                .Include(a => a.Patient)
                .Where(a => a.DoctorId == doctorId &&
                            a.Status == "Pending" &&
                            a.AppointmentDate > DateTime.UtcNow)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();
        }
    }
}