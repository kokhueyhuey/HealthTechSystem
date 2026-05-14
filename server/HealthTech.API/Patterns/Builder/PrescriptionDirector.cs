using HealthTech.API.Models;

namespace HealthTech.API.Patterns.Builder
{
    public class PrescriptionDirector
    {
        private readonly IPrescriptionBuilder _builder;

        public PrescriptionDirector(IPrescriptionBuilder builder)
        {
            _builder = builder;
        }

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
            _builder
                .SetPatient(patientId, patientName)
                .SetDoctor(doctorId)
                .SetAppointment(appointmentId)
                .SetMc(needMc, mcReason, mcDays)
                .SetPendingStatus();

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

            return _builder.Build();
        }
    }
}