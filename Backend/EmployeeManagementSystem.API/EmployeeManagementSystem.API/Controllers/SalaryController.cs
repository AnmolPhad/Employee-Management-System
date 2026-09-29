using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Salary;
using EmployeeManagementSystem.API.Services;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    /// <summary>
    /// Employee self-service salary endpoint.
    /// Employees can ONLY see their Annual CTC — no breakdown.
    /// </summary>
    [ApiController]
    [Route("api/salary")]
    [Authorize]
    [Produces("application/json")]
    [Tags("Employee")]
    public class SalaryController : ControllerBase
    {
        private readonly ISalaryService _salaryService;

        public SalaryController(ISalaryService salaryService)
        {
            _salaryService = salaryService;
        }

        /// <summary>
        /// Get the logged-in employee's salary information (CTC only).
        /// Employee must NOT see: Basic Salary, PF percentage, PF amount,
        /// Unpaid leave deduction, Allowances, Deductions, Net Salary breakdown.
        /// </summary>
        [HttpGet("me")]
        [ProducesResponseType(typeof(ApiResponse<SalaryMeResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<SalaryMeResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<SalaryMeResponseDto>>> GetMySalary(
            CancellationToken cancellationToken)
        {
            var result = await _salaryService.GetMySalaryAsync(User, cancellationToken);
            return ToActionResult(result);
        }

        private ActionResult<ApiResponse<T>> ToActionResult<T>(ServiceResult<T> result)
        {
            if (result.Succeeded)
            {
                return Ok(ApiResponse<T>.Ok(result.Data!, result.Message));
            }

            var response = ApiResponse<T>.Fail(result.Message);
            return result.Status switch
            {
                ServiceResultStatus.NotFound => NotFound(response),
                ServiceResultStatus.BadRequest => BadRequest(response),
                ServiceResultStatus.Conflict => Conflict(response),
                ServiceResultStatus.Forbidden => StatusCode(StatusCodes.Status403Forbidden, response),
                ServiceResultStatus.Unauthorized => Unauthorized(response),
                _ => StatusCode(StatusCodes.Status500InternalServerError, response)
            };
        }
    }
}
