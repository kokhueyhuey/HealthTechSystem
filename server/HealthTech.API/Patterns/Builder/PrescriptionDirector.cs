using HealthTech.API.Models;

namespace HealthTech.API.Patterns.Builder
{
    // BUILDER PATTERN — Director Class
    //
    // CONCEPT — Modularity:
    //   The construction workflow is separated from the actual object
    //   representation, making the code easier to manage and maintain.
    //
    // SOLID — Dependency Inversion Principle (DIP):
    //   The Director depends on the abstraction IPrescriptionBuilder
    //   instead of a specific concrete builder implementation.
    //
    // PURPOSE:
    //   The Director standardises the process of building prescriptions
    //   so that every prescription follows the same workflow.
    //
    // SYSTEM BEHAVIOUR:
    //   The doctor generates a prescription by selecting medicines,
    //   entering dosage details, and submitting the prescription.
    //   The Director coordinates all building steps before returning
    //   the completed Prescription object.

    public class PrescriptionDirector
    {
        // Stores the builder object used to construct prescriptions.
        private readonly IPrescriptionBuilder _builder;

        // Constructor injection of the prescription builder.
        public PrescriptionDirector(IPrescriptionBuilder builder)
        {
            _builder = builder;
        }

        // Controls the step-by-step prescription construction process.
        public Prescription ConstructPrescription(
            int patientId,
            string patientName,
            int doctorId,
            int appointmentId,
            bool needMc,
            string mcReason,
            int mcDays,
            List<PrescriptionItem> items
        )
        {
            // BREAKPOINT HERE — Director takes control; pattern entered before any builder step runs
            Console.WriteLine($"[BUILDER DIRECTOR] ConstructPrescription started | PatientId={patientId} | Items={items.Count}");

            // Starts a fresh build — the Prescription product is created here,
            // after the Director has taken control of the construction process.
            _builder.Reset();

            // Assigns general prescription information.
            _builder
                .SetPatient(patientId, patientName)
                .SetDoctor(doctorId)
                .SetAppointment(appointmentId)
                .SetMc(needMc, mcReason, mcDays)
                .SetPendingStatus();

            // Adds each medicine to the prescription.
            foreach (var item in items)
            {
                _builder.AddMedicine(
                    item.MedicineId,
                    item.MedicineName,
                    item.Dosage,
                    item.Quantity,
                    item.UsageInstruction,
                    item.Preference
                );
            }

            // Returns the fully constructed prescription object.
            return _builder.Build();
        }
    }
}