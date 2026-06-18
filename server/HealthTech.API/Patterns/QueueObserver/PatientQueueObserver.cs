using HealthTech.API.Models;

namespace HealthTech.API.Patterns.QueueObserver{
    // OBSERVER PATTERN — Concrete Observer #1: Patient (Queue module)
    // CONCEPT — Encapsulation:
    //   The logic of "what a patient cares about when the queue moves"
    //   lives entirely inside this class. No other observer duplicates
    //   this patient-specific decision: "is it MY turn?"
    //
    // CONCEPT — Refinement:
    //   Refines the abstract OnQueueUpdated() contract into patient-centric
    //   behaviour: alert when ticket matches NowServing, show wait time
    //   otherwise.
    //
    // SOLID — Single Responsibility Principle (SRP):
    //   Only handles patient-facing queue notification logic.
    //   Does not touch Doctor UI, pharmacist workflows, or DB writes.
    //
    // SOLID — Liskov Substitution Principle (LSP):
    //   Fully substitutable for IQueueObserver anywhere in the system.
    //   Removing this observer and replacing with a mock works seamlessly.

    public class PatientQueueObserver : IQueueObserver
    {
        // In production this would hold the patient's own ticket number,
        // loaded from session/token. Kept simple here for demonstration.
        private readonly int _patientTicketNumber;

        public PatientQueueObserver(int patientTicketNumber)
        {
            _patientTicketNumber = patientTicketNumber;
        }

        // BREAKPOINT here 
        public Task OnQueueUpdated(QueueState queueState, string eventType)
        {

            var waitMins = queueState.EstimatedWaitMinutes(_patientTicketNumber);

            var msg = eventType switch
            {
                "PatientEnqueued" =>
                    $"[PATIENT QUEUE]  You have been added to the queue. " +
                    $"Your number: {_patientTicketNumber}. " +
                    $"Now serving: {queueState.NowServing}. " +
                    $"Estimated wait: {waitMins} min(s).",

                "NextCalled" when queueState.NowServing == _patientTicketNumber =>
                    $"[PATIENT QUEUE]  🔔 YOUR TURN! Ticket #{_patientTicketNumber} — Please proceed to the consultation room now.",

                "NextCalled" =>
                    $"[PATIENT QUEUE]  Now serving #{queueState.NowServing}. " +
                    $"Your number: {_patientTicketNumber}. " +
                    $"Estimated wait: {waitMins} min(s).",

                "PatientCompleted" =>
                    $"[PATIENT QUEUE]  Consultation #{queueState.NowServing - 1} completed. " +
                    $"Now serving #{queueState.NowServing}. Your wait: {waitMins} min(s).",

                "PatientSkipped" =>
                    $"[PATIENT QUEUE]  A patient was skipped. Now serving #{queueState.NowServing}. Your wait: {waitMins} min(s).",

                "QueueReset" =>
                    $"[PATIENT QUEUE]  The queue has been reset for today. Please check in again at reception.",

                _ =>
                    $"[PATIENT QUEUE]  Queue updated — Now serving #{queueState.NowServing}. Event: {eventType}."
            };

            Console.WriteLine(msg); 
            return Task.CompletedTask;
        }
    }
}