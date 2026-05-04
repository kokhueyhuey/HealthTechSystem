namespace HealthTech.API.Models
{
    public class Pharmacist : User
    {
        public string PharmacistLicenseNumber { get; set; } = string.Empty;
        public string StaffId { get; set; } = string.Empty;
        public string ShiftSchedule { get; set; } = string.Empty;
        public bool CanApproveInventory { get; set; } = true;
    }
}