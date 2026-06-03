namespace HealthTech.API.Patterns.State
{

    // ─────────────────────────────────────────────────────────────────────────
    // STATE PATTERN — Context Class
    //
    // CONCEPT — Abstraction:
    //   MedicineContext hides the complexity of deciding which medicine
    //   state should be used. Other classes only interact with the context
    //   instead of directly managing state objects.
    //
    // CONCEPT — Encapsulation:
    //   The state transition logic is fully encapsulated inside this class.
    //   The system does not need multiple if-else statements elsewhere.
    //
    // CONCEPT — Functional Independence:
    //   Each concrete state class handles its own behaviour independently,
    //   while MedicineContext is responsible only for state selection.
    //
    // SOLID — Single Responsibility Principle (SRP):
    //   This class has one responsibility:
    //   determine and manage the current medicine state.
    //
    // SOLID — Open/Closed Principle (OCP):
    //   New medicine states can be added without modifying most of the
    //   existing system logic.
    //
    // SOLID — Dependency Inversion Principle (DIP):
    //   MedicineContext depends on the abstraction IMedicineState instead
    //   of concrete state classes directly.
    //
    // SYSTEM BEHAVIOUR:
    //   The medicine status changes automatically depending on:
    //   - Expiry date
    //   - Stock quantity
    //   - Threshold level
    // ─────────────────────────────────────────────────────────────────────────

    // Context class that determines and manages the current medicine state.
    // The medicine state changes based on quantity, threshold, and expiry date.
    public class MedicineContext
    {
        // Stores the current medicine state object.
        private IMedicineState _state;

        // Constructor that decides which state should be assigned.
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

        // Returns the current medicine status.
        public string GetStatus()
        {
            return _state.GetStatus();
        }
    }
}