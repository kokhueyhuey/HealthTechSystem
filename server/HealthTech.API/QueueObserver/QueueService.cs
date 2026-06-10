using HealthTech.API.Data;
using HealthTech.API.Models;
using HealthTech.API.Observer.Queue;
using Microsoft.EntityFrameworkCore;

namespace HealthTech.API.QueueObserver
{
    // --------------------------------------------------------------------
    // OBSERVER PATTERN — Concrete Subject: QueueService
    // --------------------------------------------------------------------
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
    // --------------------------------------------------------------------

    public class QueueService : IQueueSubject
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly List<IQueueObserver> _observers = new();
        private readonly QueueState _state = new();
        private readonly object _lock = new();
        private bool _initialized;

        public QueueService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        public async Task InitializeAsync()
        {
            if (_initialized) return;

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var persisted = await db.QueueRecords
                .Include(q => q.Appointment)
                    .ThenInclude(a => a.Patient)
                .OrderBy(q => q.TicketNumber)
                .ToListAsync();

            lock (_lock)
            {
                _state.Queue.Clear();
                foreach (var record in persisted)
                {
                    _state.Queue.Add(new QueueEntry
                    {
                        QueueEntryId  = record.Id,
                        AppointmentId = record.AppointmentId,
                        PatientId     = record.Appointment?.PatientId ?? 0,
                        PatientName   = record.Appointment?.Patient?.Name ?? "Unknown",
                        TicketNumber  = record.TicketNumber,
                        Status        = record.Status,
                        CheckedInAt   = record.CreatedAt
                    });
                    _state.LastIssued = Math.Max(_state.LastIssued, record.TicketNumber);
                }

                var serving = _state.Queue.FirstOrDefault(e => e.Status == "Serving");
                if (serving != null)
                {
                    _state.NowServing = serving.TicketNumber;
                }
                else
                {
                    _state.NowServing = 0;
                }

                _state.LastUpdatedUtc = DateTime.UtcNow;
                _initialized = true;
            }
        }

        private async Task EnsureInitializedAsync()
        {
            if (!_initialized) await InitializeAsync();
        }

