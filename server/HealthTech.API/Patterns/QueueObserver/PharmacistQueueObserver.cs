using HealthTech.API.Models;

namespace HealthTech.API.Patterns.QueueObserver{
    // OBSERVER PATTERN — Concrete Observer #3: Pharmacist (Queue module)
    // CONCEPT — Refinement:
    //   The pharmacist's role at the queue is admin/operational: they add
    //   patients ("PatientEnqueued"), monitor throughput, and act on
    //   skipped patients. This class refines those specific concerns.
    //
    // CONCEPT — Encapsulation:
    //   All pharmacist-specific queue logic is encapsulated here.
    //   The QueueService never knows these details; it only calls
    //   OnQueueUpdated() on every observer in its list.
    //
    // SOLID — SRP:
    //   Handles pharmacist admin notifications for queue management only.
    //   Prescription workflows and inventory alerts live in separate classes.
    //
    // SOLID — OCP:
    //   A new event type (e.g. "LatePatientAlert") can be added here
    //   without modifying IQueueObserver, QueueService, or any other observer.
    public class PharmacistQueueObserver : IQueueObserver
    {
        // BREAKPOINT HERE
        public Task OnQueueUpdated(QueueState queueState, string eventType)
        {
            var msg = eventType switch
            {
                "PatientEnqueued" =>
                    $"[PHARMACIST QUEUE]  Patient added to queue. " +
                    $"Ticket #{queueState.LastIssued} issued. " +
                    $"Total waiting: {queueState.WaitingCount}.",

                "NextCalled" =>
                    $"[PHARMACIST QUEUE]  Queue advanced. " +
                    $"Now serving #{queueState.NowServing}. " +
                    $"Remaining: {queueState.WaitingCount}.",

                "PatientCompleted" =>
                    $"[PHARMACIST QUEUE]  Consultation complete for ticket #{queueState.NowServing - 1}. " +
                    $"Remaining: {queueState.WaitingCount}.",

                "PatientSkipped" =>
                    $"[PHARMACIST QUEUE]  ⚠ Patient SKIPPED. ACTION: Contact patient and re-insert or reschedule. " +
                    $"Now serving #{queueState.NowServing}.",

                "QueueReset" =>
                    $"[PHARMACIST QUEUE]  End-of-day queue reset confirmed. All entries cleared.",

                _ =>
                    $"[PHARMACIST QUEUE]  Queue event '{eventType}'. Now serving #{queueState.NowServing}."
            };

            Console.WriteLine(msg); 
            return Task.CompletedTask;
        }
    }
}