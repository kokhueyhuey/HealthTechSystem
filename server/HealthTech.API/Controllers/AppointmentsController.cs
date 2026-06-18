using HealthTech.API.Patterns.AppointmentObserver;
using HealthTech.API.Patterns.QueueObserver;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthTech.API.Data;
using HealthTech.API.Models;

namespace HealthTech.API.Controllers
{
    // CONCEPT — Architecture (Layered):
    //   Controller = HTTP layer only. It reads the request, calls the Service,
    //   and returns an HTTP response. Zero business logic lives here.
    //   This separation makes the Service independently testable.
    //
    // CONCEPT — Abstraction:
    //   The Controller talks to AppointmentService through its public methods.
    //   It never touches _observers, the DB context, or any observer class
    //   directly. Those implementation details are fully hidden.
    //
    // SOLID — DIP: depends on AppointmentService injected via constructor
    //   (in production you'd inject IAppointmentService interface —
    //    shown as a comment below for your reference).

    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppointmentService _service;
        private readonly QueueService _queueService;
        private readonly AppDbContext _context;

        public AppointmentsController(AppointmentService service, QueueService queueService, AppDbContext context)
        {
            _service = service;
            _queueService = queueService;
            _context = context;
        }

        // POST api/appointments/book 
        // USE CASE: Book Appointment — Basic Flow
        [HttpPost("book")]
        public async Task<IActionResult> Book([FromBody] BookRequest req)
        {
            if (req.AppointmentDate == default)
                return BadRequest(new { message = "Invalid appointment date." });

            var (success, message, result) = await _service.BookAppointmentAsync(
                req.PatientId, req.DoctorId, req.AppointmentDate, req.Notes ?? "");

            if (!success)
                return BadRequest(new { message });

            return Ok(new
            {
                message,
                appointmentId   = result!.Id,
                status          = result.Status,
                appointmentDate = result.AppointmentDate,
                patternNote     = "Observer pattern fired: PatientObserver + DoctorObserver + PharmacistObserver all received 'Booked' event."
            });
        }

