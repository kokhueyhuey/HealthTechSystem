using HealthTech.API.Models;

namespace HealthTech.API.Patterns.AppointmentObserver
{
    // ─────────────────────────────────────────────────────────────────────────
    // OBSERVER PATTERN — Concrete Observer #3: Pharmacist
    //
    // This observer is especially important for your use case:
    // "Manage Appointment Due to Doctor Unavailability" (from your use case table).
    // When a doctor cancels, PharmacistObserver fires and alerts the pharmacist
    // to contact affected patients and arrange rescheduling.
    //
    // CONCEPT — Refinement:
    //   The pharmacist only needs to act on "Cancelled" and "Rescheduled" events.
    //   This concrete class refines the general observer contract into only the
    //   responses that are meaningful from a pharmacy/admin perspective.
    //
    // SOLID — OCP:
    //   If tomorrow you add a "WaitingList" event type, you only add a case here.
    //   The Subject (AppointmentService) and other observers are unchanged.
    // ─────────────────────────────────────────────────────────────────────────

    public class PharmacistObserver : IAppointmentObserver
    {
        public void Update(Appointment appointment, string eventType)
        {
            var msg = eventType switch
            {
                "Booked"        => $"[PHARMACIST NOTIFICATION]  New appointment #{appointment.Id} added to system. Patient ID {appointment.PatientId}.",
                "Cancelled"     => $"[PHARMACIST NOTIFICATION]  Appointment #{appointment.Id} cancelled. ACTION REQUIRED: contact Patient ID {appointment.PatientId} to arrange alternative or rescheduling.",
                "Rescheduled"   => $"[PHARMACIST NOTIFICATION]  Appointment #{appointment.Id} rescheduled to {appointment.AppointmentDate:dd MMM yyyy HH:mm}. Confirm with patient.",
                "StatusUpdated" => $"[PHARMACIST NOTIFICATION]  Appointment #{appointment.Id} status is now '{appointment.Status}'.",
                "WalkIn"        => $"[PHARMACIST NOTIFICATION]  Walk-in appointment #{appointment.Id} created for Patient ID {appointment.PatientId}. Added to queue.",
                "Unavailable"   => $"[PHARMACIST NOTIFICATION]  Appointment #{appointment.Id} is affected by doctor unavailability. Assist with rescheduling if required.",
                _               => $"[PHARMACIST NOTIFICATION]  Appointment #{appointment.Id} — event: {eventType}."
            };

            Console.WriteLine(msg);
        }
    }
}