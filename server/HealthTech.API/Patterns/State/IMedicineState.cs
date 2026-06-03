namespace HealthTech.API.Patterns.State
{

    // ─────────────────────────────────────────────────────────────────────────
    // STATE PATTERN — State Interface
    //
    // CONCEPT — Abstraction:
    //   IMedicineState defines the common behaviour shared by all medicine
    //   states without exposing implementation details.
    //
    // CONCEPT — Polymorphism:
    //   Different concrete state classes (InStockState, LowStockState,
    //   OutOfStockState, ExpiredState) can be used interchangeably through
    //   this interface.
    //
    // SOLID — Open/Closed Principle (OCP):
    //   New medicine states can be added without modifying existing code.
    //   The system is open for extension but closed for modification.
    //
    // SOLID — Dependency Inversion Principle (DIP):
    //   The MedicineContext depends on this abstraction (IMedicineState)
    //   instead of depending directly on concrete state classes.
    //
    // PURPOSE:
    //   Every medicine state must implement GetStatus() to define
    //   its own status behaviour.
    // ─────────────────────────────────────────────────────────────────────────

    // Interface for all medicine states.
    // Each state class must define its own medicine status.
    public interface IMedicineState
    {
        // Returns the current status of the medicine.
        string GetStatus();
    }
}