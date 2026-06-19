using HealthTech.API.Models;

namespace HealthTech.API.Patterns.AppointmentObserver
{
    // ─────────────────────────────────────────────────────────────────────────
    // OBSERVER PATTERN — Concrete Observer #2: Doctor
    //
    // CONCEPT — Functional Independence:
    //   DoctorObserver has no reference to PatientObserver or
    //   PharmacistObserver. Deleting one observer doesn't break the others.
    //   Each observer is a self-contained unit.
    //
    // SOLID — SRP:
    //   This class only handles notifying the doctor of appointment changes.
    //   It does not touch patient records, pharmacy stock, or any other concern.
    // ─────────────────────────────────────────────────────────────────────────

    public class DoctorObserver : IAppointmentObserver
    {
        public void Update(Appointment appointment, string eventType)
        {
            var msg = eventType switch
            {
                "Booked"        => $"[DOCTOR NOTIFICATION]  New appointment #{appointment.Id} booked — Patient ID {appointment.PatientId} on {appointment.AppointmentDate:dd MMM yyyy HH:mm}. Please review your schedule.",
                "Cancelled"     => $"[DOCTOR NOTIFICATION]  Appointment #{appointment.Id} with Patient ID {appointment.PatientId} has been cancelled. Slot is now free.",
                "Rescheduled"   => $"[DOCTOR NOTIFICATION]  Appointment #{appointment.Id} rescheduled to {appointment.AppointmentDate:dd MMM yyyy HH:mm}.",
                "WalkIn"        => $"[DOCTOR NOTIFICATION]  Walk-in patient added — Appointment #{appointment.Id}, Patient ID {appointment.PatientId}. Check your queue.",
                "Unavailable"   => $"[DOCTOR NOTIFICATION]  Unavailable period recorded. Appointment #{appointment.Id} with Patient ID {appointment.PatientId} may require rescheduling.",
                "StatusUpdated" => $"[DOCTOR NOTIFICATION]  You updated appointment #{appointment.Id} to '{appointment.Status}'.",
                _               => $"[DOCTOR NOTIFICATION]  Appointment #{appointment.Id} — event: {eventType}."
            };

            Console.WriteLine(msg);
        }
    }
}