using HRMS.API.Authorization;
using HRMS.Application.Common;
using HRMS.Application.DTOs;
using HRMS.Application.Interfaces;
using HRMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRMS.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;
    private readonly ICurrentUserService _currentUser;

    public AttendanceController(IAttendanceService attendanceService, ICurrentUserService currentUser)
    {
        _attendanceService = attendanceService;
        _currentUser = currentUser;
    }

    [HttpPost("check-in")]
    [HasPermission(Permissions.AttendanceCheckIn)]
    public async Task<ActionResult<ApiResponse<AttendanceDto>>> CheckIn()
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<AttendanceDto>.Fail("No employee linked to user."));

        var result = await _attendanceService.CheckInAsync(_currentUser.EmployeeId.Value);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("check-out")]
    [HasPermission(Permissions.AttendanceCheckIn)]
    public async Task<ActionResult<ApiResponse<AttendanceDto>>> CheckOut()
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<AttendanceDto>.Fail("No employee linked to user."));

        var result = await _attendanceService.CheckOutAsync(_currentUser.EmployeeId.Value);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("my-attendance")]
    [HasPermission(Permissions.AttendanceViewOwn)]
    public async Task<ActionResult<ApiResponse<List<AttendanceDto>>>> GetMyAttendance(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<List<AttendanceDto>>.Fail("No employee linked to user."));

        var from = fromDate ?? DateTime.UtcNow.AddDays(-30);
        var to = toDate ?? DateTime.UtcNow;

        var result = await _attendanceService.GetMyAttendanceAsync(_currentUser.EmployeeId.Value, from, to);
        return Ok(result);
    }

    [HttpGet("employee/{employeeId:int}")]
    [HasPermission(Permissions.AttendanceViewAll)]
    public async Task<ActionResult<ApiResponse<List<AttendanceDto>>>> GetEmployeeAttendance(
        int employeeId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var from = fromDate ?? DateTime.UtcNow.AddDays(-30);
        var to = toDate ?? DateTime.UtcNow;

        var result = await _attendanceService.GetEmployeeAttendanceAsync(employeeId, from, to);
        return Ok(result);
    }

    [HttpGet("report")]
    [HasPermission(Permissions.AttendanceReport)]
    public async Task<ActionResult<ApiResponse<List<AttendanceReportDto>>>> GetReport(
        [FromQuery] int? month,
        [FromQuery] int? year,
        [FromQuery] int? departmentId)
    {
        var m = month ?? DateTime.UtcNow.Month;
        var y = year ?? DateTime.UtcNow.Year;

        var result = await _attendanceService.GetAttendanceReportAsync(m, y, departmentId);
        return Ok(result);
    }
}
