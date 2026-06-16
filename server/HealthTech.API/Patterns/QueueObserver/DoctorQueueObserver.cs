using HealthTech.API.Models;

namespace HealthTech.API.Patterns.QueueObserver{
    // ════════════════════════════════════════════════════════════════════
    // OBSERVER PATTERN — Concrete Observer #2: Doctor (Queue module)
    // ════════════════════════════════════════════════════════════════════
    //
    // CONCEPT — Functional Independence:
    //   DoctorQueueObserver has zero knowledge of what PatientQueueObserver
    //   or PharmacistQueueObserver do. It reacts only to changes that are
    //   relevant to the doctor's workflow: who is next, and how many remain.
    //
    // CONCEPT — Refinement:
    //   The doctor's perspective on the queue is different: they need to know
    //   who is arriving next (name, ticket) and the total remaining workload.
    //   This class refines the abstract contract into that specific concern.
    //
    // SOLID — Single Responsibility Principle (SRP):
    //   Handles only doctor-facing queue notifications.
    //   No patient alerting, no pharmacist workflow, no SignalR calls.
    //
    // SOLID — Open/Closed Principle (OCP):
    //   Adding a new event (e.g. "EmergencyInserted") only adds a case here;
    //   the Subject and all other observers stay untouched.
    // ════════════════════════════════════════════════════════════════════

    public class DoctorQueueObserver : IQueueObserver
    {
        public Task OnQueueUpdated(QueueState queueState, string eventType)
        {
            // BREAKPOINT HERE
            var next = queueState.Queue.FirstOrDefault(e => e.Status == "Waiting");

            var msg = eventType switch
            {
                "PatientEnqueued" =>
                    $"[DOCTOR QUEUE]   New patient added. " +
                    $"Ticket #{queueState.LastIssued}. " +
                    $"Total waiting: {queueState.WaitingCount}.",

                "NextCalled" =>
                    $"[DOCTOR QUEUE]   Now serving #{queueState.NowServing}. " +
                    (next != null
                        ? $"Next up: {next.PatientName} (Ticket #{next.TicketNumber}). "
                        : "No more patients in queue. ") +
                    $"Remaining: {queueState.WaitingCount}.",

                "PatientCompleted" =>
                    $"[DOCTOR QUEUE]   Ticket #{queueState.NowServing - 1} marked Completed. " +
                    $"Remaining patients: {queueState.WaitingCount}.",

                "PatientSkipped" =>
                    $"[DOCTOR QUEUE]   A patient was skipped. Now serving #{queueState.NowServing}. " +
                    $"Remaining: {queueState.WaitingCount}.",

                "QueueReset" =>
                    $"[DOCTOR QUEUE]   Queue reset. All slots cleared for today.",

                _ =>
                    $"[DOCTOR QUEUE]   Queue event '{eventType}'. Now serving #{queueState.NowServing}."
            };

            Console.WriteLine(msg); 
            return Task.CompletedTask;
        }
    }
}