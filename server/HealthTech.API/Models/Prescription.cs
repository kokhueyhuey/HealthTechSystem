namespace HealthTech.API.Models
{
    public class Prescription
    {
        public int Id { get; set; }

        public int AppointmentId { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = "";

        public int DoctorId { get; set; }

        public string Status { get; set; } = "Pending";

        public bool NeedMc { get; set; }
        public string McReason { get; set; } = "";
        public int McDays { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public List<PrescriptionItem> Items { get; set; } = new();
    }
}