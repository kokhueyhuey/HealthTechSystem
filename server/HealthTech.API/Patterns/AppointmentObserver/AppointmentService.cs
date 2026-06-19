using HealthTech.API.Data;
using HealthTech.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HealthTech.API.Patterns.AppointmentObserver{
    // ─────────────────────────────────────────────────────────────────────────
    // OBSERVER PATTERN — The Subject (Concrete)
    //
    // Maintains the observer list and notifies all observers on every
    // appointment lifecycle event.
    //
    // CONCEPT — Architecture (Layered):
    //   Controller → Service (here) → Database
    //   Controller: HTTP only. Service: business rules + pattern.
    //   DB: persistence. Each layer has exactly one responsibility.
    //
    // CONCEPT — Encapsulation:
    //   _observers is private. Nobody outside can manipulate the list.
    //   Validation logic (slot taken, 2-hour rule) is hidden inside here.
    //
    // CONCEPT — Modularity:
    //   AppointmentService only deals with appointments.
    //   Queue, prescriptions, inventory are separate services/modules.
    //
    // CONCEPT — Refactoring:
    //   All notification logic is centralised here — not scattered in controllers.
    //
    // SOLID — SRP: owns appointment lifecycle only.
    // SOLID — DIP: depends on IAppointmentObserver (interface), not concrete classes.
    // SOLID — OCP: register new observers without changing this class.
    // ─────────────────────────────────────────────────────────────────────────

    public class AppointmentService : IAppointmentSubject
    {
        private readonly AppDbContext _context;

        // CONCEPT — Encapsulation: private list, mutated only through Register/Remove
        private readonly List<IAppointmentObserver> _observers = new();

        // SignalRAppointmentObserver is injected via DI because it needs
        // IHubContext<AppointmentHub> — which only DI can provide.
        // The other 3 observers are pure logic (no dependencies), so new() is fine.
        //
        // CONCEPT — Refinement:
        //   High-level: "notify relevant parties after each appointment event"
        //   Refined into 4 concrete observers registered here.
        public AppointmentService(AppDbContext context, SignalRAppointmentObserver signalRObserver)
        {
            _context = context;

            RegisterObserver(new PatientObserver());      // console log — patient notification
            RegisterObserver(new DoctorObserver());       // console log — doctor schedule update
            RegisterObserver(new PharmacistObserver());   // console log — pharmacist action alert
            RegisterObserver(signalRObserver);            // SignalR  — real-time frontend push
        }

        public void RegisterObserver(IAppointmentObserver observer)
        {
            _observers.Add(observer);
        }

        public void RemoveObserver(IAppointmentObserver observer)
        {
            _observers.Remove(observer);
        }

        // BREAKPOINT HERE — step through the foreach to watch each observer fire:
        // 1st: PatientObserver.Update()     → console
        // 2nd: DoctorObserver.Update()      → console
        // 3rd: PharmacistObserver.Update()  → console
        // 4th: SignalRAppointmentObserver.Update() → frontend browser updates live
        public void NotifyObservers(Appointment appointment, string eventType)
        {
            foreach (var observer in _observers) 
            {
                observer.Update(appointment, eventType);
            }
        }

        // Book Appointment 
        public async Task<(bool Success, string Message, Appointment? Result)>
            BookAppointmentAsync(int patientId, int doctorId, DateTime appointmentDate, string notes = "")
        {
            bool slotTaken = await _context.Appointments.AnyAsync(a =>
                a.DoctorId == doctorId &&
                a.Status != "Cancelled" &&
                Math.Abs(EF.Functions.DateDiffMinute(a.AppointmentDate, appointmentDate)) < 30);

            if (slotTaken)
                return (false, "Selected time slot is already taken. Please choose another slot.", null);

            var doctor = await _context.Doctors.FindAsync(doctorId);
            if (doctor == null)
                return (false, "No available slots — doctor not found.", null);

            if (appointmentDate <= DateTime.Now)
                return (false, "Appointment date must be in the future.", null);

            var appointment = new Appointment
            {
                PatientId       = patientId,
                DoctorId        = doctorId,
                AppointmentDate = appointmentDate,
                Status          = "Pending",   
                Notes           = notes
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            NotifyObservers(appointment, "Booked");

            return (true, "Appointment booked successfully.", appointment);
        }

        public async Task<(bool Success, string Message, Appointment? Result)>
            CreateWalkInAsync(int patientId, int doctorId, string notes)
        {
            var patient = await _context.Patients.FindAsync(patientId);
            if (patient == null)
                return (false, "Patient not found.", null);

            var doctor = await _context.Doctors.FindAsync(doctorId);
            if (doctor == null)
                return (false, "Doctor not found.", null);

            var appointment = new Appointment
            {
                PatientId = patientId,
                DoctorId = doctorId,
                AppointmentDate = DateTime.Now,
                Status = "Pending",
                Notes = notes
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            NotifyObservers(appointment, "WalkIn");

            return (true, "Walk-in created.", appointment);
        }
        // ─────────────────────────────────────────────────────────────────
        // USE CASE: View Appointment Status (Patient) / View Daily Appointments (Doctor)
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
        // Fetch a single appointment by ID (used by GetCurrentPatient endpoint)
        // ─────────────────────────────────────────────────────────────────
        public async Task<Appointment?> GetAppointmentByIdAsync(int appointmentId)
        {
            return await _context.Appointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == appointmentId);
        }

        // ─────────────────────────────────────────────────────────────────
        // USE CASE: Cancel Appointment
        // Patient role → 2-hour rule enforced
        // Pharmacist role → no restriction (doctor unavailability use case)
        // ─────────────────────────────────────────────────────────────────
        public async Task<(bool Success, string Message)>
            CancelAppointmentAsync(int appointmentId, string requestedByRole)
        {
            var appointment = await _context.Appointments.FindAsync(appointmentId);
            if (appointment == null)
                return (false, "Appointment not found.");

            // Alternative Flow A3: already completed
            if (appointment.Status == "Completed")
                return (false, "Cannot cancel a completed appointment.");

            // Alternative Flow A1: patient 2-hour restriction
            if (requestedByRole == "Patient")
            {
                var hoursUntil = (appointment.AppointmentDate - DateTime.Now).TotalHours;
                if (hoursUntil < 2)
                    return (false, "Cannot cancel — appointment is less than 2 hours away. Please call the clinic.");
            }

            appointment.Status = "Cancelled";
            await _context.SaveChangesAsync();

            NotifyObservers(appointment, "Cancelled"); // all 4 observers fire + SignalR push
            return (true, "Appointment cancelled successfully.");
        }

        // ─────────────────────────────────────────────────────────────────
        // USE CASE: Reschedule Appointment
        // ─────────────────────────────────────────────────────────────────
        public async Task<(bool Success, string Message)>
            RescheduleAppointmentAsync(int appointmentId, DateTime newDate, string requestedByRole)
        {
            var appointment = await _context.Appointments.FindAsync(appointmentId);
            if (appointment == null)
                return (false, "Appointment not found.");

            if (appointment.Status == "Completed")
                return (false, "Cannot reschedule a completed appointment.");

            if (requestedByRole == "Patient")
            {
                var hoursUntil = (appointment.AppointmentDate - DateTime.Now).TotalHours;
                if (hoursUntil < 2)
                    return (false, "Cannot reschedule — appointment is less than 2 hours away.");
            }

            // Alternative Flow A2: new slot taken
            bool newSlotTaken = await _context.Appointments.AnyAsync(a =>
                a.DoctorId == appointment.DoctorId &&
                a.Id != appointmentId &&
                a.Status != "Cancelled" &&
                Math.Abs(EF.Functions.DateDiffMinute(a.AppointmentDate, newDate)) < 30);

            if (newSlotTaken)
                return (false, "The requested new time slot is not available. Please choose another.");

            appointment.AppointmentDate = newDate;
            appointment.Status          = "Pending";
            await _context.SaveChangesAsync();

            NotifyObservers(appointment, "Rescheduled"); // all 4 observers + SignalR push
            return (true, "Appointment rescheduled successfully.");
        }

        // ─────────────────────────────────────────────────────────────────
        // USE CASE: Update Appointment Status (Doctor — steps 1-4)
        // Allowed manual statuses: Pending → Cancelled only.
        // InQueue, InConsultation, Completed are set by QueueService.
        // ─────────────────────────────────────────────────────────────────
        public async Task<(bool Success, string Message)>
            UpdateStatusAsync(int appointmentId, string newStatus, int doctorId)
        {
            var appointment = await _context.Appointments.FindAsync(appointmentId);

            if (appointment == null)
                return (false, "Appointment not found.");

            if (appointment.DoctorId != doctorId)
                return (false, "You are not authorised to update this appointment.");

            // Doctor can only manually set Pending or Cancelled.
            // InQueue / InConsultation / Completed are owned by QueueService.
            var allowed = new[] { "Pending", "Cancelled" };
            if (!allowed.Contains(newStatus))
                return (false, $"Doctors can only set status to Pending or Cancelled. " +
                               $"InQueue/InConsultation/Completed are managed by the Queue system.");

            appointment.Status = newStatus;
            await _context.SaveChangesAsync();

            NotifyObservers(appointment, "StatusUpdated"); // SignalR push → patient queue refreshes
            return (true, $"Status updated to '{newStatus}'.");
        }

        // ─────────────────────────────────────────────────────────────────
        // USE CASE: Manage Appointment Due to Doctor Unavailability (Pharmacist)
        // ─────────────────────────────────────────────────────────────────
        public async Task<List<Appointment>> GetAffectedAppointmentsAsync(int doctorId)
        {
            return await _context.Appointments
                .Include(a => a.Patient)
                .Where(a => a.DoctorId == doctorId &&
                            a.Status == "Pending" &&
                            a.AppointmentDate > DateTime.Now)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();
        }

        // ─────────────────────────────────────────────────────────────────
        // Doctor Unavailability Notification
        // Used when unavailable slots are created or removed.
        // Triggers all observers including SignalR.
        // ─────────────────────────────────────────────────────────────────
        public async Task<(bool Success, string Message, int AffectedBookings, string? Warning)>
        CreateDoctorUnavailabilityAsync(int doctorId, string dateString, int startHour, int endHour, string? reason)
        {
            if (!DateOnly.TryParse(dateString, out var date))
            {
                return (false, "Invalid date.", 0, null);
            }

            var apptOnDate = await _context.Appointments
                .Where(a =>
                    a.DoctorId == doctorId &&
                    DateOnly.FromDateTime(a.AppointmentDate) == date &&
                    a.Status != "Cancelled")
                .ToListAsync();

            var affectedAppointments = apptOnDate
                .Where(a =>
                    a.AppointmentDate.Hour >= startHour &&
                    a.AppointmentDate.Hour < endHour)
                .ToList();

            var unavailability = new DoctorUnavailability
            {
                DoctorId = doctorId,
                Date = date,
                StartTime = TimeSpan.FromHours(startHour),
                EndTime = TimeSpan.FromHours(endHour),
                Reason = reason ?? ""
            };

            _context.DoctorUnavailabilities.Add(unavailability);

            await _context.SaveChangesAsync();

            foreach (var appointment in affectedAppointments)
            {
                NotifyObservers(appointment, "Unavailable");
            }

            return (
                true,
                "Unavailability saved.",
                affectedAppointments.Count,
                affectedAppointments.Count > 0
                    ? $"{affectedAppointments.Count} existing appointment(s) are affected. The pharmacist will be notified and assist with rescheduling the appointments."
                    : null
            );
        }

        public async Task<(bool Success, string Message)>
        DeleteDoctorUnavailabilityAsync(int id)
        {
            var item = await _context.DoctorUnavailabilities.FindAsync(id);

            if (item == null)
            {
                return (false, "Unavailability not found.");
            }

            _context.DoctorUnavailabilities.Remove(item);

            await _context.SaveChangesAsync();

            return (true, "Unavailability removed.");
        }
    }
}