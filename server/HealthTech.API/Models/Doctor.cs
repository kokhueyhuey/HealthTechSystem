namespace HealthTech.API.Models
{
    public class Doctor : User
    {
        public string Specialization { get; set; } = string.Empty;
        public string LicenseNumber { get; set; } = string.Empty;
        public string WorkSchedule { get; set; } = string.Empty;
        public decimal ConsultationFee { get; set; }
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    }
}