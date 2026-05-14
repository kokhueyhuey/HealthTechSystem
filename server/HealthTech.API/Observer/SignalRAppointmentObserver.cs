using HealthTech.API.Hubs;
using HealthTech.API.Models;
using Microsoft.AspNetCore.SignalR;

namespace HealthTech.API.Observer
{
    // ─────────────────────────────────────────────────────────────────────────
    // OBSERVER PATTERN — Concrete Observer #4: SignalR Broadcaster
    //
    // This is the observer that makes ALL dashboards update automatically
    // in real-time whenever any appointment event fires.
    //
    // CONCEPT — Refinement:
    //   Refines the abstract Update() contract into a real-time WebSocket
    //   broadcast. It translates an in-process C# event into a network-level
    //   push message delivered to every connected browser tab.
    //
    // CONCEPT — Functional Independence:
    //   SignalRAppointmentObserver knows nothing about PatientObserver,
    //   DoctorObserver, or PharmacistObserver. Each fires independently.
    //   Removing this only removes real-time push — nothing else breaks.
    //
    // CONCEPT — Modularity:
    //   Real-time transport (SignalR) is isolated here. If the team switches
    //   to polling or SSE later, only this file changes.
    //
    // SOLID — SRP: one job — receive an Appointment event, broadcast it.
    // SOLID — DIP: depends on IHubContext<AppointmentHub> (interface),
    //              not a concrete hub instance. Fully testable with a mock.
    // SOLID — OCP: new event types handled here without changing AppointmentService.
    //
    // FRONTEND USAGE:
    //   React connects to /appointmentHub and listens:
    //     connection.on("ReceiveAppointmentUpdate", (payload) => { ... })
    //   payload contains: { eventType, appointmentId, patientId, doctorId,
    //                       appointmentDate, status, notes }
    // ─────────────────────────────────────────────────────────────────────────

    public class SignalRAppointmentObserver : IAppointmentObserver
    {
        private readonly IHubContext<AppointmentHub> _hubContext;

        // IHubContext injected by ASP.NET Core DI — no new() anywhere.
        // CONCEPT — Abstraction: caller gives us the hub interface, not the hub itself.
        public SignalRAppointmentObserver(IHubContext<AppointmentHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public void Update(Appointment appointment, string eventType)
        {
            // BREAKPOINT HERE — this fires last in the observer loop.
            // Watch: after Patient/Doctor/Pharmacist observers print to console,
            // THIS fires and pushes the update to every connected browser.

            // Fire-and-forget: we cannot await inside a sync interface method.
            // Task.Run keeps it non-blocking.
            Task.Run(async () =>
            {
                await _hubContext.Clients.All.SendAsync("ReceiveAppointmentUpdate", new
                {
                    eventType,
                    appointmentId   = appointment.Id,
                    patientId       = appointment.PatientId,
                    doctorId        = appointment.DoctorId,
                    appointmentDate = appointment.AppointmentDate,
                    status          = appointment.Status,
                    notes           = appointment.Notes
                });

                Console.WriteLine(
                    $"[SIGNALR APPOINTMENT BROADCAST] Event='{eventType}' | " +
                    $"AppointmentId={appointment.Id} | Status={appointment.Status}");
            });
        }
    }
}