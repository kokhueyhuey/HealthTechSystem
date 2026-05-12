using HealthTech.API.Models;

namespace HealthTech.API.Patterns.Builder
{
    public class PrescriptionBuilder
    {
        private readonly Prescription _prescription = new();

        public PrescriptionBuilder SetPatient(int patientId, string patientName)
        {
            _prescription.PatientId = patientId;
            _prescription.PatientName = patientName;
            return this;
        }

        public PrescriptionBuilder SetDoctor(int doctorId)
        {
            _prescription.DoctorId = doctorId;
            return this;
        }

        public PrescriptionBuilder SetAppointment(int appointmentId)
        {
            _prescription.AppointmentId = appointmentId;
            return this;
        }

        public PrescriptionBuilder AddMedicine(
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

        public PrescriptionBuilder SetMc(bool needMc, string mcReason, int mcDays)
        {
            _prescription.NeedMc = needMc;
            _prescription.McReason = mcReason;
            _prescription.McDays = mcDays;
            return this;
        }

        public PrescriptionBuilder SetPendingStatus()
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