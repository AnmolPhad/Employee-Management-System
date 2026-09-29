using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Attendance;
using EmployeeManagementSystem.API.Services;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/attendance")]
    [Authorize]
    [Produces("application/json")]
    [Tags("Attendance")]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;

        public AttendanceController(IAttendanceService attendanceService)
        {
            _attendanceService = attendanceService;
        }

        /// <summary>
        /// Records a check-in punch for the currently authenticated employee.
        /// </summary>
        [HttpPost("check-in")]
        [ProducesResponseType(typeof(ApiResponse<AttendanceResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<AttendanceResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<AttendanceResponseDto>>> CheckIn(
            [FromBody] AttendanceCheckInDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _attendanceService.CheckInAsync(User, dto, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Records a check-out punch and calculates working hours for the currently authenticated employee.
        /// </summary>
        [HttpPost("check-out")]
        [ProducesResponseType(typeof(ApiResponse<AttendanceResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<AttendanceResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<AttendanceResponseDto>>> CheckOut(
            [FromBody] AttendanceCheckOutDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _attendanceService.CheckOutAsync(User, dto, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves the currently authenticated employee's attendance records.
        /// </summary>
        [HttpGet("me")]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<AttendanceResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<PagedResponse<AttendanceResponseDto>>>> GetMyAttendance(
            [FromQuery] AttendanceQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var result = await _attendanceService.GetMyAttendanceAsync(User, queryParameters, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves a specific attendance record for the currently authenticated employee.
        /// </summary>
        [HttpGet("me/{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<AttendanceResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<AttendanceResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<AttendanceResponseDto>>> GetMyAttendanceById(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _attendanceService.GetMyAttendanceByIdAsync(User, id, cancellationToken);
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
