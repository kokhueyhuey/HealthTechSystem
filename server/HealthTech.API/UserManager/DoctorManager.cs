using HealthTech.API.Controllers;
using HealthTech.API.Models;

namespace HealthTech.API.Factories
{
    public class DoctorFactory : IUserFactory
    {
        public User CreateUser(RegisterUserRequest request)
        {
            if (string.IsNullOrEmpty(request.Password)) 
                throw new ArgumentException("Password required for Doctors.");

            return new Doctor
            {
                Name = request.Name,
                Email = request.Email,
                PasswordHash = request.Password, 
                PhoneNumber = request.PhoneNumber,
                Role = "Doctor",
                Specialization = "General Practice",
                WorkSchedule = "Mon-Sun 9:00am-5:00pm",
                WorkStartTime = new TimeSpan(9, 0, 0),  
                WorkEndTime = new TimeSpan(19, 0, 0), 
                ConsultationFee = 30.00m,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}