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

            User newUser = factory.CreateUser(request);

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
            // Pass the object instead of 4 strings!
            User p = pf.CreateUser(new RegisterUserRequest { Name = "Alice", Email = "alice@email.com", ICNumber = "1234", PhoneNumber = "012", Role = "Patient" });
            results.Add(new { role = p.Role, name = p.Name });

            IUserFactory df = UserFactoryProvider.GetFactory("Doctor");
            User d = df.CreateUser(new RegisterUserRequest { Name = "Dr. Lee", Email = "lee@email.com", Password = "pw", PhoneNumber = "019", Role = "Doctor" });
            results.Add(new { role = d.Role, name = d.Name });

            return Ok(new { patternUsed = "Factory Method", usersCreated = results });
        }

        [HttpPost("admin/create-doctor")]
        public async Task<IActionResult> AdminCreateDoctor([FromBody] RegisterUserRequest request)
        {
            request.Role = "Doctor";
            IUserFactory factory = UserFactoryProvider.GetFactory(request.Role);

            if (await _context.Doctors.AnyAsync(d => d.Email == request.Email))
                return BadRequest(new { message = "Email already in use by another doctor."});

            User newDoctor = factory.CreateUser(request);

            _context.Doctors.Add((Doctor)newDoctor);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Doctor created successfully.", id = newDoctor.Id });
        }
        
        [HttpDelete("admin/delete-doctor/{id}")]
        public async Task<IActionResult> AdminDeleteDoctor(int id)
        {
            var doctor = await _context.Doctors.FindAsync(id);
            if (doctor == null) return NotFound(new { message = "Doctor not found." });

            _context.Doctors.Remove(doctor);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Doctor deleted successfully." });
        }
    }            

    public class RegisterUserRequest
    {
        public string Name        { get; set; } = string.Empty;
        public string Email       { get; set; } = string.Empty;
        public string Password    { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role        { get; set; } = string.Empty;
        public string? ICNumber   { get; set; } 
        public int Age { get; set; }
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