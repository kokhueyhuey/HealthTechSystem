namespace HealthTech.API.Patterns.State
{
    public class ExpiredState : IMedicineState
    {
        public string GetStatus()
        {
            return "Expired";
        }
    }
}