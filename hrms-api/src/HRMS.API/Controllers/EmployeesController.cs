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
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly ICurrentUserService _currentUser;

    public EmployeesController(IEmployeeService employeeService, ICurrentUserService currentUser)
    {
        _employeeService = employeeService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [HasPermission(Permissions.EmployeeViewAll)]
    public async Task<ActionResult<ApiResponse<PagedResult<EmployeeDto>>>> GetAll([FromQuery] EmployeeFilterRequest filter)
    {
        var result = await _employeeService.GetEmployeesAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [HasPermission(Permissions.EmployeeView)]
    public async Task<ActionResult<ApiResponse<EmployeeDto>>> GetById(int id)
    {
        var result = await _employeeService.GetEmployeeByIdAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<EmployeeDto>>> GetMyProfile()
    {
        if (!_currentUser.UserId.HasValue) return Unauthorized();
        var result = await _employeeService.GetMyProfileAsync(_currentUser.UserId.Value);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPut("me")]
    public async Task<ActionResult<ApiResponse<EmployeeDto>>> UpdateMyProfile([FromBody] UpdateSelfProfileRequest request)
    {
        if (!_currentUser.UserId.HasValue) return Unauthorized();
        var result = await _employeeService.UpdateSelfProfileAsync(_currentUser.UserId.Value, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost]
    [HasPermission(Permissions.EmployeeCreate)]
    public async Task<ActionResult<ApiResponse<EmployeeDto>>> Create([FromBody] CreateEmployeeRequest request)
    {
        var result = await _employeeService.CreateEmployeeAsync(request);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
    }

    [HttpPut("{id:int}")]
    [HasPermission(Permissions.EmployeeUpdate)]
    public async Task<ActionResult<ApiResponse<EmployeeDto>>> Update(int id, [FromBody] UpdateEmployeeRequest request)
    {
        var result = await _employeeService.UpdateEmployeeAsync(id, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.EmployeeDelete)]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        var result = await _employeeService.DeleteEmployeeAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("{id:int}/reports")]
    [HasPermission(Permissions.EmployeeView)]
    public async Task<ActionResult<ApiResponse<List<EmployeeDto>>>> GetDirectReports(int id)
    {
        var result = await _employeeService.GetDirectReportsAsync(id);
        return Ok(result);
    }

    [HttpGet("search")]
    [HasPermission(Permissions.EmployeeSearch)]
    public async Task<ActionResult<ApiResponse<List<EmployeeDto>>>> Search([FromQuery] string q)
    {
        var result = await _employeeService.SearchEmployeesAsync(q ?? "");
        return Ok(result);
    }
}
