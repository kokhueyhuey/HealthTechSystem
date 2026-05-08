namespace HealthTech.API.Models
{
    public class Medicine
    {
        public int Id { get; set; }

        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string Photo { get; set; } = "";

        public int Quantity { get; set; }
        public int Threshold { get; set; }

        public DateTime ExpiryDate { get; set; }

        public string Status { get; set; } = "";
    }
}