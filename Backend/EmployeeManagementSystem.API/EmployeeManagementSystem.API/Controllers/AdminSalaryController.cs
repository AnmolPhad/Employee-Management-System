using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Salary;
using EmployeeManagementSystem.API.Services;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    /// <summary>
    /// Admin/HR salary management endpoints.
    /// </summary>
    [ApiController]
    [Route("api/admin/salaries")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.HR},ADMIN,HR")]
    [Produces("application/json")]
    [Tags("Admin")]
    public class AdminSalaryController : ControllerBase
    {
        private readonly ISalaryService _salaryService;

        public AdminSalaryController(ISalaryService salaryService)
        {
            _salaryService = salaryService;
        }

        /// <summary>
        /// Get all salary records with pagination and filtering.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<SalaryResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<PagedResponse<SalaryResponseDto>>>> GetSalaries(
            [FromQuery] SalaryQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var result = await _salaryService.GetSalariesAsync(queryParameters, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Get a single salary record by ID.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<SalaryResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<SalaryResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<SalaryResponseDto>>> GetSalaryById(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _salaryService.GetSalaryByIdAsync(id, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Get salary history for a specific employee.
        /// </summary>
        [HttpGet("history/{employeeId:int}")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SalaryResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SalaryResponseDto>>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<SalaryResponseDto>>>> GetSalaryHistory(
            int employeeId,
            CancellationToken cancellationToken)
        {
            var result = await _salaryService.GetSalaryHistoryAsync(employeeId, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Create a new salary record for an employee.
        /// Automatically closes any previous active salary.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<SalaryResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<SalaryResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<SalaryResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<SalaryResponseDto>>> CreateSalary(
            [FromBody] SalaryCreateDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _salaryService.CreateSalaryAsync(User, dto, cancellationToken);
            if (result.Succeeded)
            {
                return CreatedAtAction(nameof(GetSalaryById), new { id = result.Data!.SalaryId },
                    ApiResponse<SalaryResponseDto>.Ok(result.Data, result.Message));
            }

            return ToActionResult(result);
        }

        /// <summary>
        /// Update an existing salary record.
        /// Only active salary records can be updated.
        /// </summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<SalaryResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<SalaryResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<SalaryResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<SalaryResponseDto>>> UpdateSalary(
            int id,
            [FromBody] SalaryUpdateDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _salaryService.UpdateSalaryAsync(id, User, dto, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Delete (soft-delete) a salary record.
        /// </summary>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DeleteSalary(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _salaryService.DeleteSalaryAsync(id, cancellationToken);
            if (result.Succeeded)
            {
                return NoContent();
            }

            var response = ApiResponse<bool>.Fail(result.Message);
            return result.Status switch
            {
                ServiceResultStatus.NotFound => NotFound(response),
                ServiceResultStatus.BadRequest => BadRequest(response),
                ServiceResultStatus.Conflict => Conflict(response),
                ServiceResultStatus.Forbidden => StatusCode(StatusCodes.Status403Forbidden, response),
                _ => StatusCode(StatusCodes.Status500InternalServerError, response)
            };
        }

        /// <summary>
        /// Increment salary — creates a new salary version.
        /// The existing salary record is marked as Revised.
        /// </summary>
        [HttpPost("{id:int}/increment")]
        [ProducesResponseType(typeof(ApiResponse<SalaryResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<SalaryResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<SalaryResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<SalaryResponseDto>>> IncrementSalary(
            int id,
            [FromBody] SalaryIncrementDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _salaryService.IncrementSalaryAsync(id, User, dto, cancellationToken);
            if (result.Succeeded)
            {
                return CreatedAtAction(nameof(GetSalaryById), new { id = result.Data!.SalaryId },
                    ApiResponse<SalaryResponseDto>.Ok(result.Data, result.Message));
            }

            return ToActionResult(result);
        }

        /// <summary>
        /// Calculate dynamic monthly salary for a specific employee and month.
        /// Integrates with approved unpaid leave records for deductions.
        /// </summary>
        [HttpGet("calculate/{employeeId:int}")]
        [ProducesResponseType(typeof(ApiResponse<MonthlySalaryCalculationDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<MonthlySalaryCalculationDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<MonthlySalaryCalculationDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<MonthlySalaryCalculationDto>>> CalculateMonthlySalary(
            int employeeId,
            [FromQuery] string month,
            CancellationToken cancellationToken)
        {
            var result = await _salaryService.CalculateMonthlySalaryAsync(employeeId, month, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Get the global salary calculation settings.
        /// </summary>
        [HttpGet("settings")]
        [ProducesResponseType(typeof(ApiResponse<SalaryCalculationSettingsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<SalaryCalculationSettingsDto>>> GetSettings(
            CancellationToken cancellationToken)
        {
            var result = await _salaryService.GetSettingsAsync(cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Update the global salary calculation settings.
        /// </summary>
        [HttpPut("settings")]
        [ProducesResponseType(typeof(ApiResponse<SalaryCalculationSettingsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<SalaryCalculationSettingsDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<SalaryCalculationSettingsDto>>> UpdateSettings(
            [FromBody] SalaryCalculationSettingsDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _salaryService.UpdateSettingsAsync(User, dto, cancellationToken);
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
