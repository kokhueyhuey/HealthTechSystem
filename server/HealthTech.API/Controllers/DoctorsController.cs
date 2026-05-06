using Microsoft.AspNetCore.Mvc;
using HealthTech.API.Data;
using HealthTech.API.Models;

namespace HealthTech.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DoctorsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DoctorsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/doctors
        [HttpGet]
        public IActionResult GetDoctors()
        {
            var doctors = _context.Doctors.ToList();
            return Ok(doctors);
        }

        // GET: api/doctors/1
        [HttpGet("{id}")]
        public IActionResult GetDoctor(int id)
        {
            var doctor = _context.Doctors.Find(id);
            if (doctor == null) return NotFound();

            return Ok(doctor);
        }

        // POST: api/doctors
        [HttpPost]
        public IActionResult CreateDoctor(Doctor doctor)
        {
            _context.Doctors.Add(doctor);
            _context.SaveChanges();
            return Ok(doctor);
        }
    }
}