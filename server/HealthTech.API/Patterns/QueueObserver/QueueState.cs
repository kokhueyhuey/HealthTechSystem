namespace HealthTech.API.Models
{
    // CONCEPT — Encapsulation (Data Transfer Object / Value Object):
    //   QueueState bundles ALL queue data into one cohesive object that
    //   travels from QueueService → observers → SignalR hub → frontend.
    //   No observer has to query the database independently; every fact
    //   needed to render a UI is already here.
    //
    // CONCEPT — Abstraction:
    //   Callers (controllers, observers, SignalR hub) interact with this
    //   clean model. They never touch raw DB rows or EF entities directly.
    //
    // CONCEPT — Refinement:
    //   QueueEntry is a refinement of the general concept "a person waiting"
    //   into a specific, typed representation with queue-specific fields
    //   (position, estimated wait, status).


    /// Full snapshot of the queue broadcast to all observers on every change
    public class QueueState
    {
        /// The ticket number currently being served at the counter.
        public int NowServing { get; set; }

        /// Highest ticket number issued today.
        public int LastIssued { get; set; }

        /// Estimated minutes per consultation slot (default: 5).
        public int MinutesPerSlot { get; set; } = 5;

        /// All active queue entries, ordered by position
        public List<QueueEntry> Queue { get; set; } = new();

        /// UTC timestamp of the last state mutation
        public DateTime LastUpdatedUtc { get; set; } = DateTime.Now;

        // Computed helpers used by the frontend 

        /// Total patients still waiting (Status == "Waiting")
        public int WaitingCount => Queue.Count(e => e.Status == "Waiting");

        /// Calculates how many minutes a given ticket number must wait.
        /// Formula: (TicketNumber - NowServing) * MinutesPerSlot
        public int EstimatedWaitMinutes(int ticketNumber)
        {
            var ahead = ticketNumber - NowServing;
            return ahead <= 0 ? 0 : ahead * MinutesPerSlot;
        }
    }

    /// One patient's position inside the active queue.
    public class QueueEntry
    {
        public int QueueEntryId { get; set; }
        public int AppointmentId { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public int TicketNumber { get; set; }

        /// The doctor this patient is booked with.
        /// Populated from Appointment.DoctorId at enqueue/load time — not stored
        /// as a separate column; derived from the linked Appointment row.
        /// Used by CallNext / Skip so each doctor only pulls their own patients.
        public int DoctorId { get; set; }

        /// Waiting | Serving | Completed | Skipped
        /// — State Pattern hook: this field drives the Pharmacy Inventory
        ///   module's state transitions (see State/ folder).
        public string Status { get; set; } = "Waiting";

        public DateTime CheckedInAt { get; set; }
        public string? RoomNumber { get; set; }
    }
}