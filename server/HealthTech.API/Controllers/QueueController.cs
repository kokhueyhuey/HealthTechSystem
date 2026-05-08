using HealthTech.API.Models;
using HealthTech.API.Observer.Queue;
using Microsoft.AspNetCore.Mvc;

// ── Explicit using so the compiler can resolve QueueService ───────────
using HealthTech.API.QueueObserver;

namespace HealthTech.API.Controllers
{
    // ════════════════════════════════════════════════════════════════════
    // HTTP Controller — exposes QueueService operations as REST endpoints
    // ════════════════════════════════════════════════════════════════════
    //
    // NOTE — [Authorize] intentionally removed for local Swagger testing.
    // Re-add [Authorize] / [Authorize(Roles = "...")] once JWT auth is
    // wired into Program.cs (see Option B in the fix instructions).
    //
    // CONCEPT — Modularity:
    //   Thin HTTP adapter. All queue logic stays inside QueueService.
    //
    // SOLID — Dependency Inversion Principle (DIP):
    //   Constructor receives QueueService via ASP.NET Core DI.
    //   No manual instantiation (no "new QueueService()") anywhere.
    // ════════════════════════════════════════════════════════════════════

    [ApiController]
    [Route("api/[controller]")]
    public class QueueController : ControllerBase
    {
        private readonly QueueService _queueService;

        public QueueController(QueueService queueService)
        {
            _queueService = queueService;
        }

        // ── GET api/queue ──────────────────────────────────────────────
        [HttpGet]
        public ActionResult<QueueState> GetQueueState()
        {
            return Ok(_queueService.GetCurrentState());
        }

        // ── POST api/queue/enqueue ─────────────────────────────────────
        [HttpPost("enqueue")]
        public async Task<ActionResult<QueueEntry>> Enqueue([FromBody] EnqueueRequest req)
        {
            var entry = await _queueService.EnqueuePatient(
                req.AppointmentId, req.PatientId, req.PatientName);
            return Ok(entry);
        }

        // ── POST api/queue/next ────────────────────────────────────────
        [HttpPost("next")]
        public async Task<ActionResult<QueueState>> CallNext()
        {
            var state = await _queueService.CallNext();
            return Ok(state);
        }

        // ── POST api/queue/complete ────────────────────────────────────
        [HttpPost("complete")]
        public async Task<ActionResult<QueueState>> Complete()
        {
            var state = await _queueService.CompleteCurrentPatient();
            return Ok(state);
        }

        // ── POST api/queue/skip ────────────────────────────────────────
        [HttpPost("skip")]
        public async Task<ActionResult<QueueState>> Skip()
        {
            var state = await _queueService.SkipCurrentPatient();
            return Ok(state);
        }

        // ── DELETE api/queue/reset ─────────────────────────────────────
        [HttpDelete("reset")]
        public async Task<ActionResult<QueueState>> Reset()
        {
            var state = await _queueService.ResetQueue();
            return Ok(state);
        }
    }

    // ── Request DTO ────────────────────────────────────────────────────
    public record EnqueueRequest(int AppointmentId, int PatientId, string PatientName);
}