using HealthTech.API.Models;

namespace HealthTech.API.Factories
{
    public class DoctorFactory : IUserFactory
    {
        public User CreateUser(string name, string email, string passwordHash, string phoneNumber)
        {
            // ⬇ BREAKPOINT HERE — this is the Factory Method executing for a Doctor.
            return new Doctor
            {
                Name = name,
                Email = email,
                PasswordHash = passwordHash,
                PhoneNumber = phoneNumber,
                Role = "Doctor",
                Specialization = "General Practice",
                WorkSchedule = "Mon-Fri 9:00am-5:00pm", 
                ConsultationFee = 30.00m,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}