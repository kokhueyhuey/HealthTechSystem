namespace HealthTech.API.Patterns.State
{

    // ─────────────────────────────────────────────────────────────────────────
    // STATE PATTERN — Concrete State: Expired State
    //
    // CONCEPT — Encapsulation:
    //   The behaviour and meaning of an expired medicine are fully
    //   encapsulated inside this class. Other classes only need to know
    //   that the medicine is in the "Expired" state.
    //
    // SOLID — Single Responsibility Principle (SRP):
    //   This class has one responsibility only:
    //   represent the expired condition of a medicine.
    //
    // SYSTEM BEHAVIOUR:
    //   Medicines in this state should not be dispensed or used because
    //   the expiry date has already passed.
    // ─────────────────────────────────────────────────────────────────────────

    // Represents the medicine state when the expiry date has passed.
    public class ExpiredState : IMedicineState
    {
        // Returns the current medicine status.
        public string GetStatus()
        {
            return "Expired";
        }
    }
}