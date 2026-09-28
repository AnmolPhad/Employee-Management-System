using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Tags("Health")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new
            {
                status = "Online",
                service = "Employee Management System Web API",
                timestamp = DateTime.UtcNow,
                version = "1.0.0"
            });
        }

        [HttpGet("test-error")]
        public IActionResult TriggerTestError()
        {
            throw new InvalidOperationException("Test exception triggered to verify Serilog error logging and ExceptionHandlingMiddleware.");
        }
    }
}
