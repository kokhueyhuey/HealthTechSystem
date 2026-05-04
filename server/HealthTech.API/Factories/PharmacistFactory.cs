using HealthTech.API.Models;

namespace HealthTech.API.Factories
{
    public class PharmacistFactory : IUserFactory
    {
        public User CreateUser(string name, string email, string passwordHash, string phoneNumber)
        {
            // ⬇ BREAKPOINT HERE — this is the Factory Method executing for a Pharmacist.
            return new Pharmacist
            {
                Name = name,
                Email = email,
                PasswordHash = passwordHash,
                PhoneNumber = phoneNumber,
                Role = "Pharmacist",
                ShiftSchedule = "Mon-Sun 9:00am-5:00pm",
                CanApproveInventory = true,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}