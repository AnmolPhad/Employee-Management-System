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
public class LeavesController : ControllerBase
{
    private readonly ILeaveService _leaveService;
    private readonly ICurrentUserService _currentUser;

    public LeavesController(ILeaveService leaveService, ICurrentUserService currentUser)
    {
        _leaveService = leaveService;
        _currentUser = currentUser;
    }

    [HttpGet("types")]
    public async Task<ActionResult<ApiResponse<List<LeaveTypeDto>>>> GetLeaveTypes()
    {
        var result = await _leaveService.GetLeaveTypesAsync();
        return Ok(result);
    }

    [HttpPost("types")]
    [HasPermission(Permissions.LeaveManageTypes)]
    public async Task<ActionResult<ApiResponse<LeaveTypeDto>>> CreateLeaveType([FromBody] CreateLeaveTypeRequest request)
    {
        var result = await _leaveService.CreateLeaveTypeAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost]
    [HasPermission(Permissions.LeaveApply)]
    public async Task<ActionResult<ApiResponse<LeaveRequestDto>>> Apply([FromBody] ApplyLeaveRequest request)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<LeaveRequestDto>.Fail("No employee linked to current user."));

        var result = await _leaveService.ApplyLeaveAsync(_currentUser.EmployeeId.Value, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("my-leaves")]
    [HasPermission(Permissions.LeaveViewOwn)]
    public async Task<ActionResult<ApiResponse<List<LeaveRequestDto>>>> GetMyLeaves()
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<List<LeaveRequestDto>>.Fail("No employee linked to current user."));

        var result = await _leaveService.GetMyLeavesAsync(_currentUser.EmployeeId.Value);
        return Ok(result);
    }

    [HttpGet]
    [HasPermission(Permissions.LeaveViewAll)]
    public async Task<ActionResult<ApiResponse<List<LeaveRequestDto>>>> GetAll([FromQuery] int? departmentId, [FromQuery] int? status)
    {
        var result = await _leaveService.GetAllLeavesAsync(departmentId, status);
        return Ok(result);
    }

    [HttpGet("pending-approvals")]
    [HasPermission(Permissions.LeaveApprove)]
    public async Task<ActionResult<ApiResponse<List<LeaveRequestDto>>>> GetPendingApprovals()
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<List<LeaveRequestDto>>.Fail("No employee linked to current user."));

        var result = await _leaveService.GetPendingApprovalsAsync(_currentUser.EmployeeId.Value);
        return Ok(result);
    }

    [HttpPatch("{id:int}/approve")]
    [HasPermission(Permissions.LeaveApprove)]
    public async Task<ActionResult<ApiResponse<LeaveRequestDto>>> Approve(int id, [FromBody] ApproveRejectLeaveRequest request)
    {
        var approverId = _currentUser.EmployeeId ?? 1;
        var result = await _leaveService.ApproveLeaveAsync(id, approverId, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPatch("{id:int}/reject")]
    [HasPermission(Permissions.LeaveReject)]
    public async Task<ActionResult<ApiResponse<LeaveRequestDto>>> Reject(int id, [FromBody] ApproveRejectLeaveRequest request)
    {
        var approverId = _currentUser.EmployeeId ?? 1;
        var result = await _leaveService.RejectLeaveAsync(id, approverId, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id:int}/cancel")]
    [HasPermission(Permissions.LeaveApply)]
    public async Task<ActionResult<ApiResponse>> Cancel(int id)
    {
        if (!_currentUser.EmployeeId.HasValue) return Unauthorized();
        var result = await _leaveService.CancelLeaveAsync(id, _currentUser.EmployeeId.Value);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("balances/my-balances")]
    [HasPermission(Permissions.LeaveViewOwn)]
    public async Task<ActionResult<ApiResponse<List<LeaveBalanceDto>>>> GetMyBalances([FromQuery] int? year)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<List<LeaveBalanceDto>>.Fail("No employee profile found."));

        var y = year ?? DateTime.UtcNow.Year;
        var result = await _leaveService.GetLeaveBalancesAsync(_currentUser.EmployeeId.Value, y);
        return Ok(result);
    }

    [HttpGet("balances/{employeeId:int}")]
    [HasPermission(Permissions.LeaveManageBalance)]
    public async Task<ActionResult<ApiResponse<List<LeaveBalanceDto>>>> GetEmployeeBalances(int employeeId, [FromQuery] int? year)
    {
        var y = year ?? DateTime.UtcNow.Year;
        var result = await _leaveService.GetLeaveBalancesAsync(employeeId, y);
        return Ok(result);
    }

    [HttpPut("balances/{employeeId:int}/leave-type/{leaveTypeId:int}")]
    [HasPermission(Permissions.LeaveManageBalance)]
    public async Task<ActionResult<ApiResponse>> AdjustBalance(int employeeId, int leaveTypeId, [FromQuery] int year, [FromBody] AdjustLeaveBalanceRequest request)
    {
        var result = await _leaveService.AdjustLeaveBalanceAsync(employeeId, leaveTypeId, year, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
