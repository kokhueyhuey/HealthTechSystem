using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthTech.API.Migrations
{
    /// <inheritdoc />
    public partial class SeedPharmacist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Pharmacists",
                columns: new[] { "Id", "CanApproveInventory", "CreatedAt", "Email", "Name", "PasswordHash", "PharmacistLicenseNumber", "PhoneNumber", "Role", "ShiftSchedule", "StaffId" },
                values: new object[] { 999, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "pharmacist@gmail.com", "Pharmacist (System Admin)", "pharmacist@123", "PH001", "011-1111111", "Pharmacist", "Mon-Sun 9am-5pm", "STAFF-001" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Pharmacists",
                keyColumn: "Id",
                keyValue: 999);
        }
    }
}
