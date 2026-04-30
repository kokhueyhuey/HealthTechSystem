using Microsoft.AspNetCore.Mvc;

namespace HealthTech.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok("HealthTech API is working!");
        }
    }
}