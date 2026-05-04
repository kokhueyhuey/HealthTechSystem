using HealthTech.API.Models;

namespace HealthTech.API.Factories
{
    public class PatientFactory : IUserFactory
    {
        public User CreateUser(string name, string email, string passwordHash, string phoneNumber)
        {
            // ⬇ BREAKPOINT HERE — this is where the Patient object is constructed.
            // When your instructor says "put a breakpoint on the entry of the pattern",
            // this return statement is the moment the Factory Method executes.
            return new Patient
            {
                Name = name,
                Email = email,
                PasswordHash = passwordHash,
                PhoneNumber = phoneNumber,
                Role = "Patient", 
                Allergies = "None",
                BloodType = "Unknown",
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}