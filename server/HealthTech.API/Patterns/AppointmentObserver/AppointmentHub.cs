using Microsoft.AspNetCore.SignalR;

namespace HealthTech.API.Hubs
{
    // CONCEPT — Modularity:
    //   AppointmentHub is a dedicated hub ONLY for appointment events.
    //   It does NOT handle queue events (that is QueueHub's job).
    //   Separation of concerns — one hub per domain.
    //
    // CONCEPT — Abstraction:
    //   Frontend clients connect here and listen for "ReceiveAppointmentUpdate".
    //   They never see AppointmentService internals — only the clean event name.
    //
    // SOLID — SRP:
    //   This hub only manages WebSocket connections for appointments.
    //   Business logic stays in AppointmentService. Notification delivery
    //   is handled by SignalRAppointmentObserver (which holds IHubContext).
    //
    // HOW IT CONNECTS TO THE OBSERVER PATTERN:
    //   SignalRAppointmentObserver holds IHubContext<AppointmentHub>.
    //   When AppointmentService calls NotifyObservers(), the SignalR observer
    //   uses that context to push "ReceiveAppointmentUpdate" to all clients.
    //   This hub itself is passive — it just keeps connections alive.

    public class AppointmentHub : Hub
    {
        public override Task OnConnectedAsync()
        {
            Console.WriteLine($"[APPOINTMENT HUB] Client connected: {Context.ConnectionId}");
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            Console.WriteLine($"[APPOINTMENT HUB] Client disconnected: {Context.ConnectionId}");
            return base.OnDisconnectedAsync(exception);
        }
    }
}