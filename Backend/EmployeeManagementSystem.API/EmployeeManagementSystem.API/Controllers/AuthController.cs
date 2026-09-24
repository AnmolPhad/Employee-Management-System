using System.Security.Claims;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Auth;
using EmployeeManagementSystem.API.Services;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        [ProducesResponseType(typeof(ApiResponse<AuthUserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<AuthUserDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<AuthUserDto>), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<AuthUserDto>>> Register(RegisterRequestDto dto, CancellationToken cancellationToken)
        {
            var result = await _authService.RegisterAsync(dto, cancellationToken);
            return ToActionResult(result);
        }

        [AllowAnonymous]
        [HttpPost("login")]
        [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Login(LoginRequestDto dto, CancellationToken cancellationToken)
        {
            var result = await _authService.LoginAsync(dto, cancellationToken);
            return ToActionResult(result);
        }

        [Authorize]
        [HttpGet("me")]
        [ProducesResponseType(typeof(ApiResponse<AuthUserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<AuthUserDto>>> Me(CancellationToken cancellationToken)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(ApiResponse<AuthUserDto>.Fail("Authenticated user id was not found."));
            }

            var result = await _authService.GetCurrentUserAsync(userId, cancellationToken);
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
                _ => StatusCode(StatusCodes.Status500InternalServerError, response)
            };
        }
    }
}
