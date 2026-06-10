using HealthTech.API.Models;

namespace HealthTech.API.Patterns.Builder
{
    public interface IPrescriptionBuilder
    {
        IPrescriptionBuilder SetPatient(
            int patientId,
            string patientName
        );

        IPrescriptionBuilder SetDoctor(int doctorId);

        IPrescriptionBuilder SetAppointment(int appointmentId);

        IPrescriptionBuilder AddMedicine(
            int medicineId,
            string medicineName,
            string dosage,
            int quantity,
            string usageInstruction,
            string preference
        );

        IPrescriptionBuilder SetMc(
            bool needMc,
            string mcReason,
            int mcDays
        );

        IPrescriptionBuilder SetPendingStatus();

        Prescription Build();
    }
}