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
    [Route("api/leaves")]
    [Authorize]
    [Produces("application/json")]
    [Tags("Leave")]
    public class LeaveController : ControllerBase
    {
        private readonly ILeaveService _leaveService;

        public LeaveController(ILeaveService leaveService)
        {
            _leaveService = leaveService;
        }

        /// <summary>
        /// Applies for leave as the currently authenticated employee.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<LeaveResponseDto>>> ApplyLeave(
            [FromBody] LeaveCreateDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _leaveService.ApplyLeaveAsync(User, dto, cancellationToken);
            if (result.Succeeded)
            {
                return CreatedAtAction(nameof(GetMyLeaveById), new { id = result.Data!.LeaveId }, ApiResponse<LeaveResponseDto>.Ok(result.Data, result.Message));
            }

            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves the current authenticated employee's leave history.
        /// </summary>
        [HttpGet("me")]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<LeaveResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<PagedResponse<LeaveResponseDto>>>> GetMyLeaves(
            [FromQuery] LeaveQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var result = await _leaveService.GetMyLeavesAsync(User, queryParameters, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves a specific leave application submitted by the current authenticated employee.
        /// </summary>
        [HttpGet("me/{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<LeaveResponseDto>>> GetMyLeaveById(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _leaveService.GetMyLeaveByIdAsync(User, id, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves leave balances across all active leave types for the current authenticated employee.
        /// </summary>
        [HttpGet("me/balance")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<LeaveBalanceResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<LeaveBalanceResponseDto>>>> GetMyLeaveBalance(
            [FromQuery] int? year,
            CancellationToken cancellationToken)
        {
            var result = await _leaveService.GetMyLeaveBalanceAsync(User, year, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves active leave types available for employee leave applications.
        /// </summary>
        [HttpGet("types")]
        [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ActiveLeaveTypeResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<ActiveLeaveTypeResponseDto>>>> GetActiveLeaveTypes(
            CancellationToken cancellationToken)
        {
            var result = await _leaveService.GetActiveLeaveTypesAsync(cancellationToken);
            return Ok(ApiResponse<IReadOnlyList<ActiveLeaveTypeResponseDto>>.Ok(result.Data!, result.Message));
        }

        /// <summary>
        /// Retrieves pending leave requests awaiting approval by the current user.
        /// </summary>
        [HttpGet("pending-approvals")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.HR},{AppRoles.Manager},ADMIN,HR,MANAGER")]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<LeaveResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<PagedResponse<LeaveResponseDto>>>> GetPendingApprovals(
            [FromQuery] LeaveQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            queryParameters.Status = Models.Enums.LeaveStatus.Pending;
            var result = await _leaveService.GetLeavesAsync(User, queryParameters, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves a specific leave application by ID. Accessible by applicant or authorized approvers.
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
            if (!result.Succeeded && (result.Status == ServiceResultStatus.Forbidden || result.Status == ServiceResultStatus.NotFound))
            {
                var myResult = await _leaveService.GetMyLeaveByIdAsync(User, id, cancellationToken);
                if (myResult.Succeeded)
                {
                    return ToActionResult(myResult);
                }
            }
            return ToActionResult(result);
        }

        /// <summary>
        /// Approves a pending leave request based on the approval hierarchy.
        /// </summary>
        [HttpPut("{id:int}/approve")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.HR},{AppRoles.Manager},ADMIN,HR,MANAGER")]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<LeaveResponseDto>>> ApproveLeave(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _leaveService.ApproveLeaveAsync(User, id, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Rejects a pending leave request with a mandatory rejection reason based on the approval hierarchy.
        /// </summary>
        [HttpPut("{id:int}/reject")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.HR},{AppRoles.Manager},ADMIN,HR,MANAGER")]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<LeaveResponseDto>), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<LeaveResponseDto>>> RejectLeave(
            int id,
            [FromBody] LeaveRejectionDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _leaveService.RejectLeaveAsync(User, id, dto, cancellationToken);
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
