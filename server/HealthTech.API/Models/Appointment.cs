namespace HealthTech.API.Models
{
    public class Appointment
    {
        public int Id { get; set; }

        // Foreign key linking to which Patient booked this appointment.
        public int PatientId { get; set; }
        public Patient? Patient { get; set; }

        // Foreign key linking to which Doctor this appointment is with.
        public int DoctorId { get; set; }
        public Doctor? Doctor { get; set; }

        public DateTime AppointmentDate { get; set; }

        // Status tracks the lifecycle of an appointment:
        public string Status { get; set; } = "Pending";

        public string Notes { get; set; } = string.Empty;
    }
}