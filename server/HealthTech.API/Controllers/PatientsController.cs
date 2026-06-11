using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthTech.API.Data;
using HealthTech.API.Models;
using HealthTech.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace HealthTech.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PatientsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public PatientsController(AppDbContext context, IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        // GET: api/patients
        [HttpGet]
        public async Task<IActionResult> GetPatients([FromQuery] string? search)
        {
            var query = _context.Patients.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(p =>
                p.Name.Contains(search) ||
                p.ICNumber.Contains(search));
            }

            var patients = await query
                .OrderBy(p => p.Name)
                .Select(p => new {
                    p.Id,
                    p.Name,
                    p.Email,
                    p.PhoneNumber,
                    p.ICNumber,
                    p.Age,
                    p.BloodType,
                    p.Allergies,
                })
                .ToListAsync();

            return Ok(patients);
        }

        // POST: api/patients
        [HttpPost]
        public async Task<IActionResult> CreatePatient(Patient patient)
        {
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            // fortesting SignalR notification
            await _hub.Clients.All.SendAsync(
                "ReceivePatientUpdate",
                "refresh"
            );
            return Ok(patient);
        }

        // GET: api/patients/{id}/details
        [HttpGet("{id}/details")]
        public async Task<IActionResult> GetPatientDetails(int id)
        {
            var patient = await _context.Patients.FindAsync(id);

            if (patient == null)
                return NotFound(new { message = "Patient not found." });

            // Visit summary only
            var totalVisits = await _context.Appointments
                .CountAsync(a => a.PatientId == id);

            var lastVisit = await _context.Appointments
                .Where(a => a.PatientId == id)
                .OrderByDescending(a => a.AppointmentDate)
                .Select(a => (DateTime?)a.AppointmentDate)
                .FirstOrDefaultAsync();

            // Prescription history
            var prescriptions = await _context.Prescriptions
                .Include(p => p.Items)
                .Where(p => p.PatientId == id)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.AppointmentId,
                    p.Status,
                    p.NeedMc,
                    p.McReason,
                    p.McDays,
                    p.CreatedAt,

                    Items = p.Items.Select(item => new
                    {
                        item.Id,
                        item.MedicineName,
                        item.Dosage,
                        item.Quantity,
                        item.Preference,
                        item.UsageInstruction
                    })
                })
                .ToListAsync();

            return Ok(new
            {
                patient.Id,
                patient.Name,
                patient.Email,
                patient.PhoneNumber,
                patient.ICNumber,
                patient.Age,
                patient.BloodType,
                patient.Allergies,

                prescriptions,

                totalVisits,
                totalPrescriptions = prescriptions.Count,
                lastVisit
            });
        }
        /// UPDATE (PUT): api/patients/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePatient(int id, Patient updatedPatient)
        {
            // 1. Validation to prevent ID mismatch
            if (id != updatedPatient.Id)
                return BadRequest(new { message = "ID mismatch." });

            var patient = await _context.Patients.FindAsync(id);

            if (patient == null)
                return NotFound(new { message = "Patient not found." });

            // 2. Update all editable fields (Fixed)
            patient.Name = updatedPatient.Name;
            patient.Age = updatedPatient.Age;
            patient.Email = updatedPatient.Email;
            patient.PhoneNumber = updatedPatient.PhoneNumber;
            patient.ICNumber = updatedPatient.ICNumber;
            patient.BloodType = updatedPatient.BloodType;
            patient.Allergies = updatedPatient.Allergies;

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("ReceivePatientUpdate", "refresh");

            return Ok(patient);
        }
        
        /// DELETE: api/patients/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePatient(int id)
        {
            var patient = await _context.Patients.FindAsync(id);

            if (patient == null)
                return NotFound();

            _context.Patients.Remove(patient);
            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("ReceivePatientUpdate", "refresh");

            return Ok("Deleted successfully");
        }



    }
}