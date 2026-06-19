using HealthTech.API.Models;

namespace HealthTech.API.Patterns.AppointmentObserver
{
    // ─────────────────────────────────────────────────────────────────────────
    // OBSERVER PATTERN — Concrete Observer #1: Patient
    //
    // CONCEPT — Encapsulation:
    //   The logic of "what a patient sees when an appointment changes" is
    //   entirely INSIDE this class. No other class touches or duplicates
    //   this logic. The notification message is built here and only here.
    //
    // CONCEPT — Refinement:
    //   This class is a specialisation of the general IAppointmentObserver
    //   interface. It refines the abstract "react to update" contract into
    //   a patient-specific behaviour (confirmation, cancellation receipt, etc.)
    //
    // SOLID — Single Responsibility Principle (SRP):
    //   This class has exactly one job: handle appointment event notifications
    //   from the patient's perspective. Nothing else lives here.
    //
    // SOLID — Liskov Substitution Principle (LSP):
    //   Anywhere IAppointmentObserver is expected, PatientObserver can be
    //   used without breaking the system. All three concrete observers are
    //   fully substitutable.
    // ─────────────────────────────────────────────────────────────────────────

    public class PatientObserver : IAppointmentObserver
    {

        public void Update(Appointment appointment, string eventType)
        {
            
            var msg = eventType switch
            {
                "Booked"        => $"[PATIENT NOTIFICATION] Appointment #{appointment.Id} confirmed with Doctor ID {appointment.DoctorId} on {appointment.AppointmentDate:dd MMM yyyy HH:mm}.",
                "Cancelled"     => $"[PATIENT NOTIFICATION] Your appointment #{appointment.Id} has been cancelled.",
                "Rescheduled"   => $"[PATIENT NOTIFICATION] Your appointment #{appointment.Id} has been rescheduled to {appointment.AppointmentDate:dd MMM yyyy HH:mm}.",
                "WalkIn"        => $"[PATIENT NOTIFICATION] Walk-in appointment #{appointment.Id} created. You have been added to the queue.",
                "StatusUpdated" => $"[PATIENT NOTIFICATION] Appointment #{appointment.Id} status changed to '{appointment.Status}'.",
                "Unavailable"   => $"[PATIENT NOTIFICATION]  Your appointment #{appointment.Id} may be affected due to doctor unavailability. Please wait for rescheduling confirmation.",
                _               => $"[PATIENT NOTIFICATION] Appointment #{appointment.Id} updated — event: {eventType}."
            };

            Console.WriteLine(msg); // BREAKPOINT- show each observer receives the update

        }
    }
}