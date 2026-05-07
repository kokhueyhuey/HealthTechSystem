using HealthTech.API.Data;
using HealthTech.API.Hubs;
using Microsoft.EntityFrameworkCore;
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddSignalR();

// ── Observer Pattern — register AppointmentService ────────────────────────
// Scoped = one instance per HTTP request.
// The constructor auto-registers all 3 observers (Patient, Doctor, Pharmacist).
// CONCEPT — Architecture: Service registered here, injected into Controller via DI.
builder.Services.AddScoped<HealthTech.API.Services.AppointmentService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:5173") // frontend URL
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()); // 🔥 IMPORTANT
});


var app = builder.Build();

app.UseCors("AllowFrontend");

// Enable Swagger (ONLY development mode)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapHub<NotificationHub>("/notificationHub");

app.Run();