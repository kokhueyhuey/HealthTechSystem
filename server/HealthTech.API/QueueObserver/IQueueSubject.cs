namespace HealthTech.API.Observer.Queue
{
    // ════════════════════════════════════════════════════════════════════
    // OBSERVER PATTERN — Step 2: the Subject interface (Queue module)
    // ════════════════════════════════════════════════════════════════════
    //
    // CONCEPT — Modularity:
    //   The Subject contract lives in its own file. QueueService implements
    //   it, but any alternative (e.g. MockQueueService in unit tests) can
    //   substitute it without changing a single observer.
    //
    // CONCEPT — Encapsulation:
    //   The internal observer list (_observers) is hidden inside QueueService.
    //   External callers only see these three verbs: Register, Remove, Notify.
    //
    // SOLID — Open/Closed Principle (OCP):
    //   Adding a new observer type (e.g. AdminQueueObserver for analytics)
    //   only requires calling RegisterObserver() — the Subject is never
    //   modified; it is extended purely through registration.
    //
    // SOLID — Dependency Inversion Principle (DIP):
    //   Controllers depend on IQueueSubject, not QueueService directly.
    //   This keeps the HTTP layer independent of the queue business logic.
    // ════════════════════════════════════════════════════════════════════

    public interface IQueueSubject
    {
        void RegisterObserver(IQueueObserver observer);
        void RemoveObserver(IQueueObserver observer);

        /// <summary>
        /// Fans out the current QueueState to every registered observer.
        /// Always called internally by QueueService after mutating state.
        /// </summary>
        Task NotifyObservers(Models.QueueState queueState, string eventType);
    }
}