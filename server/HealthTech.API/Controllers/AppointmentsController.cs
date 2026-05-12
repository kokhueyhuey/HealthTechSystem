using HealthTech.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace HealthTech.API.Controllers
{
    // ─────────────────────────────────────────────────────────────────────────
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
    // ─────────────────────────────────────────────────────────────────────────

    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppointmentService _service;

        public AppointmentsController(AppointmentService service)
        {
            _service = service;
        }

        // ── POST api/appointments/book 
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

        // ── GET api/appointments/patient/{patientId}
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

        // ── GET api/appointments/doctor/{doctorId}?date=2026-05-10
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

        // ── PATCH api/appointments/{id}/cancel 
        // USE CASE: Cancel or Reschedule Appointment
        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id, [FromBody] RoleRequest req)
        {
            var (success, message) = await _service.CancelAppointmentAsync(id, req.Role);
            return success ? Ok(new { message }) : BadRequest(new { message });
        }

        // ── PATCH api/appointments/{id}/reschedule 
        // USE CASE: Cancel or Reschedule Appointment — Basic Flow step 4-6
        [HttpPatch("{id}/reschedule")]
        public async Task<IActionResult> Reschedule(int id, [FromBody] RescheduleRequest req)
        {
            var (success, message) = await _service.RescheduleAppointmentAsync(
                id, req.NewDate, req.Role);
            return success ? Ok(new { message }) : BadRequest(new { message });
        }

        // ── PATCH api/appointments/{id}/status 
        // USE CASE: Update Appointment Status (Doctor)
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateRequest req)
        {
            var (success, message) = await _service.UpdateStatusAsync(id, req.NewStatus, req.DoctorId);
            return success ? Ok(new { message }) : BadRequest(new { message });
        }

        // ── GET api/appointments/affected/{doctorId} 
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
}