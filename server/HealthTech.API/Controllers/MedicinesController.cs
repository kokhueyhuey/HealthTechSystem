using HealthTech.API.Data;
using HealthTech.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthTech.API.Patterns.State;

namespace HealthTech.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MedicinesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MedicinesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<Medicine>>> GetMedicines()
        {
            return await _context.Medicines.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Medicine>> AddMedicine(Medicine medicine)
        {
            var medicineContext = new MedicineContext(
                medicine.Quantity,
                medicine.Threshold,
                medicine.ExpiryDate
            );

            medicine.Status = medicineContext.GetStatus();

            _context.Medicines.Add(medicine);
            await _context.SaveChangesAsync();

            return Ok(medicine);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMedicine(int id, Medicine medicine)
        {
            var existingMedicine = await _context.Medicines.FindAsync(id);

            if (existingMedicine == null)
            {
                return NotFound();
            }

            existingMedicine.Name = medicine.Name;
            existingMedicine.Description = medicine.Description;
            existingMedicine.Photo = medicine.Photo;
            existingMedicine.Quantity = medicine.Quantity;
            existingMedicine.Threshold = medicine.Threshold;
            existingMedicine.ExpiryDate = medicine.ExpiryDate;

            var medicineContext = new MedicineContext(
                medicine.Quantity,
                medicine.Threshold,
                medicine.ExpiryDate
            );

            existingMedicine.Status = medicineContext.GetStatus();

            await _context.SaveChangesAsync();

            return Ok(existingMedicine);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMedicine(int id)
        {
            var medicine = await _context.Medicines.FindAsync(id);

            if (medicine == null)
            {
                return NotFound();
            }

            _context.Medicines.Remove(medicine);
            await _context.SaveChangesAsync();

            return Ok();
        }

    }
}