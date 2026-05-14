using HealthTech.API.Models;

namespace HealthTech.API.Patterns.Builder
{
    public class PrescriptionBuilder : IPrescriptionBuilder
    {
        private readonly Prescription _prescription = new();

        public IPrescriptionBuilder SetPatient(
            int patientId,
            string patientName
        )
        {
            _prescription.PatientId = patientId;
            _prescription.PatientName = patientName;

            return this;
        }

        public IPrescriptionBuilder SetDoctor(int doctorId)
        {
            _prescription.DoctorId = doctorId;

            return this;
        }

        public IPrescriptionBuilder SetAppointment(int appointmentId)
        {
            _prescription.AppointmentId = appointmentId;

            return this;
        }

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

        public IPrescriptionBuilder SetPendingStatus()
        {
            _prescription.Status = "Pending";

            return this;
        }

        public Prescription Build()
        {
            _prescription.CreatedAt = DateTime.UtcNow;

            return _prescription;
        }
    }
}