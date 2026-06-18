using HealthTech.API.Models;

namespace HealthTech.API.Factories
{
    // FACTORY PATTERN IS NOT USED ANYMORE
    public static class UserFactoryProvider
    {
        public static IUserFactory GetFactory(string role)
        {
            return role switch
            {
                "Patient"    => new PatientFactory(),
                "Doctor"     => new DoctorFactory(),
                "Pharmacist" => new PharmacistFactory(),

                _ => throw new ArgumentException($"Unknown role: '{role}'. Valid roles are: Patient, Doctor, Pharmacist.")
            };
        }
    }
}