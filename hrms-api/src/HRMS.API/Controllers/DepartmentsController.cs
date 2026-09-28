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
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _departmentService;

    public DepartmentsController(IDepartmentService departmentService)
    {
        _departmentService = departmentService;
    }

    [HttpGet]
    [HasPermission(Permissions.DepartmentView)]
    public async Task<ActionResult<ApiResponse<List<DepartmentDto>>>> GetAll()
    {
        var result = await _departmentService.GetAllDepartmentsAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [HasPermission(Permissions.DepartmentView)]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> GetById(int id)
    {
        var result = await _departmentService.GetDepartmentByIdAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [HasPermission(Permissions.DepartmentCreate)]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> Create([FromBody] CreateDepartmentRequest request)
    {
        var result = await _departmentService.CreateDepartmentAsync(request);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
    }

    [HttpPut("{id:int}")]
    [HasPermission(Permissions.DepartmentUpdate)]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> Update(int id, [FromBody] UpdateDepartmentRequest request)
    {
        var result = await _departmentService.UpdateDepartmentAsync(id, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.DepartmentDelete)]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        var result = await _departmentService.DeleteDepartmentAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("{id:int}/employees")]
    [HasPermission(Permissions.DepartmentView)]
    public async Task<ActionResult<ApiResponse<List<EmployeeDto>>>> GetEmployees(int id)
    {
        var result = await _departmentService.GetDepartmentEmployeesAsync(id);
        return Ok(result);
    }

    [HttpGet("org-chart")]
    [HasPermission(Permissions.DepartmentView)]
    public async Task<ActionResult<ApiResponse<List<OrgChartNodeDto>>>> GetOrgChart()
    {
        var result = await _departmentService.GetOrgChartAsync();
        return Ok(result);
    }
}
