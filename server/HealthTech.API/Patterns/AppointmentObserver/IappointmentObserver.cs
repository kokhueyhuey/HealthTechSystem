using HealthTech.API.Models;

namespace HealthTech.API.Patterns.AppointmentObserver
{
    // ─────────────────────────────────────────────────────────────────────────
    // OBSERVER PATTERN — Step 1: the Observer interface
    //
    // CONCEPT — Abstraction:
    //   This interface hides the internal "how" of each observer.
    //   The Subject (AppointmentService) only ever calls Update().
    //   It never knows whether it's talking to a Patient, Doctor, or
    //   Pharmacist — just a thing that can receive an appointment update.
    //
    // CONCEPT — Functional Independence:
    //   PatientObserver, DoctorObserver, and PharmacistObserver are fully
    //   independent. Adding, removing, or changing one has zero effect on
    //   the others. They only share this interface contract.
    //
    // SOLID — Dependency Inversion Principle (DIP):
    //   AppointmentService depends on THIS interface, not on any concrete
    //   class. High-level modules must not depend on low-level modules.
    //
    // SOLID — Interface Segregation Principle (ISP):
    //   The interface has exactly ONE method. Observers are never forced
    //   to implement methods they don't use.
    // ─────────────────────────────────────────────────────────────────────────

    public interface IAppointmentObserver
    {
        // Called by the Subject whenever an appointment event occurs.
        // eventType examples: "Booked", "Cancelled", "Rescheduled", "StatusUpdated"
        void Update(Appointment appointment, string eventType);
    }
}