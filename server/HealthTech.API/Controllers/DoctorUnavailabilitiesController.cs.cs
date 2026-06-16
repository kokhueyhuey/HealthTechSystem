using HealthTech.API.Data;
using HealthTech.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthTech.API.Services;

namespace HealthTech.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DoctorUnavailabilitiesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AppointmentService _appointmentService;

        public DoctorUnavailabilitiesController(AppDbContext context, AppointmentService appointmentService)
        {
            _context = context;
            _appointmentService = appointmentService;
        }

        // GET: api/doctorunavailabilities?doctorId=1
        [HttpGet]
        public async Task<IActionResult> GetByDoctor([FromQuery] int doctorId)
        {
            var list = await _context.DoctorUnavailabilities
                .Where(u => u.DoctorId == doctorId && u.Date >= DateOnly.FromDateTime(DateTime.UtcNow))
                .OrderBy(u => u.Date).ThenBy(u => u.StartTime)
                .ToListAsync();

            return Ok(list.Select(u => new {
                u.Id, u.DoctorId,
                date      = u.Date.ToString("yyyy-MM-dd"),
                startTime = u.StartTime.ToString(@"hh\:mm"),
                endTime   = u.EndTime.ToString(@"hh\:mm"),
                u.Reason
            }));
        }

        // POST: api/doctorunavailabilities
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUnavailabilityRequest req)
        {
            try
            {
                if (!DateOnly.TryParse(req.Date, out var date))
                    return BadRequest(new { message = "Invalid date." });

                // Pull to client first, then filter in memory (EF can't translate TimeSpan.FromHours)
                var apptOnDate = await _context.Appointments
                    .Where(a => a.DoctorId == req.DoctorId &&
                                DateOnly.FromDateTime(a.AppointmentDate) == date &&
                                a.Status != "Cancelled")
                    .ToListAsync();

                var affectedCount = apptOnDate.Count(a =>
                    a.AppointmentDate.Hour >= req.StartHour &&
                    a.AppointmentDate.Hour < req.EndHour);

                var unavailability = new DoctorUnavailability
                {
                    DoctorId  = req.DoctorId,
                    Date      = date,
                    StartTime = TimeSpan.FromHours(req.StartHour),
                    EndTime   = TimeSpan.FromHours(req.EndHour),
                    Reason    = req.Reason ?? ""
                };

                _context.DoctorUnavailabilities.Add(unavailability);
                await _context.SaveChangesAsync();

                _appointmentService.NotifyAffectedAppointmentsChanged(req.DoctorId);

                return Ok(new {
                    message          = "Unavailability saved.",
                    affectedBookings = affectedCount,
                    warning          = affectedCount > 0
                        ? $"{affectedCount} existing appointment(s) are affected. The pharmacist will be notified and assist with rescheduling the appointments."
                        : (string?)null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        // DELETE: api/doctorunavailabilities/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.DoctorUnavailabilities.FindAsync(id);
            if (item == null) return NotFound();
            _context.DoctorUnavailabilities.Remove(item);
            await _context.SaveChangesAsync();

            _appointmentService.NotifyAffectedAppointmentsChanged(item.DoctorId);

            return Ok(new { message = "Unavailability removed." });
        }

        
    }

    public class CreateUnavailabilityRequest
    {
        public int     DoctorId  { get; set; }
        public string  Date      { get; set; } = string.Empty;
        public int     StartHour { get; set; }
        public int     EndHour   { get; set; }
        public string? Reason    { get; set; }
    }
}