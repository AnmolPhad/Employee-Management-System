using HRMS.API.Authorization;
using HRMS.Application.Common;
using HRMS.Application.DTOs;
using HRMS.Application.Interfaces;
using HRMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HRMS.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class PayrollController : ControllerBase
{
    private readonly IPayrollService _payrollService;
    private readonly ICurrentUserService _currentUser;

    public PayrollController(IPayrollService payrollService, ICurrentUserService currentUser)
    {
        _payrollService = payrollService;
        _currentUser = currentUser;
    }

    [HttpGet("salary-structure/{employeeId:int}")]
    [HasPermission(Permissions.SalaryView)]
    public async Task<ActionResult<ApiResponse<SalaryStructureDto>>> GetSalaryStructure(int employeeId)
    {
        var result = await _payrollService.GetSalaryStructureAsync(employeeId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("salary-structure")]
    [HasPermission(Permissions.SalaryManage)]
    public async Task<ActionResult<ApiResponse<SalaryStructureDto>>> UpsertSalaryStructure([FromBody] CreateSalaryStructureRequest request)
    {
        var result = await _payrollService.UpsertSalaryStructureAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("generate")]
    [HasPermission(Permissions.PayrollGenerate)]
    [EnableRateLimiting("PayrollGeneratePolicy")]
    public async Task<ActionResult<ApiResponse<List<PayslipDto>>>> GeneratePayroll([FromBody] GeneratePayrollRequest request)
    {
        var result = await _payrollService.GeneratePayrollAsync(request);
        return Ok(result);
    }

    [HttpGet("my-payslips")]
    [HasPermission(Permissions.PayrollViewOwn)]
    public async Task<ActionResult<ApiResponse<List<PayslipDto>>>> GetMyPayslips()
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<List<PayslipDto>>.Fail("No employee linked to user."));

        var result = await _payrollService.GetMyPayslipsAsync(_currentUser.EmployeeId.Value);
        return Ok(result);
    }

    [HttpGet("payslips")]
    [HasPermission(Permissions.PayrollView)]
    public async Task<ActionResult<ApiResponse<List<PayslipDto>>>> GetPayslips(
        [FromQuery] int? month,
        [FromQuery] int? year,
        [FromQuery] int? departmentId)
    {
        var m = month ?? DateTime.UtcNow.Month;
        var y = year ?? DateTime.UtcNow.Year;

        var result = await _payrollService.GetPayslipsAsync(m, y, departmentId);
        return Ok(result);
    }

    [HttpGet("payslips/{id:int}")]
    public async Task<ActionResult<ApiResponse<PayslipDto>>> GetPayslipById(int id)
    {
        var result = await _payrollService.GetPayslipByIdAsync(id);
        if (!result.Success) return NotFound(result);

        // Allow if user has PayrollView or if it's their own payslip
        if (!_currentUser.HasPermission(Permissions.PayrollView) &&
            result.Data?.EmployeeId != _currentUser.EmployeeId)
        {
            return Forbid();
        }

        return Ok(result);
    }

    [HttpPatch("payslips/{id:int}/approve")]
    [HasPermission(Permissions.PayrollApprove)]
    public async Task<ActionResult<ApiResponse<PayslipDto>>> ApprovePayslip(int id)
    {
        var approverId = _currentUser.UserId ?? 1;
        var result = await _payrollService.ApprovePayslipAsync(id, approverId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
