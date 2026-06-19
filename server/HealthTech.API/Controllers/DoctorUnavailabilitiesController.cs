using HealthTech.API.Data;
using HealthTech.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthTech.API.Patterns.AppointmentObserver;

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
                .Where(u => u.DoctorId == doctorId && u.Date >= DateOnly.FromDateTime(DateTime.Now))
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
            var result =
                await _appointmentService.CreateDoctorUnavailabilityAsync(
                    req.DoctorId,
                    req.Date,
                    req.StartHour,
                    req.EndHour,
                    req.Reason);

            if (!result.Success)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(new
            {
                message = result.Message,
                affectedBookings = result.AffectedBookings,
                warning = result.Warning
            });
        }

        // DELETE: api/doctorunavailabilities/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result =
                await _appointmentService.DeleteDoctorUnavailabilityAsync(id);

            if (!result.Success)
            {
                return NotFound(new
                {
                    message = result.Message
                });
            }

            return Ok(new
            {
                message = result.Message
            });
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