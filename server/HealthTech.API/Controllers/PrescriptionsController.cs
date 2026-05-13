using HealthTech.API.Data;
using HealthTech.API.Models;
using HealthTech.API.Patterns.Builder;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthTech.API.Patterns.State;

namespace HealthTech.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrescriptionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PrescriptionsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingPrescriptions()
        {
            var prescriptions = await _context.Prescriptions
                .Include(p => p.Items)
                .Where(p => p.Status == "Pending")
                .Select(p => new
                {
                    p.Id,
                    p.AppointmentId,
                    p.PatientId,
                    p.PatientName,
                    p.DoctorId,
                    p.Status,
                    p.NeedMc,
                    p.McReason,
                    p.McDays,
                    p.CreatedAt,
                    Items = p.Items.Select(item => new
                    {
                        item.Id,
                        item.MedicineId,
                        item.MedicineName,
                        item.Dosage,
                        item.Quantity,
                        item.UsageInstruction,
                        item.Preference
                    })
                })
                .ToListAsync();

            return Ok(prescriptions);
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GeneratePrescription(CreatePrescriptionRequest request)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a =>
                    a.Id == request.AppointmentId &&
                    a.Status == "InConsultation");

            if (appointment == null)
            {
                return BadRequest("No patient currently in consultation.");
            }

            if (request.Items.Count == 0)
            {
                return BadRequest("Please add at least one medicine.");
            }

            var builder = new PrescriptionBuilder()
                .SetPatient(appointment.PatientId, appointment.Patient?.Name ?? "Unknown")
                .SetDoctor(appointment.DoctorId)
                .SetAppointment(appointment.Id)
                .SetMc(request.NeedMc, request.McReason, request.McDays)
                .SetPendingStatus();

            foreach (var item in request.Items)
            {
                var medicine = await _context.Medicines.FindAsync(item.MedicineId);

                if (medicine == null)
                {
                    return BadRequest("Medicine not found.");
                }

                if (medicine.Quantity < item.Quantity)
                {
                    return BadRequest($"{medicine.Name} does not have enough stock.");
                }

                builder.AddMedicine(
                    medicine.Id,
                    medicine.Name,
                    item.Dosage,
                    item.Quantity,
                    item.UsageInstruction,
                    item.Preference
                );
            }

            var prescription = builder.Build();

            _context.Prescriptions.Add(prescription);
            appointment.Status = "Completed";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                prescription.Id,
                prescription.AppointmentId,
                prescription.PatientId,
                prescription.PatientName,
                prescription.DoctorId,
                prescription.Status,
                prescription.NeedMc,
                prescription.McReason,
                prescription.McDays,
                prescription.CreatedAt,
                Items = prescription.Items.Select(item => new
                {
                    item.Id,
                    item.MedicineId,
                    item.MedicineName,
                    item.Dosage,
                    item.Quantity,
                    item.UsageInstruction,
                    item.Preference
                })
            });
        }

        [HttpPost("complete-without-prescription")]
        public async Task<IActionResult> CompleteWithoutPrescription(CompleteWithoutPrescriptionRequest request)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a =>
                    a.Id == request.AppointmentId &&
                    a.Status == "InConsultation");

            if (appointment == null)
            {
                return BadRequest("No patient currently in consultation.");
            }

            appointment.Status = "Completed";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Consultation completed without prescription."
            });
        }

        [HttpPut("approve/{id}")]
        public async Task<IActionResult> ApprovePrescription(int id)
        {
            var prescription = await _context.Prescriptions
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (prescription == null)
            {
                return NotFound("Prescription not found.");
            }

            if (prescription.Status != "Pending")
            {
                return BadRequest("Only pending prescriptions can be approved.");
            }

            foreach (var item in prescription.Items)
            {
                var medicine = await _context.Medicines.FindAsync(item.MedicineId);

                if (medicine == null)
                {
                    return BadRequest($"Medicine {item.MedicineName} not found.");
                }

                if (medicine.Quantity < item.Quantity)
                {
                    return BadRequest($"{medicine.Name} does not have enough stock.");
                }

                medicine.Quantity -= item.Quantity;

                var medicineContext = new MedicineContext(
                    medicine.Quantity,
                    medicine.Threshold,
                    medicine.ExpiryDate
                );

                medicine.Status = medicineContext.GetStatus();
            }

            prescription.Status = "Approved";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Prescription approved successfully.",
                prescription.Id,
                prescription.Status
            });
        }

        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetPatientPrescriptionHistory(int patientId)
        {
            var prescriptions = await _context.Prescriptions
                .Include(p => p.Items)
                .Where(p => p.PatientId == patientId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.AppointmentId,
                    p.PatientId,
                    p.PatientName,
                    p.DoctorId,
                    p.Status,
                    p.NeedMc,
                    p.McReason,
                    p.McDays,
                    p.CreatedAt,
                    Items = p.Items.Select(item => new
                    {
                        item.Id,
                        item.MedicineId,
                        item.MedicineName,
                        item.Dosage,
                        item.Quantity,
                        item.UsageInstruction,
                        item.Preference
                    })
                })
                .ToListAsync();

            return Ok(prescriptions);
        }
    }

    public class CreatePrescriptionRequest
    {
        public int AppointmentId { get; set; }
        public bool NeedMc { get; set; }
        public string McReason { get; set; } = "";
        public int McDays { get; set; }
        public List<CreatePrescriptionItemRequest> Items { get; set; } = new();
    }

    public class CreatePrescriptionItemRequest
    {
        public int MedicineId { get; set; }
        public string Dosage { get; set; } = "";
        public int Quantity { get; set; }
        public string UsageInstruction { get; set; } = "";
        public string Preference { get; set; } = "";
    }

    public class CompleteWithoutPrescriptionRequest
    {
        public int AppointmentId { get; set; }
    }
}