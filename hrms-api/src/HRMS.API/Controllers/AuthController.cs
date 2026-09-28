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
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUser;

    public AuthController(IAuthService authService, ICurrentUserService currentUser)
    {
        _authService = authService;
        _currentUser = currentUser;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        if (!response.Success) return Unauthorized(response);
        return Ok(response);
    }

    [HttpPost("register")]
    [Authorize]
    [HasPermission(Permissions.UserRegister)]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> Register([FromBody] RegisterRequest request)
    {
        var response = await _authService.RegisterAsync(request);
        if (!response.Success) return BadRequest(response);
        return CreatedAtAction(nameof(GetProfile), new { id = response.Data?.Id }, response);
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var response = await _authService.RefreshTokenAsync(request);
        if (!response.Success) return Unauthorized(response);
        return Ok(response);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> Logout([FromBody] RefreshTokenRequest request)
    {
        var response = await _authService.RevokeTokenAsync(request.RefreshToken);
        return Ok(response);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!_currentUser.UserId.HasValue) return Unauthorized();
        var response = await _authService.ChangePasswordAsync(_currentUser.UserId.Value, request);
        if (!response.Success) return BadRequest(response);
        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetProfile()
    {
        if (!_currentUser.UserId.HasValue) return Unauthorized();
        var response = await _authService.GetCurrentUserProfileAsync(_currentUser.UserId.Value);
        if (!response.Success) return NotFound(response);
        return Ok(response);
    }

    [HttpGet("roles")]
    [Authorize]
    [HasPermission(Permissions.RoleManage)]
    public async Task<ActionResult<ApiResponse<List<string>>>> GetRoles()
    {
        var response = await _authService.GetAllRolesAsync();
        return Ok(response);
    }

    [HttpPost("roles/assign")]
    [Authorize]
    [HasPermission(Permissions.RoleManage)]
    public async Task<ActionResult<ApiResponse>> AssignRoles([FromBody] AssignRoleRequest request)
    {
        var response = await _authService.AssignRolesAsync(request);
        if (!response.Success) return BadRequest(response);
        return Ok(response);
    }
}
