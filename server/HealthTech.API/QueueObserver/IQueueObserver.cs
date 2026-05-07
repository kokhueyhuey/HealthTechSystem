namespace HealthTech.API.QueueObserver
{
    // ─────────────────────────────────────────────────────────────────────────
    // QUEUE OBSERVER PATTERN — Step 1: The Observer Interface
    //
    // CONCEPT — Abstraction:
    //   This interface defines exactly how a queue update is communicated. 
    //   The Subject doesn't care IF the observer is a SignalR Hub, a database 
    //   logger, or a hospital TV screen. It only cares that it can call Update().
    //
    // SOLID — Interface Segregation Principle (ISP):
    //   This interface is tiny and specific to the queue. It forces no unnecessary
    //   methods on the classes that implement it.
    // ─────────────────────────────────────────────────────────────────────────
    public interface IQueueObserver
    {
        // Called by the Subject whenever the queue advances.
        void Update(int currentServingNumber, int? calledPatientId, string roomNumber);
    }
}