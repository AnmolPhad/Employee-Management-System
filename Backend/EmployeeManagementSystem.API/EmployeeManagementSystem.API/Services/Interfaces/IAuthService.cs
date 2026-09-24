using EmployeeManagementSystem.API.DTOs.Auth;

namespace EmployeeManagementSystem.API.Services.Interfaces
{
    public interface IAuthService
    {
        Task<ServiceResult<AuthUserDto>> RegisterAsync(RegisterRequestDto dto, CancellationToken cancellationToken = default);
        Task<ServiceResult<LoginResponseDto>> LoginAsync(LoginRequestDto dto, CancellationToken cancellationToken = default);
        Task<ServiceResult<AuthUserDto>> GetCurrentUserAsync(string userId, CancellationToken cancellationToken = default);
    }
}
