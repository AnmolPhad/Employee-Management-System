using System.Security.Claims;
using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Employee;
using EmployeeManagementSystem.API.Services;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/employees")]
    [Authorize]
    [Produces("application/json")]
    [Tags("Employee")]
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeeController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        /// <summary>
        /// Retrieves the currently authenticated employee's profile information.
        /// </summary>
        [HttpGet("me")]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<EmployeeResponseDto>>> GetMyProfile(CancellationToken cancellationToken)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(ApiResponse<EmployeeResponseDto>.Fail("Authenticated user identifier was not found."));
            }

            var result = await _employeeService.GetMyProfileAsync(userId, cancellationToken);
            if (result.Succeeded)
            {
                return Ok(ApiResponse<EmployeeResponseDto>.Ok(result.Data!, result.Message));
            }

            return NotFound(ApiResponse<EmployeeResponseDto>.Fail(result.Message));
        }

        /// <summary>
        /// Retrieves an employee profile by ID. Admin/HR can view any profile; Employees can view their own profile.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<EmployeeResponseDto>>> GetEmployeeById(int id, CancellationToken cancellationToken)
        {
            var isAdminOrHr = User.IsInRole(AppRoles.Admin) || User.IsInRole("ADMIN") || User.IsInRole(AppRoles.HR) || User.IsInRole("HR");
            if (!isAdminOrHr)
            {
                var empClaim = User.FindFirst("employeeId")?.Value;
                if (!int.TryParse(empClaim, out var empId) || empId != id)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<EmployeeResponseDto>.Fail("You are not authorized to view this employee profile."));
                }
            }

            var result = await _employeeService.GetEmployeeByIdAsync(id, User, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Updates an employee's personal contact and biographical details. Admin/HR or the employee themselves.
        /// </summary>
        [HttpPut("{id:int}/personal")]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<EmployeeResponseDto>>> UpdatePersonalDetails(
            int id,
            [FromBody] EmployeePersonalUpdateDto dto,
            CancellationToken cancellationToken)
        {
            var isAdminOrHr = User.IsInRole(AppRoles.Admin) || User.IsInRole("ADMIN") || User.IsInRole(AppRoles.HR) || User.IsInRole("HR");
            if (!isAdminOrHr)
            {
                var empClaim = User.FindFirst("employeeId")?.Value;
                if (!int.TryParse(empClaim, out var empId) || empId != id)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<EmployeeResponseDto>.Fail("You are not authorized to update this employee profile."));
                }
            }

            var result = await _employeeService.UpdatePersonalDetailsAsync(id, dto, User, cancellationToken);
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
                ServiceResultStatus.Unauthorized => StatusCode(StatusCodes.Status401Unauthorized, response),
                _ => StatusCode(StatusCodes.Status500InternalServerError, response)
            };
        }
    }
}
