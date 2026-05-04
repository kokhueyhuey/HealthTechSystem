using HealthTech.API.Data;
using HealthTech.API.Factories;
using HealthTech.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace HealthTech.API.Controllers
{
    // This keeps the controller thin: it handles HTTP, not object construction.
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        // POST api/user/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserRequest request)
        {
            //bp
            IUserFactory factory;
            try
            {
                factory = UserFactoryProvider.GetFactory(request.Role);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }

            // TODO: Replace with: BCrypt.Net.BCrypt.HashPassword(request.Password)
            string passwordHash = request.Password; // ← replace with BCrypt in production

            // Call the factory
            User newUser = factory.CreateUser(
                request.Name,
                request.Email,
                passwordHash,
                request.PhoneNumber
            );


            if (newUser is Patient patient)
                _context.Patients.Add(patient);
            else if (newUser is Doctor doctor)
                _context.Doctors.Add(doctor);
            else if (newUser is Pharmacist pharmacist)
                _context.Pharmacists.Add(pharmacist);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"{newUser.Role} registered successfully.",
                id = newUser.Id,
                role = newUser.Role,
                name = newUser.Name
            });
        }


        //can see all three factories being called in one request (demo only)
        [HttpGet("demo")]
        public IActionResult Demo()
        {
            //bp
            var results = new List<object>();

            // --- Factory call 1: PatientFactory ---
            IUserFactory patientFactory = UserFactoryProvider.GetFactory("Patient");
            User patient = patientFactory.CreateUser("Alice Tan", "alice@email.com", "hashed_pw_1", "0123456789");
            results.Add(new {
                role = patient.Role,
                name = patient.Name,
                type = patient.GetType().Name,
                // Cast to Patient to show role-specific fields
                allergies = ((Patient)patient).Allergies,
                bloodType = ((Patient)patient).BloodType
            });

            // --- Factory call 2: DoctorFactory ---
            IUserFactory doctorFactory = UserFactoryProvider.GetFactory("Doctor");
            User doctor = doctorFactory.CreateUser("Dr. Lee Wei", "drlee@email.com", "hashed_pw_2", "0198765432");
            results.Add(new {
                role = doctor.Role,
                name = doctor.Name,
                type = doctor.GetType().Name,
                specialization = ((Doctor)doctor).Specialization,
                consultationFee = ((Doctor)doctor).ConsultationFee
            });

            // --- Factory call 3: PharmacistFactory ---
            IUserFactory pharmacistFactory = UserFactoryProvider.GetFactory("Pharmacist");
            User pharmacist = pharmacistFactory.CreateUser("Siti Aminah", "siti@email.com", "hashed_pw_3", "0167778888");
            results.Add(new {
                role = pharmacist.Role,
                name = pharmacist.Name,
                type = pharmacist.GetType().Name,
                canApproveInventory = ((Pharmacist)pharmacist).CanApproveInventory,
                shiftSchedule = ((Pharmacist)pharmacist).ShiftSchedule
            });

            return Ok(new
            {
                patternUsed = "Factory Method Pattern",
                entryPoint = "UserFactoryProvider.GetFactory(role)",
                usersCreated = results
            });
        }
    }


    public class RegisterUserRequest
    {
        public string Name        { get; set; } = string.Empty;
        public string Email       { get; set; } = string.Empty;
        public string Password    { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        // Role is sent by the frontend registration form dropdown:
        public string Role        { get; set; } = string.Empty;
    }
}