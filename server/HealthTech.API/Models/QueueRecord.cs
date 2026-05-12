using System.ComponentModel.DataAnnotations.Schema;

namespace HealthTech.API.Models
{
    [Table("Queue")]
    public class QueueRecord
    {
        public int Id { get; set; }

        public int AppointmentId { get; set; }
        public Appointment? Appointment { get; set; }

        public int TicketNumber { get; set; }

        // Waiting | Serving | Completed | Skipped
        public string Status { get; set; } = "Waiting";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
