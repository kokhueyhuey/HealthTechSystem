using HealthTech.API.Models;

namespace HealthTech.API.Factories
{
    //where the interface define contracts
    public interface IUserFactory
    {
        User CreateUser(string name, string email, string passwordHash, string phoneNumber);
    }
}