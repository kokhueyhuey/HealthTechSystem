using HealthTech.API.Models;
using Microsoft.AspNetCore.Mvc;
using HealthTech.API.Patterns.QueueObserver;

namespace HealthTech.API.Controllers
{
    // HTTP Controller — exposes QueueService operations as REST endpoints
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

    [ApiController]
    [Route("api/[controller]")]
    public class QueueController : ControllerBase
    {
        private readonly QueueService _queueService;

        public QueueController(QueueService queueService)
        {
            _queueService = queueService;
        }

        // GET api/queue 
        [HttpGet]
        public async Task<ActionResult<QueueState>> GetQueueState()
        {
            return Ok(await _queueService.GetCurrentStateAsync());
        }

        // POST api/queue/enqueue 
        [HttpPost("enqueue")]
        public async Task<ActionResult<QueueEntry>> Enqueue([FromBody] EnqueueRequest req)
        {
            var entry = await _queueService.EnqueuePatient(
                req.AppointmentId, req.PatientId, req.PatientName);
            return Ok(entry);
        }

        // POST api/queue/next 
        [HttpPost("next")]
        public async Task<ActionResult<QueueState>> CallNext([FromBody] DoctorIdRequest req)
        {
            var state = await _queueService.CallNext(req.DoctorId);
            return Ok(state);
        }

        // POST api/queue/complete 
        [HttpPost("complete")]
        public async Task<ActionResult<QueueState>> Complete([FromBody] AppointmentIdRequest req)
        {
            var state = await _queueService.CompleteCurrentPatient(req.AppointmentId);
            return Ok(state);
        }

        // POST api/queue/skip 
        [HttpPost("skip")]
        public async Task<ActionResult<QueueState>> Skip([FromBody] DoctorIdRequest req)
        {
            var state = await _queueService.SkipCurrentPatient(req.DoctorId);
            return Ok(state);
        }

        // DELETE api/queue/reset 
        [HttpDelete("reset")]
        public async Task<ActionResult<QueueState>> Reset()
        {
            var state = await _queueService.ResetQueue();
            return Ok(state);
        }
    }

    // Request DTOs 
    public record EnqueueRequest(int AppointmentId, int PatientId, string PatientName);

    /// Used by CallNext and Skip — identifies which doctor is acting
    public record DoctorIdRequest(int DoctorId);

    /// Used by Complete — pinpoints the exact appointment being closed
    public record AppointmentIdRequest(int AppointmentId);
}