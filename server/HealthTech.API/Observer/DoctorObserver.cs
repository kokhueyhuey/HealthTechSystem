using HealthTech.API.Models;

namespace HealthTech.API.Observer
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
        // 🔴 BREAKPOINT HERE ↓  (second stop when stepping through NotifyObservers loop)
        public void Update(Appointment appointment, string eventType)
        {
            // 🔴 BREAKPOINT HERE ↓
            var msg = eventType switch
            {
                "Booked"        => $"[DOCTOR NOTIFICATION]  New appointment #{appointment.Id} booked — Patient ID {appointment.PatientId} on {appointment.AppointmentDate:dd MMM yyyy HH:mm}. Please review your schedule.",
                "Cancelled"     => $"[DOCTOR NOTIFICATION]  Appointment #{appointment.Id} with Patient ID {appointment.PatientId} has been cancelled. Slot is now free.",
                "Rescheduled"   => $"[DOCTOR NOTIFICATION]  Appointment #{appointment.Id} rescheduled to {appointment.AppointmentDate:dd MMM yyyy HH:mm}.",
                "StatusUpdated" => $"[DOCTOR NOTIFICATION]  You updated appointment #{appointment.Id} to '{appointment.Status}'.",
                _               => $"[DOCTOR NOTIFICATION]  Appointment #{appointment.Id} — event: {eventType}."
            };

            Console.WriteLine(msg);

            // Real implementation would be:
            // await _calendarService.UpdateDoctorScheduleAsync(appointment.DoctorId, appointment);
        }
    }
}