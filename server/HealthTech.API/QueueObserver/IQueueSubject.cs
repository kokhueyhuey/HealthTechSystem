namespace HealthTech.API.QueueObserver
{
    // ─────────────────────────────────────────────────────────────────────────
    // QUEUE OBSERVER PATTERN — Step 2: The Subject Interface
    //
    // CONCEPT — Modularity:
    //   By keeping the registration mechanism in an interface, you separate the 
    //   "Queue Management" logic from the "Subscription Management" logic.
    //
    // SOLID — Open/Closed Principle (OCP):
    //   If the hospital adds an SMS notification system next year, you just create
    //   an SmsQueueObserver and call RegisterObserver(). This interface and the 
    //   underlying QueueService will not need a single line of code changed.
    // ─────────────────────────────────────────────────────────────────────────
    public interface IQueueSubject
    {
        void RegisterObserver(IQueueObserver observer);
        void RemoveObserver(IQueueObserver observer);
        void NotifyObservers(int currentServingNumber, int? calledPatientId, string roomNumber);
    }
}