using HealthTech.API.Data;
using HealthTech.API.Factories;
using HealthTech.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthTech.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }


        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserRequest request)
        {
            // factory bp
            IUserFactory factory;
            try
            {
                factory = UserFactoryProvider.GetFactory(request.Role);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            // Check email uniqueness across all three tables.
            bool emailExists =
                await _context.Patients.AnyAsync(p => p.Email == request.Email) ||
                await _context.Doctors.AnyAsync(d => d.Email == request.Email) ||
                await _context.Pharmacists.AnyAsync(ph => ph.Email == request.Email);

            if (emailExists)
                return BadRequest(new { message = "Email already registered." });

            User newUser = factory.CreateUser(
                request.Name,
                request.Email,
                request.Password,
                request.PhoneNumber
            );

            if (newUser is Patient patient)         _context.Patients.Add(patient);
            else if (newUser is Doctor doctor)       _context.Doctors.Add(doctor);
            else if (newUser is Pharmacist pharm)    _context.Pharmacists.Add(pharm);

            await _context.SaveChangesAsync();

            return Ok(new { message = $"{newUser.Role} registered successfully.", id = newUser.Id, role = newUser.Role, name = newUser.Name });
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            User? foundUser = request.Role switch
            {
                "Patient"    => await _context.Patients.FirstOrDefaultAsync(p => p.Email == request.Email) as User,
                "Doctor"     => await _context.Doctors.FirstOrDefaultAsync(d => d.Email == request.Email) as User,
                "Pharmacist" => await _context.Pharmacists.FirstOrDefaultAsync(ph => ph.Email == request.Email) as User,
                _            => null
            };

            if (foundUser == null)
                return Unauthorized(new { message = "Invalid email or role." });

            if (foundUser.PasswordHash != request.Password)
                return Unauthorized(new { message = "Invalid password." });

            return Ok(new { id = foundUser.Id, name = foundUser.Name, role = foundUser.Role, email = foundUser.Email });
        }

        // GET api/user/demo (in swagger)
        [HttpGet("demo")]
        public IActionResult Demo()
        {
            var results = new List<object>();

            IUserFactory pf = UserFactoryProvider.GetFactory("Patient");
            User p = pf.CreateUser("Alice Tan", "alice@email.com", "pw", "0123456789");
            results.Add(new { role = p.Role, name = p.Name, type = p.GetType().Name, allergies = ((Patient)p).Allergies, bloodType = ((Patient)p).BloodType });

            IUserFactory df = UserFactoryProvider.GetFactory("Doctor");
            User d = df.CreateUser("Dr. Lee Wei", "drlee@email.com", "pw", "0198765432");
            results.Add(new { role = d.Role, name = d.Name, type = d.GetType().Name, specialization = ((Doctor)d).Specialization, consultationFee = ((Doctor)d).ConsultationFee });

            IUserFactory phf = UserFactoryProvider.GetFactory("Pharmacist");
            User ph = phf.CreateUser("Siti Aminah", "siti@email.com", "pw", "0167778888");
            results.Add(new { role = ph.Role, name = ph.Name, type = ph.GetType().Name, canApproveInventory = ((Pharmacist)ph).CanApproveInventory, shiftSchedule = ((Pharmacist)ph).ShiftSchedule });

            return Ok(new { patternUsed = "Factory Method Pattern", entryPoint = "UserFactoryProvider.GetFactory(role)", usersCreated = results });
        }
    }

    public class RegisterUserRequest
    {
        public string Name        { get; set; } = string.Empty;
        public string Email       { get; set; } = string.Empty;
        public string Password    { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role        { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email    { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        // WHY Role is here: backend searches different tables per role.
        // Frontend login form has a role dropdown for this reason.
        public string Role     { get; set; } = string.Empty;
    }
}