using Microsoft.EntityFrameworkCore;
using HealthTech.API.Models;

namespace HealthTech.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Each DbSet = one table
        public DbSet<Patient>     Patients     { get; set; }
        public DbSet<Doctor>      Doctors      { get; set; }
        public DbSet<Pharmacist>  Pharmacists  { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Medicine>    Medicines    { get; set; }
        public DbSet<QueueRecord> QueueRecords { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<PrescriptionItem> PrescriptionItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // We use OnDelete(DeleteBehavior.Restrict) to PREVENT cascading deletes
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Doctor)
                .WithMany(d => d.Appointments)
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<QueueRecord>()
                .ToTable("Queue")
                .HasIndex(q => q.TicketNumber)
                .IsUnique();

            modelBuilder.Entity<QueueRecord>()
                .HasOne(q => q.Appointment)
                .WithMany()
                .HasForeignKey(q => q.AppointmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // unique Email across all users
            modelBuilder.Entity<Patient>().HasIndex(p => p.Email).IsUnique();
            modelBuilder.Entity<Doctor>().HasIndex(d => d.Email).IsUnique();
            modelBuilder.Entity<Pharmacist>().HasIndex(ph => ph.Email).IsUnique();

            // Patients authenticate with IC last-4 digits stored as ICPin
            modelBuilder.Entity<Patient>()
                .Property(p => p.PasswordHash)
                .HasColumnName("ICPin");

            //Pharmacist seed acc
            modelBuilder.Entity<Pharmacist>().HasData(new Pharmacist
            {
                Id = 999,
                Name = "Pharmacist (System Admin)",
                Email = "pharmacist@gmail.com",
                PasswordHash = "pharmacist@123",
                PhoneNumber = "011-1111111",
                Role = "Pharmacist", 
                PharmacistLicenseNumber = "PH001",
                StaffId = "STAFF-001",
                ShiftSchedule = "Mon-Sun 9am-5pm",
                CanApproveInventory = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) // ⬅ Fixed typo
            });
        } 
    }
}