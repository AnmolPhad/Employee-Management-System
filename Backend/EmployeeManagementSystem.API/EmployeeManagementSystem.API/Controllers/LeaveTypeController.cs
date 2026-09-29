using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.LeaveType;
using EmployeeManagementSystem.API.Services;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/admin/leave-types")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.HR},ADMIN,HR")]
    [Produces("application/json")]
    [Tags("Admin")]
    public class LeaveTypeController : ControllerBase
    {
        private readonly ILeaveTypeService _leaveTypeService;

        public LeaveTypeController(ILeaveTypeService leaveTypeService)
        {
            _leaveTypeService = leaveTypeService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<LeaveTypeResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<PagedResponse<LeaveTypeResponseDto>>>> GetLeaveTypes(
            [FromQuery] LeaveTypeQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var result = await _leaveTypeService.GetLeaveTypesAsync(queryParameters, cancellationToken);
            return Ok(ApiResponse<PagedResponse<LeaveTypeResponseDto>>.Ok(result.Data!, result.Message));
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<LeaveTypeResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<LeaveTypeResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<LeaveTypeResponseDto>>> GetLeaveTypeById(int id, CancellationToken cancellationToken)
        {
            var result = await _leaveTypeService.GetLeaveTypeByIdAsync(id, cancellationToken);
            return ToActionResult(result);
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<LeaveTypeResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<LeaveTypeResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<LeaveTypeResponseDto>), StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<LeaveTypeResponseDto>>> CreateLeaveType(
            [FromBody] LeaveTypeCreateDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _leaveTypeService.CreateLeaveTypeAsync(dto, cancellationToken);
            if (result.Succeeded)
            {
                return CreatedAtAction(nameof(GetLeaveTypeById), new { id = result.Data!.LeaveTypeId }, ApiResponse<LeaveTypeResponseDto>.Ok(result.Data, result.Message));
            }

            return ToActionResult(result);
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<LeaveTypeResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<LeaveTypeResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<LeaveTypeResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<LeaveTypeResponseDto>), StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<LeaveTypeResponseDto>>> UpdateLeaveType(
            int id,
            [FromBody] LeaveTypeUpdateDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _leaveTypeService.UpdateLeaveTypeAsync(id, dto, cancellationToken);
            return ToActionResult(result);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DeleteLeaveType(int id, CancellationToken cancellationToken)
        {
            var result = await _leaveTypeService.DeleteLeaveTypeAsync(id, cancellationToken);
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
