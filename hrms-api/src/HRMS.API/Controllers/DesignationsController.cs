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
public class DesignationsController : ControllerBase
{
    private readonly IDesignationService _designationService;

    public DesignationsController(IDesignationService designationService)
    {
        _designationService = designationService;
    }

    [HttpGet]
    [HasPermission(Permissions.DesignationView)]
    public async Task<ActionResult<ApiResponse<List<DesignationDto>>>> GetAll()
    {
        var result = await _designationService.GetAllDesignationsAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [HasPermission(Permissions.DesignationView)]
    public async Task<ActionResult<ApiResponse<DesignationDto>>> GetById(int id)
    {
        var result = await _designationService.GetDesignationByIdAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [HasPermission(Permissions.DesignationCreate)]
    public async Task<ActionResult<ApiResponse<DesignationDto>>> Create([FromBody] CreateDesignationRequest request)
    {
        var result = await _designationService.CreateDesignationAsync(request);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
    }

    [HttpPut("{id:int}")]
    [HasPermission(Permissions.DesignationUpdate)]
    public async Task<ActionResult<ApiResponse<DesignationDto>>> Update(int id, [FromBody] UpdateDesignationRequest request)
    {
        var result = await _designationService.UpdateDesignationAsync(id, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.DesignationDelete)]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        var result = await _designationService.DeleteDesignationAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }
}
