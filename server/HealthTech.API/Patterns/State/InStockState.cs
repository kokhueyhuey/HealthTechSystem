namespace HealthTech.API.Patterns.State
{

    // ─────────────────────────────────────────────────────────────────────────
    // STATE PATTERN — Concrete State: In Stock State
    //
    // CONCEPT — Encapsulation:
    //   The behaviour and meaning of a medicine with sufficient stock
    //   are fully encapsulated inside this class.
    //
    // SOLID — Single Responsibility Principle (SRP):
    //   This class has one responsibility only:
    //   represent the "In Stock" condition of a medicine.
    //
    // SYSTEM BEHAVIOUR:
    //   Medicines in this state are available for dispensing and normal use.
    // ─────────────────────────────────────────────────────────────────────────

    // Represents the medicine state when stock quantity is sufficient.
    public class InStockState : IMedicineState
    {
        // Returns the current medicine status.
        public string GetStatus()
        {
            return "In Stock";
        }
    }
}