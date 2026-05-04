using HealthTech.API.Models;

namespace HealthTech.API.Factories
{
    // gets back the right factory without knowing anything about PatientFactory internally.
    public static class UserFactoryProvider
    {
        // entry point of the pattern.
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