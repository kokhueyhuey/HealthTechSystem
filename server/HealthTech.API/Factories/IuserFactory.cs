using HealthTech.API.Models;
using HealthTech.API.Controllers; 

namespace HealthTech.API.Factories
{
    //where the interface define contracts
    public interface IUserFactory
    {
        User CreateUser(RegisterUserRequest request);
    }
}