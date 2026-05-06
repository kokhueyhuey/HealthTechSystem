namespace HealthTech.API.Patterns.State
{
    public class OutOfStockState : IMedicineState
    {
        public string GetStatus()
        {
            return "Out of Stock";
        }
    }
}