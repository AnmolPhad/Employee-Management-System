using HRMS.Application.Common;
using HRMS.Application.DTOs;
using HRMS.Application.Interfaces;
using HRMS.Domain.Entities;
using HRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HRMS.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly HrmsDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthService(HrmsDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return ApiResponse<AuthResponse>.Fail("Invalid email or password.");
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Name)
            .Distinct()
            .ToList();

        var accessToken = _tokenService.GenerateAccessToken(user, roles, permissions);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // Save refresh token
        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };
        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        return ApiResponse<AuthResponse>.Ok(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = 3600,
            User = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                EmployeeId = user.EmployeeId,
                Roles = roles,
                Permissions = permissions
            }
        }, "Login successful");
    }

    public async Task<ApiResponse<UserProfileDto>> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (existingUser)
        {
            return ApiResponse<UserProfileDto>.Fail("A user with this email already exists.");
        }

        var user = new User
        {
            Email = request.Email.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            EmployeeId = request.EmployeeId
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Assign roles
        var assignedRoles = new List<string>();
        if (request.Roles.Any())
        {
            var roles = await _context.Roles
                .Where(r => request.Roles.Contains(r.Name))
                .ToListAsync();

            foreach (var role in roles)
            {
                _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
                assignedRoles.Add(role.Name);
            }
            await _context.SaveChangesAsync();
        }

        return ApiResponse<UserProfileDto>.Ok(new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            EmployeeId = user.EmployeeId,
            Roles = assignedRoles
        }, "User registered successfully");
    }

    public async Task<ApiResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiresAt <= DateTime.UtcNow)
        {
            return ApiResponse<AuthResponse>.Fail("Invalid or expired refresh token.");
        }

        var user = storedToken.User;
        var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Name)
            .Distinct()
            .ToList();

        // Rotate token
        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;

        var newRefreshToken = _tokenService.GenerateRefreshToken();
        _context.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        });

        await _context.SaveChangesAsync();

        var newAccessToken = _tokenService.GenerateAccessToken(user, roles, permissions);

        return ApiResponse<AuthResponse>.Ok(new AuthResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresIn = 3600,
            User = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                EmployeeId = user.EmployeeId,
                Roles = roles,
                Permissions = permissions
            }
        }, "Token refreshed");
    }

    public async Task<ApiResponse> RevokeTokenAsync(string refreshToken)
    {
        var token = await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken);
        if (token != null && !token.IsRevoked)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
        return ApiResponse.Ok("Token revoked successfully");
    }

    public async Task<ApiResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return ApiResponse.Fail("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return ApiResponse.Fail("Current password is incorrect.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse.Ok("Password changed successfully.");
    }

    public async Task<ApiResponse<UserProfileDto>> GetCurrentUserProfileAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return ApiResponse<UserProfileDto>.Fail("User not found.");

        var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Name)
            .Distinct()
            .ToList();

        return ApiResponse<UserProfileDto>.Ok(new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            EmployeeId = user.EmployeeId,
            Roles = roles,
            Permissions = permissions
        });
    }

    public async Task<ApiResponse> AssignRolesAsync(AssignRoleRequest request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == request.UserId);

        if (user == null)
            return ApiResponse.Fail("User not found.");

        // Remove existing
        _context.UserRoles.RemoveRange(user.UserRoles);

        var roles = await _context.Roles
            .Where(r => request.RoleNames.Contains(r.Name))
            .ToListAsync();

        foreach (var role in roles)
        {
            _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        }

        await _context.SaveChangesAsync();
        return ApiResponse.Ok("Roles updated successfully.");
    }

    public async Task<ApiResponse<List<string>>> GetAllRolesAsync()
    {
        var roles = await _context.Roles.Select(r => r.Name).ToListAsync();
        return ApiResponse<List<string>>.Ok(roles);
    }
}
