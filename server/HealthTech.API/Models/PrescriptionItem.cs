namespace HealthTech.API.Models
{
    public class PrescriptionItem
    {
        public int Id { get; set; }

        public int PrescriptionId { get; set; }
        public Prescription? Prescription { get; set; }

        public int MedicineId { get; set; }
        public string MedicineName { get; set; } = "";

        public string Dosage { get; set; } = "";
        public int Quantity { get; set; }
        public string UsageInstruction { get; set; } = "";
        public string Preference { get; set; } = "";
    }
}