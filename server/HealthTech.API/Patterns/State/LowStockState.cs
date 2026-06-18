namespace HealthTech.API.Patterns.State
{
    // STATE PATTERN — Concrete State: Low Stock State
    //
    // CONCEPT — Encapsulation:
    //   The behaviour and meaning of a low stock medicine condition
    //   are fully encapsulated inside this class.
    //
    // SOLID — Single Responsibility Principle (SRP):
    //   This class has one responsibility only:
    //   represent the "Low Stock" condition of a medicine.
    //
    // SYSTEM BEHAVIOUR:
    //   Medicines in this state require restocking attention from the
    //   pharmacist before the quantity becomes unavailable.

    // Represents the medicine state when stock quantity is below the minimum threshold.
    public class LowStockState : IMedicineState
    {
        // Returns the current medicine status.
        public string GetStatus()
        {
            return "Low Stock";
        }
    }
}