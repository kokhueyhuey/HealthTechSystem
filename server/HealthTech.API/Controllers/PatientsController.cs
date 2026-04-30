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
        public async Task<IActionResult> GetPatients()
        {
            var patients = await _context.Patients.ToListAsync();
            return Ok(patients);
        }

        // POST: api/patients
        [HttpPost]
        public async Task<IActionResult> CreatePatient(Patient patient)
        {
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            Console.WriteLine("🔥 SignalR triggered");

            // fortesting SignalR notification
            await _hub.Clients.All.SendAsync(
                "ReceivePatientUpdate",
                "refresh"
            );
            return Ok(patient);
        }

        /// UPDATE (PUT): api/patients/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePatient(int id, Patient updatedPatient)
        {
            var patient = await _context.Patients.FindAsync(id);

            if (patient == null)
                return NotFound();

            patient.Name = updatedPatient.Name;
            patient.Age = updatedPatient.Age;

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