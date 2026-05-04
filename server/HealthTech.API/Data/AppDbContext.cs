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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // We use OnDelete(DeleteBehavior.Restrict) to PREVENT cascading deletes
            // (e.g., deleting a Doctor should NOT auto-delete all their appointments —
            //  the clinic still needs that history for records).
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

            // unique Email across all users
            modelBuilder.Entity<Patient>().HasIndex(p => p.Email).IsUnique();
            modelBuilder.Entity<Doctor>().HasIndex(d => d.Email).IsUnique();
            modelBuilder.Entity<Pharmacist>().HasIndex(ph => ph.Email).IsUnique();
        }
    }
}