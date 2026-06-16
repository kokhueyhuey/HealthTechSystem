using HealthTech.API.Data;
using HealthTech.API.Hubs;
using HealthTech.API.Patterns.QueueObserver;
using HealthTech.API.Patterns.AppointmentObserver;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Core services 
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddSignalR();

// CORS 
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

//   AppointmentService depends on IAppointmentObserver (interface).
//   The concrete SignalRAppointmentObserver is wired here, not inside the service.
builder.Services.AddScoped<SignalRAppointmentObserver>(); // registered first so it can be injected
builder.Services.AddScoped<AppointmentService>();         // receives SignalRAppointmentObserver
//  Observer — Queue module 
// SINGLETON: one shared instance so every HTTP request and SignalR event
// operates on the same live queue state. Matches the lock(_lock) pattern
// inside QueueService.
//
// SOLID — OCP: to add a new observer (SMS, analytics) just add one more
// RegisterObserver() call below — QueueService itself never changes.
builder.Services.AddSingleton<QueueService>();

// ── Build app ──────────────────────────────────────────────────────────
var app = builder.Build();

// ── Wire Queue observers AFTER build so IHubContext is resolvable ──────
//
// CONCEPT — Modularity: observer registration is a startup concern.
// The QueueService and each observer class know nothing about this wiring.
//
var queueService = app.Services.GetRequiredService<QueueService>();
var hubContext   = app.Services.GetRequiredService<IHubContext<QueueHub>>();

await queueService.InitializeAsync();

// Observer 1 — broadcasts to ALL React clients via SignalR WebSocket
queueService.RegisterObserver(new SignalRQueueObserver(hubContext));

// Observer 2 — doctor-facing log / future: push to doctor dashboard group
queueService.RegisterObserver(new DoctorQueueObserver());

// Observer 3 — pharmacist log / future: SMS or in-app notification
queueService.RegisterObserver(new PharmacistQueueObserver());

// ── Middleware pipeline ────────────────────────────────────────────────
app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Existing appointment hub
app.MapHub<NotificationHub>("/notificationHub");

// New queue hub — React frontend connects to this for live queue updates
app.MapHub<QueueHub>("/hubs/queue");
// new — appointment real-time updates
app.MapHub<AppointmentHub>("/appointmentHub");

app.Run();