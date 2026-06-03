using HealthTech.API.Models;

namespace HealthTech.API.Patterns.Builder
{

    // ─────────────────────────────────────────────────────────────────────────
    // BUILDER PATTERN — Builder Interface
    //
    // CONCEPT — Modularity:
    //   Prescription construction is separated into smaller steps such as
    //   setting patient information, adding medicines, and assigning MC.
    //
    // CONCEPT — Refinement:
    //   The builder process is refined step-by-step to construct a complete
    //   Prescription object gradually.
    //
    // SOLID — Interface Segregation Principle (ISP):
    //   The interface only contains methods related to prescription building.
    //   Classes using this interface are not forced to depend on unrelated
    //   methods.
    //
    // SOLID — Dependency Inversion Principle (DIP):
    //   Higher-level modules depend on the abstraction (IPrescriptionBuilder)
    //   rather than concrete builder implementations.
    //
    // PURPOSE:
    //   This interface standardises the process of creating prescriptions
    //   with different medicines, dosage instructions, and patient details.
    //
    // SYSTEM BEHAVIOUR:
    //   Doctors use the builder process to gradually construct a prescription
    //   before the pharmacist reviews and approves it.
    // ─────────────────────────────────────────────────────────────────────────

    public interface IPrescriptionBuilder
    {
        // Assigns patient information to the prescription.
        IPrescriptionBuilder SetPatient(
            int patientId,
            string patientName
        );

        // Assigns doctor information to the prescription.
        IPrescriptionBuilder SetDoctor(int doctorId);

        // Assigns appointment information to the prescription.
        IPrescriptionBuilder SetAppointment(int appointmentId);

        // Adds medicine information to the prescription.
        IPrescriptionBuilder AddMedicine(
            int medicineId,
            string medicineName,
            string dosage,
            int quantity,
            string usageInstruction,
            string preference
        );

        // Assigns MC information to the prescription.
        IPrescriptionBuilder SetMc(
            bool needMc,
            string mcReason,
            int mcDays
        );

        // Sets the prescription status before pharmacist approval.
        IPrescriptionBuilder SetPendingStatus();

        // Returns the fully constructed Prescription object.
        Prescription Build();
    }
}