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
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeeController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet]
        [Authorize(Policy = AppPolicies.EmployeeRead)]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<EmployeeResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<PagedResponse<EmployeeResponseDto>>>> GetEmployees(
            [FromQuery] EmployeeQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            if (User.IsInRole(AppRoles.Employee) && !User.IsInRole(AppRoles.Admin) && !User.IsInRole(AppRoles.HR) && !User.IsInRole(AppRoles.Manager))
            {
                var employeeId = GetCurrentEmployeeId();
                if (!employeeId.HasValue)
                {
                    return Forbid();
                }

                queryParameters = new EmployeeQueryParameters
                {
                    Page = 1,
                    PageSize = 1,
                    Search = null,
                    DepartmentId = null,
                    RoleId = null,
                    Status = null
                };

                var ownEmployee = await _employeeService.GetEmployeeByIdAsync(employeeId.Value, cancellationToken);
                if (!ownEmployee.Succeeded)
                {
                    return Forbid();
                }

                var ownResponse = new PagedResponse<EmployeeResponseDto>
                {
                    Items = new[] { ownEmployee.Data! },
                    Page = 1,
                    PageSize = 1,
                    TotalCount = 1,
                    TotalPages = 1
                };

                return Ok(ApiResponse<PagedResponse<EmployeeResponseDto>>.Ok(ownResponse, "Employee retrieved successfully."));
            }

            var result = await _employeeService.GetEmployeesAsync(queryParameters, cancellationToken);
            return Ok(ApiResponse<PagedResponse<EmployeeResponseDto>>.Ok(result.Data!, result.Message));
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = AppPolicies.EmployeeRead)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<EmployeeResponseDto>>> GetEmployeeById(int id, CancellationToken cancellationToken)
        {
            if (!CanReadEmployee(id))
            {
                return Forbid();
            }

            var result = await _employeeService.GetEmployeeByIdAsync(id, cancellationToken);
            return ToActionResult(result);
        }

        [HttpPost]
        [Authorize(Policy = AppPolicies.EmployeeCreate)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<EmployeeResponseDto>>> CreateEmployee(
            [FromBody] EmployeeCreateDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _employeeService.CreateEmployeeAsync(dto, cancellationToken);
            if (result.Succeeded)
            {
                return CreatedAtAction(nameof(GetEmployeeById), new { id = result.Data!.EmployeeId }, ApiResponse<EmployeeResponseDto>.Ok(result.Data, result.Message));
            }

            return ToActionResult(result);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = AppPolicies.EmployeeUpdate)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<EmployeeResponseDto>>> UpdateEmployee(
            int id,
            [FromBody] EmployeeUpdateDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _employeeService.UpdateEmployeeAsync(id, dto, cancellationToken);
            return ToActionResult(result);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = AppPolicies.EmployeeDelete)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> DeleteEmployee(int id, CancellationToken cancellationToken)
        {
            var result = await _employeeService.DeleteEmployeeAsync(id, cancellationToken);
            if (result.Succeeded)
            {
                return NoContent();
            }

            var response = ApiResponse<bool>.Fail(result.Message);
            return result.Status switch
            {
                ServiceResultStatus.NotFound => NotFound(response),
                ServiceResultStatus.Conflict => Conflict(response),
                ServiceResultStatus.BadRequest => BadRequest(response),
                _ => StatusCode(StatusCodes.Status500InternalServerError, response)
            };
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
                _ => StatusCode(StatusCodes.Status500InternalServerError, response)
            };
        }

        private bool CanReadEmployee(int employeeId)
        {
            if (User.IsInRole(AppRoles.Admin) || User.IsInRole(AppRoles.HR) || User.IsInRole(AppRoles.Manager))
            {
                return true;
            }

            return User.IsInRole(AppRoles.Employee) && GetCurrentEmployeeId() == employeeId;
        }

        private int? GetCurrentEmployeeId()
        {
            var employeeIdClaim = User.FindFirstValue("employeeId");
            return int.TryParse(employeeIdClaim, out var employeeId) ? employeeId : null;
        }
    }
}
