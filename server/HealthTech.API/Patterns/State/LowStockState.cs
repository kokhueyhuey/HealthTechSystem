namespace HealthTech.API.Patterns.State
{
    public class LowStockState : IMedicineState
    {
        public string GetStatus()
        {
            return "Low Stock";
        }
    }
}