using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Attendance;
using EmployeeManagementSystem.API.Services;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/admin/attendance")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.HR},{AppRoles.Manager},ADMIN,HR,MANAGER")]
    [Produces("application/json")]
    [Tags("Admin")]
    public class AdminAttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;

        public AdminAttendanceController(IAttendanceService attendanceService)
        {
            _attendanceService = attendanceService;
        }

        /// <summary>
        /// Retrieves attendance records (Admin &amp; HR view all; Managers view subordinates).
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<AttendanceResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<PagedResponse<AttendanceResponseDto>>>> GetAttendance(
            [FromQuery] AttendanceQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var result = await _attendanceService.GetAttendanceAsync(User, queryParameters, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves a specific attendance record by ID for authorized management users.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<AttendanceResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<AttendanceResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<AttendanceResponseDto>>> GetAttendanceById(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _attendanceService.GetAttendanceByIdAsync(User, id, cancellationToken);
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
