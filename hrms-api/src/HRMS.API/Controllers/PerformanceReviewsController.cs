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
public class PerformanceReviewsController : ControllerBase
{
    private readonly IPerformanceService _performanceService;
    private readonly ICurrentUserService _currentUser;

    public PerformanceReviewsController(IPerformanceService performanceService, ICurrentUserService currentUser)
    {
        _performanceService = performanceService;
        _currentUser = currentUser;
    }

    [HttpPost]
    [HasPermission(Permissions.ReviewCreate)]
    public async Task<ActionResult<ApiResponse<PerformanceReviewDto>>> CreateReview([FromBody] CreateReviewRequest request)
    {
        var result = await _performanceService.CreateReviewAsync(request);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<PerformanceReviewDto>>> GetById(int id)
    {
        var result = await _performanceService.GetReviewByIdAsync(id);
        if (!result.Success) return NotFound(result);

        // Security check: Only allow employee themselves, reviewer, or review viewers
        var isOwn = result.Data?.EmployeeId == _currentUser.EmployeeId;
        var isReviewer = result.Data?.ReviewerId == _currentUser.EmployeeId;
        var canViewAll = _currentUser.HasPermission(Permissions.ReviewView);

        if (!isOwn && !isReviewer && !canViewAll) return Forbid();

        return Ok(result);
    }

    [HttpGet("my-reviews")]
    [HasPermission(Permissions.ReviewViewOwn)]
    public async Task<ActionResult<ApiResponse<List<PerformanceReviewDto>>>> GetMyReviews()
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<List<PerformanceReviewDto>>.Fail("No employee linked to user."));

        var result = await _performanceService.GetMyReviewsAsync(_currentUser.EmployeeId.Value);
        return Ok(result);
    }

    [HttpGet("pending-for-manager")]
    [HasPermission(Permissions.ReviewManagerRate)]
    public async Task<ActionResult<ApiResponse<List<PerformanceReviewDto>>>> GetPendingManagerReviews()
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<List<PerformanceReviewDto>>.Fail("No employee linked to user."));

        var result = await _performanceService.GetPendingReviewsForManagerAsync(_currentUser.EmployeeId.Value);
        return Ok(result);
    }

    [HttpGet]
    [HasPermission(Permissions.ReviewView)]
    public async Task<ActionResult<ApiResponse<List<PerformanceReviewDto>>>> GetAll(
        [FromQuery] int? year,
        [FromQuery] string? status)
    {
        var result = await _performanceService.GetAllReviewsAsync(year, status);
        return Ok(result);
    }

    [HttpPatch("{id:int}/self-assessment")]
    [HasPermission(Permissions.ReviewSelfAssess)]
    public async Task<ActionResult<ApiResponse<PerformanceReviewDto>>> SubmitSelfAssessment(
        int id,
        [FromBody] SubmitSelfAssessmentRequest request)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<PerformanceReviewDto>.Fail("No employee linked to user."));

        var result = await _performanceService.SubmitSelfAssessmentAsync(id, _currentUser.EmployeeId.Value, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPatch("{id:int}/manager-review")]
    [HasPermission(Permissions.ReviewManagerRate)]
    public async Task<ActionResult<ApiResponse<PerformanceReviewDto>>> SubmitManagerReview(
        int id,
        [FromBody] SubmitManagerReviewRequest request)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<PerformanceReviewDto>.Fail("No employee linked to user."));

        var result = await _performanceService.SubmitManagerReviewAsync(id, _currentUser.EmployeeId.Value, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPatch("{id:int}/finalize")]
    [HasPermission(Permissions.ReviewFinalize)]
    public async Task<ActionResult<ApiResponse<PerformanceReviewDto>>> Finalize(
        int id,
        [FromBody] FinalizeReviewRequest request)
    {
        var result = await _performanceService.FinalizeReviewAsync(id, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
