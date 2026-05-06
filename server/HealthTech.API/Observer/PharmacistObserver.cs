using HealthTech.API.Models;

namespace HealthTech.API.Observer
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
        // 🔴 BREAKPOINT HERE ↓  (third and final stop in NotifyObservers loop)
        public void Update(Appointment appointment, string eventType)
        {
            // 🔴 BREAKPOINT HERE ↓
            var msg = eventType switch
            {
                "Booked"        => $"[PHARMACIST NOTIFICATION]  New appointment #{appointment.Id} added to system. Patient ID {appointment.PatientId}.",
                "Cancelled"     => $"[PHARMACIST NOTIFICATION]  Appointment #{appointment.Id} cancelled. ACTION REQUIRED: contact Patient ID {appointment.PatientId} to arrange alternative or rescheduling.",
                "Rescheduled"   => $"[PHARMACIST NOTIFICATION]  Appointment #{appointment.Id} rescheduled to {appointment.AppointmentDate:dd MMM yyyy HH:mm}. Confirm with patient.",
                "StatusUpdated" => $"[PHARMACIST NOTIFICATION]  Appointment #{appointment.Id} status is now '{appointment.Status}'.",
                _               => $"[PHARMACIST NOTIFICATION]  Appointment #{appointment.Id} — event: {eventType}."
            };

            Console.WriteLine(msg);

            // Real implementation would be:
            // await _smsService.SendAsync(appointment.Patient.PhoneNumber, msg);
            // Or generate a task in the pharmacist's work queue.
        }
    }
}