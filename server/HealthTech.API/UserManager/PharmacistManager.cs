using HealthTech.API.Models;
using HealthTech.API.Controllers; 

namespace HealthTech.API.Factories
{
    public class PharmacistFactory : IUserFactory
    {
        public User CreateUser(RegisterUserRequest request)
        {
            return new Pharmacist
            {
                Name = request.Name,
                Email = request.Email,
                PasswordHash = request.Password,
                PhoneNumber = request.PhoneNumber,
                Role = "Pharmacist",
                ShiftSchedule = "Mon-Sun 9:00am-5:00pm",
                CanApproveInventory = true,
                CreatedAt = DateTime.Now
            };
        }
    }
}