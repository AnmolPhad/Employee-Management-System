using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Department;
using EmployeeManagementSystem.API.Services;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/admin/departments")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.HR},ADMIN,HR")]
    [Produces("application/json")]
    [Tags("Admin")]
    public class DepartmentController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<DepartmentResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<PagedResponse<DepartmentResponseDto>>>> GetDepartments(
            [FromQuery] DepartmentQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var result = await _departmentService.GetDepartmentsAsync(queryParameters, cancellationToken);
            return Ok(ApiResponse<PagedResponse<DepartmentResponseDto>>.Ok(result.Data!, result.Message));
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<DepartmentResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<DepartmentResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<DepartmentResponseDto>>> GetDepartmentById(int id, CancellationToken cancellationToken)
        {
            var result = await _departmentService.GetDepartmentByIdAsync(id, cancellationToken);
            return ToActionResult(result);
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<DepartmentResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<DepartmentResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<DepartmentResponseDto>), StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<DepartmentResponseDto>>> CreateDepartment(
            [FromBody] DepartmentCreateDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _departmentService.CreateDepartmentAsync(dto, cancellationToken);
            if (result.Succeeded)
            {
                return CreatedAtAction(nameof(GetDepartmentById), new { id = result.Data!.DepartmentId }, ApiResponse<DepartmentResponseDto>.Ok(result.Data, result.Message));
            }

            return ToActionResult(result);
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<DepartmentResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<DepartmentResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<DepartmentResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<DepartmentResponseDto>), StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<DepartmentResponseDto>>> UpdateDepartment(
            int id,
            [FromBody] DepartmentUpdateDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _departmentService.UpdateDepartmentAsync(id, dto, cancellationToken);
            return ToActionResult(result);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DeleteDepartment(int id, CancellationToken cancellationToken)
        {
            var result = await _departmentService.DeleteDepartmentAsync(id, cancellationToken);
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
