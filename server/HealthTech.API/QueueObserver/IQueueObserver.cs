using HealthTech.API.Models;

namespace HealthTech.API.Observer.Queue
{
    // ════════════════════════════════════════════════════════════════════
    // OBSERVER PATTERN — Step 1: the Observer interface (Queue module)
    // ════════════════════════════════════════════════════════════════════
    //
    // CONCEPT — Abstraction:
    //   Defines the WHAT without the HOW. Every concrete observer
    //   (PatientQueueObserver, DoctorQueueObserver, PharmacistQueueObserver)
    //   agrees to implement OnQueueUpdated(). The Subject (QueueService)
    //   never knows which concrete type it is calling — only this contract.
    //
    // CONCEPT — Functional Independence:
    //   Each concrete observer is a self-contained unit. Removing
    //   PharmacistQueueObserver does not affect PatientQueueObserver or
    //   DoctorQueueObserver in any way. They share only this interface.
    //
    // SOLID — Interface Segregation Principle (ISP):
    //   The interface exposes exactly one method relevant to queue events.
    //   Observers are never forced to implement methods they do not need.
    //
    // SOLID — Dependency Inversion Principle (DIP):
    //   QueueService depends on this abstraction, not on any concrete class.
    //   High-level policy (broadcasting queue updates) is decoupled from
    //   low-level detail (how each role receives the notification).
    // ════════════════════════════════════════════════════════════════════

    public interface IQueueObserver
    {
        /// <summary>
        /// Called by the Subject (QueueService) whenever the queue state changes.
        /// eventType values: "PatientEnqueued" | "NextCalled" | "PatientCompleted"
        ///                   | "PatientSkipped" | "QueueReset"
        /// </summary>
        Task OnQueueUpdated(QueueState queueState, string eventType);
    }
}