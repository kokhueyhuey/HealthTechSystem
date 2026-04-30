using Microsoft.EntityFrameworkCore;
using HealthTech.API.Models;

namespace HealthTech.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Patient> Patients { get; set; }
    }
}