using System.Security.Claims;
using HRMS.Application.Interfaces;

namespace HRMS.API.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public int? UserId
    {
        get
        {
            var idClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(idClaim, out var id) ? id : null;
        }
    }

    public string? Email => User?.FindFirst(ClaimTypes.Email)?.Value;

    public int? EmployeeId
    {
        get
        {
            var empClaim = User?.FindFirst("EmployeeId")?.Value;
            return int.TryParse(empClaim, out var id) ? id : null;
        }
    }

    public IReadOnlyList<string> Roles => User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? [];

    public IReadOnlyList<string> Permissions => User?.FindAll("Permission").Select(c => c.Value).ToList() ?? [];

    public bool IsInRole(string role) => User?.IsInRole(role) ?? false;

    public bool HasPermission(string permission) => Permissions.Contains(permission);
}
