namespace HealthTech.API.Patterns.State
{
    // STATE PATTERN — Concrete State: Out Of Stock State
    //
    // CONCEPT — Encapsulation:
    //   The behaviour and meaning of the "Out Of Stock" condition are fully
    //   encapsulated inside this class. Other classes do not need to know
    //   how this state works internally.
    //
    // SOLID — Single Responsibility Principle (SRP):
    //   This class has one responsibility only:
    //   represent the "Out Of Stock" state of a medicine.
    //
    // SYSTEM BEHAVIOUR:
    //   Medicines in this state cannot be dispensed until restocked.

    // Represents the medicine state when the stock quantity is zero.
    public class OutOfStockState : IMedicineState
    {
        // Returns the current medicine status.
        public string GetStatus()
        {
            return "Out of Stock";
        }
    }
}