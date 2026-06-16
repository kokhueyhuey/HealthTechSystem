using HealthTech.API.Models;
using HealthTech.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace HealthTech.API.Patterns.QueueObserver
{
    // ════════════════════════════════════════════════════════════════════
    // OBSERVER PATTERN — Concrete Observer: SignalR Broadcaster
    // ════════════════════════════════════════════════════════════════════
    //
    // CONCEPT — Refinement:
    //   This observer specialises the abstract OnQueueUpdated() contract
    //   into a real-time WebSocket broadcast via SignalR. It translates
    //   an in-process event into a network-level push message.
    //
    // CONCEPT — Functional Independence:
    //   SignalRQueueObserver knows nothing about PatientQueueObserver or
    //   PharmacistQueueObserver. It fires independently of all others.
    //   Deleting it only removes the real-time push; nothing else breaks.
    //
    // CONCEPT — Modularity:
    //   Real-time transport (SignalR) is isolated here. If the team later
    //   switches to WebSockets or SSE, only this file changes.
    //
    // SOLID — Single Responsibility Principle (SRP):
    //   One job: receive a QueueState and broadcast it to ALL connected
    //   clients via the SignalR hub. No business logic lives here.
    //
    // SOLID — Dependency Inversion Principle (DIP):
    //   Depends on IHubContext<QueueHub> (abstraction), not a concrete hub
    //   instance. Fully testable with a mocked hub context.
    // ════════════════════════════════════════════════════════════════════

    public class SignalRQueueObserver : IQueueObserver
    {
        private readonly IHubContext<QueueHub> _hubContext;

        // IHubContext is injected by ASP.NET Core DI — no new() anywhere.
        public SignalRQueueObserver(IHubContext<QueueHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task OnQueueUpdated(QueueState queueState, string eventType)
        {
            // Broadcast to ALL connected clients 
            // "ReceiveQueueUpdate" is the event name the React frontend
            // subscribes to: connection.on("ReceiveQueueUpdate", handler)
            // BREAKPOINT HERE
            await _hubContext.Clients.All.SendAsync("ReceiveQueueUpdate", new
            {
                eventType,
                nowServing       = queueState.NowServing,
                lastIssued       = queueState.LastIssued,
                waitingCount     = queueState.WaitingCount,
                minutesPerSlot   = queueState.MinutesPerSlot,
                queue            = queueState.Queue,
                lastUpdatedUtc   = queueState.LastUpdatedUtc
            });

            Console.WriteLine($"[SIGNALR BROADCAST] Event='{eventType}' | NowServing={queueState.NowServing} | Waiting={queueState.WaitingCount}");
        }
    }
}