        [HttpPost("walkin")]
        public async Task<IActionResult> WalkIn(
            [FromBody] WalkInRequest req)
        {
            var (success, message, result)
                = await _service.CreateWalkInAsync(
                    req.PatientId,
                    req.DoctorId,
                    req.Notes ?? "");

            if (!success)
                return BadRequest(new { message });

            return Ok(new
            {
                message,
                appointmentId = result!.Id,
                status = result.Status,
                appointmentDate = result.AppointmentDate
            });
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] DateTime? date)
        {
            IQueryable<Appointment> query = _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor);

            // 1. Filter by Name (Patient/Doctor) or ID (Appt/Doctor)
            if (!string.IsNullOrWhiteSpace(q))
            {
                if (int.TryParse(q, out int searchId))
                {
                    // Search by either Appointment ID OR Doctor ID
                    query = query.Where(a => a.Id == searchId || a.DoctorId == searchId);
                }
                else
                {
                    var lower = q.ToLower();
                    // Search by either Patient Name OR Doctor Name
                    query = query.Where(a => 
                        (a.Patient != null && a.Patient.Name.ToLower().Contains(lower)) ||
                        (a.Doctor != null && a.Doctor.Name.ToLower().Contains(lower))
                    );
                }
            }

            // 2. Filter by Date
            if (date.HasValue)
            {
                query = query.Where(a => a.AppointmentDate.Date == date.Value.Date);
            }

            // Default to today if no filters are provided to prevent loading the whole database
            if (string.IsNullOrWhiteSpace(q) && !date.HasValue)
            {
                var today = DateTime.Now.Date;
                query = query.Where(a => a.AppointmentDate.Date >= today);
            }

            var result = await query
                .OrderByDescending(a => a.AppointmentDate)
                .Take(50)
                .ToListAsync();

            return Ok(result.Select(a => new
            {
                a.Id,
                a.PatientId,
                patientName = a.Patient!.Name,
                patientPhone = a.Patient!.PhoneNumber ?? "—",
                a.DoctorId,
                doctorName = a.Doctor!.Name,
                a.AppointmentDate,
                a.Status,
                a.Notes
            }));
        }
        // GET api/appointments/patient/{patientId}
        // USE CASE: View Appointment Status — Basic Flow step 3-4
        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetByPatient(int patientId)
        {
            var list = await _service.GetAppointmentsByPatientAsync(patientId);

            if (!list.Any())
                return Ok(new { message = "No appointments available.", appointments = list });

            return Ok(list.Select(a => new
            {
                a.Id,
                a.DoctorId,
                doctorName      = a.Doctor?.Name ?? "—",
                a.AppointmentDate,
                a.Status,
                a.Notes
            }));
        }

        // GET api/appointments/doctor/{doctorId}?date=2026-05-10
        // USE CASE: View Daily Appointments — Basic Flow step 3-4
        [HttpGet("doctor/{doctorId}")]
        public async Task<IActionResult> GetByDoctor(int doctorId, [FromQuery] DateTime? date)
        {
            var list = await _service.GetAppointmentsByDoctorAsync(doctorId, date);

            if (!list.Any())
                return Ok(new { message = "No appointments scheduled.", appointments = list });

            return Ok(list.Select(a => new
            {
                a.Id,
                a.PatientId,
                patientName     = a.Patient?.Name ?? "—",
                a.AppointmentDate,
                a.Status,
                a.Notes
            }));
        }

        // PATCH api/appointments/{id}/cancel 
        // USE CASE: Cancel or Reschedule Appointment
        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id, [FromBody] RoleRequest req)
        {
            var (success, message) = await _service.CancelAppointmentAsync(id, req.Role);
            return success ? Ok(new { message }) : BadRequest(new { message });
        }

        // PATCH api/appointments/{id}/reschedule 
        // USE CASE: Cancel or Reschedule Appointment — Basic Flow step 4-6
        [HttpPatch("{id}/reschedule")]
        public async Task<IActionResult> Reschedule(int id, [FromBody] RescheduleRequest req)
        {
            var (success, message) = await _service.RescheduleAppointmentAsync(
                id, req.NewDate, req.Role);
            return success ? Ok(new { message }) : BadRequest(new { message });
        }

        // PATCH api/appointments/{id}/status 
        // USE CASE: Update Appointment Status (Doctor)
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateRequest req)
        {
            var (success, message) = await _service.UpdateStatusAsync(id, req.NewStatus, req.DoctorId);
            return success ? Ok(new { message }) : BadRequest(new { message });
        }

        // GET api/appointments/affected/{doctorId} 
        // USE CASE: Manage Appointment Due to Doctor Unavailability (Pharmacist)
        [HttpGet("affected/{doctorId}")]
        public async Task<IActionResult> GetAffected(int doctorId)
        {
            var list = await _service.GetAffectedAppointmentsAsync(doctorId);
            return Ok(list.Select(a => new
            {
                a.Id,
                a.PatientId,
                patientName     = a.Patient?.Name ?? "—",
                patientPhone    = a.Patient?.PhoneNumber ?? "—",
                a.AppointmentDate,
                a.Status
            }));
        }

        [HttpGet("current/{doctorId}")]
        public async Task<IActionResult> GetCurrentPatient(int doctorId)
        {
            var appointment = await _service.GetAppointmentsByDoctorAsync(doctorId, null);

            var current = appointment
                .FirstOrDefault(a => a.Status == "InConsultation");

            if (current == null)
            {
                return NotFound("No patient currently in consultation.");
            }

            return Ok(new
            {
                appointmentId = current.Id,
                patientId = current.PatientId,
                patientName = current.Patient?.Name ?? "Unknown",
                doctorId = current.DoctorId,
                status = current.Status
            });
        }

        // GET: api/appointments/booked-slots?doctorId=1&date=2025-01-15
        [HttpGet("booked-slots")]
        public IActionResult GetBookedSlots([FromQuery] int doctorId, [FromQuery] string date)
        {
            if (!DateOnly.TryParse(date, out var parsedDate))
                return BadRequest("Invalid date.");

            var bookedTimes = _context.Appointments
                .Where(a => a.DoctorId == doctorId
                        && DateOnly.FromDateTime(a.AppointmentDate) == parsedDate
                        && a.Status != "Cancelled") // <-- FIXED: Changed to string "Cancelled"
                .Select(a => a.AppointmentDate.ToString("HH:mm"))
                .ToList();

            return Ok(bookedTimes);
        }

        // GET: api/appointments/affected-by-unavailability?doctorId=1
        [HttpGet("affected-by-unavailability")]
        public async Task<IActionResult> GetAffectedByUnavailability([FromQuery] int doctorId)
        {
            // Load all future unavailability windows for this doctor
            var unavailabilities = await _context.DoctorUnavailabilities
                .Where(u => u.DoctorId == doctorId && u.Date >= DateOnly.FromDateTime(DateTime.Now))
                .ToListAsync();

            if (!unavailabilities.Any())
                return Ok(new List<object>());

            // Load all non-cancelled future appointments for this doctor
            var appointments = await _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .Where(a => a.DoctorId == doctorId &&
                            a.Status != "Cancelled" &&
                            a.AppointmentDate >= DateTime.Now)
                .ToListAsync();

            // Filter: appointments whose date+hour fall inside any unavailability window
            var affected = appointments.Where(a => unavailabilities.Any(u =>
                DateOnly.FromDateTime(a.AppointmentDate) == u.Date &&
                TimeSpan.FromHours(a.AppointmentDate.Hour) >= u.StartTime &&
                TimeSpan.FromHours(a.AppointmentDate.Hour) < u.EndTime
            )).ToList();

            return Ok(affected.Select(a => new {
                a.Id,
                a.PatientId,
                patientName  = a.Patient?.Name ?? "—",
                patientPhone = a.Patient?.PhoneNumber ?? "—",
                a.DoctorId,
                doctorName   = a.Doctor?.Name ?? "—",
                a.AppointmentDate,
                a.Status,
                a.Notes,
                unavailabilityReason = unavailabilities
                    .Where(u =>
                        DateOnly.FromDateTime(a.AppointmentDate) == u.Date &&
                        TimeSpan.FromHours(a.AppointmentDate.Hour) >= u.StartTime &&
                        TimeSpan.FromHours(a.AppointmentDate.Hour) < u.EndTime)
                    .Select(u => u.Reason)
                    .FirstOrDefault() ?? ""
            }));
        }

        // GET: api/appointments/all-affected — all doctors (pharmacist overview)
        [HttpGet("all-affected")]
        public async Task<IActionResult> GetAllAffected()
        {
            var today = DateOnly.FromDateTime(DateTime.Now);

            var unavailabilities = await _context.DoctorUnavailabilities
                .Where(u => u.Date >= today)
                .ToListAsync();

            if (!unavailabilities.Any()) return Ok(new List<object>());

            var appointments = await _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .Where(a => a.Status != "Cancelled" && a.AppointmentDate >= DateTime.Now)
                .ToListAsync();

            var affected = appointments.Where(a => unavailabilities.Any(u =>
                a.DoctorId == u.DoctorId &&
                DateOnly.FromDateTime(a.AppointmentDate) == u.Date &&
                TimeSpan.FromHours(a.AppointmentDate.Hour) >= u.StartTime &&
                TimeSpan.FromHours(a.AppointmentDate.Hour) < u.EndTime
            )).ToList();

            return Ok(affected.Select(a => {
                var reason = unavailabilities
                    .Where(u =>
                        a.DoctorId == u.DoctorId &&
                        DateOnly.FromDateTime(a.AppointmentDate) == u.Date &&
                        TimeSpan.FromHours(a.AppointmentDate.Hour) >= u.StartTime &&
                        TimeSpan.FromHours(a.AppointmentDate.Hour) < u.EndTime)
                    .Select(u => u.Reason)
                    .FirstOrDefault() ?? "";
                return new {
                    a.Id, a.PatientId,
                    patientName  = a.Patient?.Name ?? "—",
                    patientPhone = a.Patient?.PhoneNumber ?? "—",
                    a.DoctorId,
                    doctorName   = a.Doctor?.Name ?? "—",
                    a.AppointmentDate,
                    a.Status, a.Notes,
                    unavailabilityReason = reason
                };
            }));
        }
    }

    // Request DTOs 
    // CONCEPT — Encapsulation: these DTOs carry only the data the endpoint needs.
    // Internal model fields (Status, CreatedAt) are never exposed on input.

    public class BookRequest
    {
        public int      PatientId       { get; set; }
        public int      DoctorId        { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string?  Notes           { get; set; }
    }

    public class RoleRequest
    {
        public string Role { get; set; } = "Patient"; // "Patient" | "Pharmacist"
    }

    public class RescheduleRequest
    {
        public DateTime NewDate { get; set; }
        public string   Role    { get; set; } = "Patient";
    }

    public class StatusUpdateRequest
    {
        public int    DoctorId  { get; set; }
        public string NewStatus { get; set; } = string.Empty; // Pending | InProgress | Completed
    }
    public class WalkInRequest
    {
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public string? Notes { get; set; }
    }
}