        // -- IQueueSubject ----------------------------------------------

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
            await Task.WhenAll(snapshot.Select(o => o.OnQueueUpdated(queueState, eventType)));
        }

        public async Task<QueueState> GetCurrentStateAsync()
        {
            await EnsureInitializedAsync();
            lock (_lock) { return CloneState(); }
        }

        public async Task<QueueEntry> EnqueuePatient(int appointmentId, int patientId, string patientName)
        {
            await EnsureInitializedAsync();

            int ticketNumber;
            lock (_lock)
            {
                _state.LastIssued++;
                ticketNumber = _state.LastIssued;
            }

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var appointment = await db.Appointments.FindAsync(appointmentId);
            if (appointment == null)
                throw new InvalidOperationException("Appointment not found.");

            if (appointment.Status == "Completed" || appointment.Status == "Cancelled" || appointment.Status == "InQueue" || appointment.Status == "InConsultation")
                throw new InvalidOperationException("This appointment cannot be added to the queue.");

            appointment.Status = "InQueue";

            var record = new QueueRecord
            {
                AppointmentId = appointmentId,
                TicketNumber  = ticketNumber,
                Status        = "Waiting",
                CreatedAt     = DateTime.UtcNow,
                UpdatedAt     = DateTime.UtcNow
            };

            db.QueueRecords.Add(record);
            await db.SaveChangesAsync();

            QueueEntry entry;
            QueueState snapshot;
            lock (_lock)
            {
                entry = new QueueEntry
                {
                    QueueEntryId  = record.Id,
                    AppointmentId = appointmentId,
                    PatientId     = patientId,
                    PatientName   = patientName,
                    TicketNumber  = ticketNumber,
                    Status        = "Waiting",
                    CheckedInAt   = record.CreatedAt
                };

                _state.Queue.Add(entry);
                _state.LastUpdatedUtc = DateTime.UtcNow;
                snapshot = CloneState();
            }

            await NotifyObservers(snapshot, "PatientEnqueued");
            return entry;
        }

        public async Task<QueueState> CallNext()
        {
            await EnsureInitializedAsync();

            QueueEntry? currentServing;
            QueueEntry? nextWaiting;

            lock (_lock)
            {
                currentServing = _state.Queue.FirstOrDefault(e => e.Status == "Serving");
                nextWaiting = _state.Queue.FirstOrDefault(e => e.Status == "Waiting");
            }

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            if (currentServing != null)
            {
                var currentRecord = await db.QueueRecords.FirstOrDefaultAsync(q => q.Id == currentServing.QueueEntryId);
                if (currentRecord != null)
                {
                    currentRecord.Status = "Completed";
                    currentRecord.UpdatedAt = DateTime.UtcNow;
                }

                var currentAppointment = await db.Appointments.FindAsync(currentServing.AppointmentId);
                if (currentAppointment != null)
                {
                    currentAppointment.Status = "Completed";
                }
            }

            if (nextWaiting != null)
            {
                var nextRecord = await db.QueueRecords.FirstOrDefaultAsync(q => q.Id == nextWaiting.QueueEntryId);
                if (nextRecord != null)
                {
                    nextRecord.Status = "Serving";
                    nextRecord.UpdatedAt = DateTime.UtcNow;
                }

                var nextAppointment = await db.Appointments.FindAsync(nextWaiting.AppointmentId);
                if (nextAppointment != null)
                {
                    nextAppointment.Status = "InConsultation";
                }
            }

            await db.SaveChangesAsync();

            QueueState snapshot;
            lock (_lock)
            {
                if (currentServing != null)
                    currentServing.Status = "Completed";

                if (nextWaiting != null)
                {
                    nextWaiting.Status = "Serving";
                    _state.NowServing = nextWaiting.TicketNumber;
                }
                else
                {
                    _state.NowServing = 0;
                }

                _state.LastUpdatedUtc = DateTime.UtcNow;
                snapshot = CloneState();
            }

            await NotifyObservers(snapshot, "NextCalled");
            return snapshot;
        }

        public async Task<QueueState> CompleteCurrentPatient()
        {
            await EnsureInitializedAsync();

            QueueEntry? serving;
            lock (_lock)
            {
                serving = _state.Queue.FirstOrDefault(e => e.Status == "Serving");
            }

            if (serving != null)
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var record = await db.QueueRecords.FirstOrDefaultAsync(q => q.Id == serving.QueueEntryId);
                if (record != null)
                {
                    record.Status = "Completed";
                    record.UpdatedAt = DateTime.UtcNow;
                }

                var appointment = await db.Appointments.FindAsync(serving.AppointmentId);
                if (appointment != null)
                {
                    appointment.Status = "Completed";
                }

                await db.SaveChangesAsync();
            }

            QueueState snapshot;
            lock (_lock)
            {
                if (serving != null)
                    serving.Status = "Completed";

                _state.LastUpdatedUtc = DateTime.UtcNow;
                snapshot = CloneState();
            }

            await NotifyObservers(snapshot, "PatientCompleted");
            return snapshot;
        }

        public async Task<QueueState> SkipCurrentPatient()
        {
            await EnsureInitializedAsync();

            QueueEntry? serving;
            QueueEntry? nextWaiting;

            lock (_lock)
            {
                serving = _state.Queue.FirstOrDefault(e => e.Status == "Serving");
                nextWaiting = _state.Queue.FirstOrDefault(e => e.Status == "Waiting");
            }

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            if (serving != null)
            {
                var record = await db.QueueRecords.FirstOrDefaultAsync(q => q.Id == serving.QueueEntryId);
                if (record != null)
                {
                    record.Status = "Skipped";
                    record.UpdatedAt = DateTime.UtcNow;
                }
            }

            if (nextWaiting != null)
            {
                var nextRecord = await db.QueueRecords.FirstOrDefaultAsync(q => q.Id == nextWaiting.QueueEntryId);
                if (nextRecord != null)
                {
                    nextRecord.Status = "Serving";
                    nextRecord.UpdatedAt = DateTime.UtcNow;
                }

                var nextAppointment = await db.Appointments.FindAsync(nextWaiting.AppointmentId);
                if (nextAppointment != null)
                {
                    nextAppointment.Status = "InConsultation";
                }
            }

            await db.SaveChangesAsync();

            QueueState snapshot;
            lock (_lock)
            {
                if (serving != null)
                    serving.Status = "Skipped";

                if (nextWaiting != null)
                {
                    nextWaiting.Status = "Serving";
                    _state.NowServing = nextWaiting.TicketNumber;
                }
                else
                {
                    _state.NowServing = 0;
                }

                _state.LastUpdatedUtc = DateTime.UtcNow;
                snapshot = CloneState();
            }

            await NotifyObservers(snapshot, "PatientSkipped");
            return snapshot;
        }

        public async Task<QueueState> ResetQueue()
        {
            await EnsureInitializedAsync();

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.QueueRecords.RemoveRange(db.QueueRecords);
            await db.SaveChangesAsync();

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
