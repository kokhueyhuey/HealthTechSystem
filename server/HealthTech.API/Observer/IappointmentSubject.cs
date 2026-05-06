namespace HealthTech.API.Observer
{
    // ─────────────────────────────────────────────────────────────────────────
    // OBSERVER PATTERN — Step 2: the Subject interface
    //
    // CONCEPT — Modularity:
    //   Keeping Subject and Observer as separate interfaces means each
    //   concern lives in its own module. You can swap the Subject
    //   implementation (e.g. swap AppointmentService for a mock in tests)
    //   without touching any observer.
    //
    // SOLID — Open/Closed Principle (OCP):
    //   The Subject is OPEN for extension (register new observers at any
    //   time) but CLOSED for modification (adding a new observer never
    //   changes this interface or the service internals).
    // ─────────────────────────────────────────────────────────────────────────

    public interface IAppointmentSubject
    {
        void RegisterObserver(IAppointmentObserver observer);
        void RemoveObserver(IAppointmentObserver observer);

        // Calls Update() on every registered observer.
        void NotifyObservers(Models.Appointment appointment, string eventType);
    }
}