namespace HealthTech.API.Models
{
    // ════════════════════════════════════════════════════════════════════
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
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Full snapshot of the queue broadcast to all observers on every change.
    /// </summary>
    public class QueueState
    {
        /// <summary>The ticket number currently being served at the counter.</summary>
        public int NowServing { get; set; }

        /// <summary>Highest ticket number issued today.</summary>
        public int LastIssued { get; set; }

        /// <summary>Estimated minutes per consultation slot (default: 5).</summary>
        public int MinutesPerSlot { get; set; } = 5;

        /// <summary>All active queue entries, ordered by position.</summary>
        public List<QueueEntry> Queue { get; set; } = new();

        /// <summary>UTC timestamp of the last state mutation.</summary>
        public DateTime LastUpdatedUtc { get; set; } = DateTime.UtcNow;

        // ── Computed helpers used by the frontend ──────────────────────

        /// <summary>Total patients still waiting (Status == "Waiting").</summary>
        public int WaitingCount => Queue.Count(e => e.Status == "Waiting");

        /// <summary>
        /// Calculates how many minutes a given ticket number must wait.
        /// Formula: (TicketNumber - NowServing) * MinutesPerSlot
        /// </summary>
        public int EstimatedWaitMinutes(int ticketNumber)
        {
            var ahead = ticketNumber - NowServing;
            return ahead <= 0 ? 0 : ahead * MinutesPerSlot;
        }
    }

    /// <summary>
    /// One patient's position inside the active queue.
    /// </summary>
    public class QueueEntry
    {
        public int QueueEntryId { get; set; }
        public int AppointmentId { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public int TicketNumber { get; set; }

        /// <summary>
        /// Waiting | Serving | Completed | Skipped
        /// — State Pattern hook: this field drives the Pharmacy Inventory
        ///   module's state transitions (see State/ folder).
        /// </summary>
        public string Status { get; set; } = "Waiting";

        public DateTime CheckedInAt { get; set; }
        public string? RoomNumber { get; set; }
    }
}