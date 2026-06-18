using Microsoft.AspNetCore.SignalR;

namespace HealthTech.API.Hubs
{
    // SignalR Hub — Real-time bridge between QueueService and React clients
    // CONCEPT — Modularity:
    //   QueueHub is intentionally thin. It is NOT the Subject and NOT
    //   an observer. It is the transport layer. Business logic stays in
    //   QueueService; real-time delivery is handled here.
    //
    // CONCEPT — Abstraction:
    //   The React frontend calls hub methods (JoinQueueGroup, LeaveQueueGroup).
    //   It never sees QueueService internals — only the clean SignalR contract.
    //
    // SOLID — SRP:
    //   QueueHub manages WebSocket connections and group membership.
    //   It does not own queue state, does not call observers directly.
    //
    // HOW IT CONNECTS TO THE OBSERVER PATTERN:
    //   SignalRQueueObserver holds an IHubContext<QueueHub>.
    //   When QueueService calls NotifyObservers(), SignalRQueueObserver
    //   uses that context to push "ReceiveQueueUpdate" to all clients.
    //   The hub itself is passive — it just keeps connections alive.

    public class QueueHub : Hub
    {
        // Patient frontend calls this on page load to subscribe to
        // targeted (group-based) updates. e.g. group = "queue-main"
        public async Task JoinQueueGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            Console.WriteLine($"[SIGNALR HUB] Client {Context.ConnectionId} joined group '{groupName}'");
        }

        public async Task LeaveQueueGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            Console.WriteLine($"[SIGNALR HUB] Client {Context.ConnectionId} left group '{groupName}'");
        }

        public override Task OnConnectedAsync()
        {
            Console.WriteLine($"[SIGNALR HUB] Client connected: {Context.ConnectionId}");
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            Console.WriteLine($"[SIGNALR HUB] Client disconnected: {Context.ConnectionId}");
            return base.OnDisconnectedAsync(exception);
        }
    }
}