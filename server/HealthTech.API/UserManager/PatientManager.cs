using HealthTech.API.Controllers;
using HealthTech.API.Models;

namespace HealthTech.API.Factories
{
    public class PatientFactory : IUserFactory
    {
        public User CreateUser(RegisterUserRequest request)
        {
            if (string.IsNullOrEmpty(request.ICNumber) || request.ICNumber.Length < 4)
                throw new ArgumentException("Patient registration requires a valid IC Number.");

            string lastFourIC = request.ICNumber.Substring(request.ICNumber.Length - 4);

            return new Patient
            {
                Name = request.Name,
                Email = request.Email,
                PasswordHash = lastFourIC, 
                PhoneNumber = request.PhoneNumber,
                Role = "Patient",
                Age = request.Age,
                ICNumber = request.ICNumber,
                Allergies = "None",
                BloodType = "Unknown",
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}