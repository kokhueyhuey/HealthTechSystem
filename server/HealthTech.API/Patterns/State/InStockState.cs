namespace HealthTech.API.Patterns.State
{
    public class InStockState : IMedicineState
    {
        public string GetStatus()
        {
            return "In Stock";
        }
    }
}