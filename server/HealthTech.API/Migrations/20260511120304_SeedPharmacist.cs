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
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM [Pharmacists] WHERE [Id] = 999)
                BEGIN
                    INSERT INTO [Pharmacists] ([Id], [CanApproveInventory], [CreatedAt], [Email], [Name], [PasswordHash], [PharmacistLicenseNumber], [PhoneNumber], [Role], [ShiftSchedule], [StaffId])
                    VALUES (999, 1, '2026-01-01T00:00:00.0000000Z', N'pharmacist@gmail.com', N'Pharmacist (System Admin)', N'pharmacist@123', N'PH001', N'011-1111111', N'Pharmacist', N'Mon-Sun 9am-5pm', N'STAFF-001');
                END
            ");
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
