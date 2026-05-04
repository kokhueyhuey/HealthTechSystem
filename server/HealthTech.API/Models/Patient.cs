namespace HealthTech.API.Models
{
    public class Patient : User
    {
        public int Age { get; set; }
        public string ICNumber { get; set; } = string.Empty;
        public string Allergies { get; set; } = "None";
        public string BloodType { get; set; } = string.Empty;
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    }
}