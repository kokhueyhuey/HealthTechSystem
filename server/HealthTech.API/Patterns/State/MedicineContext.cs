namespace HealthTech.API.Patterns.State
{
    public class MedicineContext
    {
        private IMedicineState _state;

        public MedicineContext(int quantity, int threshold, DateTime expiryDate)
        {
            if (expiryDate.Date < DateTime.Today)
            {
                _state = new ExpiredState();
            }
            else if (quantity == 0)
            {
                _state = new OutOfStockState();
            }
            else if (quantity <= threshold)
            {
                _state = new LowStockState();
            }
            else
            {
                _state = new InStockState();
            }
        }

        public string GetStatus()
        {
            return _state.GetStatus();
        }
    }
}