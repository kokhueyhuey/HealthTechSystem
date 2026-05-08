using HealthTech.API.Models;
using HealthTech.API.Observer.Queue;

// ── THIS NAMESPACE must match the folder name in your project ─────────
// Your project places this file at:
//   HealthTech.API/QueueObserver/QueueService.cs
// So the namespace is:
namespace HealthTech.API.QueueObserver
{
    // ════════════════════════════════════════════════════════════════════
    // OBSERVER PATTERN — Concrete Subject: QueueService
    // ════════════════════════════════════════════════════════════════════
    //
    // CONCEPT — Encapsulation:
    //   _observers list and _state are private. External callers use only
    //   the public API: EnqueuePatient, CallNext, CompletePatient, etc.
    //
    // CONCEPT — Modularity:
    //   Standalone class. No controller, view, or UI logic inside.
    //
    // SOLID — SRP: manages queue state and fires observer notifications.
    // SOLID — OCP: new observers added via RegisterObserver(); this class never changes.
    // SOLID — DIP: depends on IQueueObserver abstraction, not concrete types.
    //
    // Registered as Singleton in Program.cs so ALL HTTP requests and the
    // SignalR hub share the same live queue state.
    // ════════════════════════════════════════════════════════════════════

    public class QueueService : IQueueSubject
    {
        private readonly List<IQueueObserver> _observers = new();
        private readonly QueueState _state = new();
        private readonly object _lock = new();

        // ── IQueueSubject ──────────────────────────────────────────────

        public void RegisterObserver(IQueueObserver observer)
        {
            lock (_lock)
            {
                if (!_observers.Contains(observer))
                    _observers.Add(observer);
            }
        }

        public void RemoveObserver(IQueueObserver observer)
        {
            lock (_lock) { _observers.Remove(observer); }
        }

        public async Task NotifyObservers(QueueState queueState, string eventType)
        {
            List<IQueueObserver> snapshot;
            lock (_lock) { snapshot = new List<IQueueObserver>(_observers); }

            // Parallel fan-out: slow observers (SMS, email) don't block SignalR
            await Task.WhenAll(snapshot.Select(o => o.OnQueueUpdated(queueState, eventType)));
        }

        // ── Queue operations ───────────────────────────────────────────

        /// <summary>Pharmacist: check in a patient and issue a ticket.</summary>
        public async Task<QueueEntry> EnqueuePatient(int appointmentId, int patientId, string patientName)
        {
            QueueEntry entry;
            QueueState snapshot;

            lock (_lock)
            {
                _state.LastIssued++;
                entry = new QueueEntry
                {
                    QueueEntryId  = _state.LastIssued,
                    AppointmentId = appointmentId,
                    PatientId     = patientId,
                    PatientName   = patientName,
                    TicketNumber  = _state.LastIssued,
                    Status        = "Waiting",
                    CheckedInAt   = DateTime.UtcNow
                };
                _state.Queue.Add(entry);
                _state.LastUpdatedUtc = DateTime.UtcNow;

                if (_state.NowServing == 0) _state.NowServing = 1;
                snapshot = CloneState();
            }

            await NotifyObservers(snapshot, "PatientEnqueued");
            return entry;
        }

        /// <summary>Doctor/Pharmacist: call the next patient.</summary>
        public async Task<QueueState> CallNext()
        {
            QueueState snapshot;

            lock (_lock)
            {
                var current = _state.Queue.FirstOrDefault(e => e.TicketNumber == _state.NowServing);
                if (current != null) current.Status = "Completed";

                var next = _state.Queue.FirstOrDefault(e => e.Status == "Waiting");
                if (next != null) { _state.NowServing = next.TicketNumber; next.Status = "Serving"; }
                else _state.NowServing++;

                _state.LastUpdatedUtc = DateTime.UtcNow;
                snapshot = CloneState();
            }

            await NotifyObservers(snapshot, "NextCalled");
            return snapshot;
        }

        /// <summary>Doctor: mark the current consultation complete.</summary>
        public async Task<QueueState> CompleteCurrentPatient()
        {
            QueueState snapshot;

            lock (_lock)
            {
                var serving = _state.Queue.FirstOrDefault(e => e.Status == "Serving");
                if (serving != null) serving.Status = "Completed";
                _state.LastUpdatedUtc = DateTime.UtcNow;
                snapshot = CloneState();
            }

            await NotifyObservers(snapshot, "PatientCompleted");
            return snapshot;
        }

        /// <summary>Skip a non-responsive patient and advance the queue.</summary>
        public async Task<QueueState> SkipCurrentPatient()
        {
            QueueState snapshot;

            lock (_lock)
            {
                var serving = _state.Queue.FirstOrDefault(e => e.Status == "Serving");
                if (serving != null) serving.Status = "Skipped";

                var next = _state.Queue.FirstOrDefault(e => e.Status == "Waiting");
                if (next != null) { _state.NowServing = next.TicketNumber; next.Status = "Serving"; }

                _state.LastUpdatedUtc = DateTime.UtcNow;
                snapshot = CloneState();
            }

            await NotifyObservers(snapshot, "PatientSkipped");
            return snapshot;
        }

        /// <summary>End-of-day: clear all entries and reset counters.</summary>
        public async Task<QueueState> ResetQueue()
        {
            QueueState snapshot;

            lock (_lock)
            {
                _state.Queue.Clear();
                _state.NowServing = 0;
                _state.LastIssued = 0;
                _state.LastUpdatedUtc = DateTime.UtcNow;
                snapshot = CloneState();
            }

            await NotifyObservers(snapshot, "QueueReset");
            return snapshot;
        }

        /// <summary>Read-only snapshot for the initial HTTP GET.</summary>
        public QueueState GetCurrentState()
        {
            lock (_lock) { return CloneState(); }
        }

        // Deep-copy so observers cannot mutate the live state
        private QueueState CloneState() => new()
        {
            NowServing     = _state.NowServing,
            LastIssued     = _state.LastIssued,
            MinutesPerSlot = _state.MinutesPerSlot,
            LastUpdatedUtc = _state.LastUpdatedUtc,
            Queue          = _state.Queue.Select(e => new QueueEntry
            {
                QueueEntryId  = e.QueueEntryId,
                AppointmentId = e.AppointmentId,
                PatientId     = e.PatientId,
                PatientName   = e.PatientName,
                TicketNumber  = e.TicketNumber,
                Status        = e.Status,
                CheckedInAt   = e.CheckedInAt,
                RoomNumber    = e.RoomNumber
            }).ToList()
        };
    }
}