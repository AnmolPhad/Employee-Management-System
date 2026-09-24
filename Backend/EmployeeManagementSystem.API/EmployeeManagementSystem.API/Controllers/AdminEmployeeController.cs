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
    [Route("api/admin/employees")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.HR},ADMIN,HR")]
    [Produces("application/json")]
    [Tags("Admin")]
    public class AdminEmployeeController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public AdminEmployeeController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<EmployeeResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<PagedResponse<EmployeeResponseDto>>>> GetEmployees(
            [FromQuery] EmployeeQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var result = await _employeeService.GetEmployeesAsync(queryParameters, cancellationToken);
            return Ok(ApiResponse<PagedResponse<EmployeeResponseDto>>.Ok(result.Data!, result.Message));
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<EmployeeResponseDto>>> GetEmployeeById(int id, CancellationToken cancellationToken)
        {
            var result = await _employeeService.GetEmployeeByIdAsync(id, cancellationToken);
            return ToActionResult(result);
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
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
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<EmployeeResponseDto>), StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<EmployeeResponseDto>>> UpdateEmployee(
            int id,
            [FromBody] EmployeeUpdateDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _employeeService.UpdateEmployeeAsync(id, dto, cancellationToken);
            return ToActionResult(result);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
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
    }
}
