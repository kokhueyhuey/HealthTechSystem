using HealthTech.API.Models;

namespace HealthTech.API.Patterns.Builder
{
    // BUILDER PATTERN — Concrete Builder
    // CONCEPT — Modularity:
    //   The prescription creation process is divided into smaller steps,
    //   such as setting patient information, doctor details, medicines,
    //   and MC information.
    //
    // SOLID — Dependency Inversion Principle (DIP):
    //   The system depends on the abstraction IPrescriptionBuilder instead
    //   of directly depending on this concrete builder implementation.
    //
    // PURPOSE:
    //   This builder helps doctors create prescriptions step-by-step,
    //   especially when prescriptions contain multiple medicines,
    //   dosage instructions, patient preferences, and MC information.
    //
    // SYSTEM BEHAVIOUR:
    //   The doctor selects medicines from the medicine list and gradually
    //   builds a complete prescription before pharmacist approval.

    public class PrescriptionBuilder : IPrescriptionBuilder
    {
        // Stores the prescription object being constructed.
        // Created lazily by Reset() so the product is born only after the
        // Director begins construction, not when the builder is instantiated.
        private Prescription _prescription = null!;

        // Creates a fresh Prescription product to begin a new build.
        public IPrescriptionBuilder Reset()
        {
            // BREAKPOINT HERE — Prescription product is born, after the Director has started
            Console.WriteLine("[BUILDER CONCRETE] Reset() — new Prescription product created");
            _prescription = new Prescription();

            return this;
        }

        // Assigns patient information into the prescription.
        public IPrescriptionBuilder SetPatient(
            int patientId,
            string patientName
        )
        {
            _prescription.PatientId = patientId;
            _prescription.PatientName = patientName;

            return this;
        }

        // Assigns doctor information into the prescription.
        public IPrescriptionBuilder SetDoctor(int doctorId)
        {
            _prescription.DoctorId = doctorId;

            return this;
        }

        // Assigns appointment information into the prescription.
        public IPrescriptionBuilder SetAppointment(int appointmentId)
        {
            _prescription.AppointmentId = appointmentId;

            return this;
        }

        // Adds medicine information into the prescription item list.
        public IPrescriptionBuilder AddMedicine(
            int medicineId,
            string medicineName,
            string dosage,
            int quantity,
            string usageInstruction,
            string preference
        )
        {
            _prescription.Items.Add(new PrescriptionItem
            {
                MedicineId = medicineId,
                MedicineName = medicineName,
                Dosage = dosage,
                Quantity = quantity,
                UsageInstruction = usageInstruction,
                Preference = preference
            });

            return this;
        }

        // Assigns MC information into the prescription.
        public IPrescriptionBuilder SetMc(
            bool needMc,
            string mcReason,
            int mcDays
        )
        {
            _prescription.NeedMc = needMc;
            _prescription.McReason = mcReason;
            _prescription.McDays = mcDays;

            return this;
        }

        // Sets the prescription status before pharmacist approval.
        public IPrescriptionBuilder SetPendingStatus()
        {
            _prescription.Status = "Pending";

            return this;
        }

        // Returns the fully constructed Prescription object.
        public Prescription Build()
        {
            _prescription.CreatedAt = DateTime.Now;

            return _prescription;
        }
    }
}