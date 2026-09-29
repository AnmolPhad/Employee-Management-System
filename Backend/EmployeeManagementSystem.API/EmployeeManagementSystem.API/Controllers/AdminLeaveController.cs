using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Leave;
using EmployeeManagementSystem.API.Services;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/admin/leaves")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.HR},{AppRoles.Manager},ADMIN,HR,MANAGER")]
    [Produces("application/json")]
    [Tags("Admin")]
    public class AdminLeaveController : ControllerBase
    {
        private readonly ILeaveService _leaveService;

        public AdminLeaveController(ILeaveService leaveService)
        {
            _leaveService = leaveService;
        }

        /// <summary>
        /// Retrieves leave requests based on user role (Admin &amp; HR view all; Managers view subordinates).
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<LeaveResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<PagedResponse<LeaveResponseDto>>>> GetLeaves(
            [FromQuery] LeaveQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var result = await _leaveService.GetLeavesAsync(User, queryParameters, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves a single leave request by ID for approver inspection.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<LeaveResponseDto>>> GetLeaveById(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _leaveService.GetLeaveByIdAsync(User, id, cancellationToken);
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
