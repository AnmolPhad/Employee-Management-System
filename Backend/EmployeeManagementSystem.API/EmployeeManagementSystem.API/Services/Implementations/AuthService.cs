using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.Data;
using EmployeeManagementSystem.API.DTOs.Auth;
using EmployeeManagementSystem.API.Models;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EmployeeManagementSystem.API.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            RoleManager<IdentityRole> roleManager,
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _context = context;
            _configuration = configuration;
        }

        public async Task<ServiceResult<AuthUserDto>> RegisterAsync(RegisterRequestDto dto, CancellationToken cancellationToken = default)
        {
            var requestedRole = string.IsNullOrWhiteSpace(dto.Role) ? AppRoles.Employee : dto.Role.Trim();
            if (!string.Equals(requestedRole, AppRoles.Employee, StringComparison.OrdinalIgnoreCase))
            {
                return ServiceResult<AuthUserDto>.BadRequest("Public registration can only create Employee users.");
            }

            var normalizedEmail = dto.Email.Trim();
            var existingUser = await _userManager.FindByEmailAsync(normalizedEmail);
            if (existingUser is not null)
            {
                return ServiceResult<AuthUserDto>.Conflict("A user with this email already exists.");
            }

            if (dto.EmployeeId.HasValue)
            {
                var employeeExists = await _context.Employees.AnyAsync(e => e.EmployeeId == dto.EmployeeId.Value, cancellationToken);
                if (!employeeExists)
                {
                    return ServiceResult<AuthUserDto>.BadRequest("Linked employee does not exist.");
                }

                var employeeAlreadyLinked = await _context.Users.AnyAsync(u => u.EmployeeId == dto.EmployeeId.Value, cancellationToken);
                if (employeeAlreadyLinked)
                {
                    return ServiceResult<AuthUserDto>.Conflict("This employee is already linked to a user account.");
                }
            }

            if (!await _roleManager.RoleExistsAsync(AppRoles.Employee))
            {
                await _roleManager.CreateAsync(new IdentityRole(AppRoles.Employee));
            }

            var user = new ApplicationUser
            {
                UserName = string.IsNullOrWhiteSpace(dto.UserName) ? normalizedEmail : dto.UserName.Trim(),
                Email = normalizedEmail,
                EmployeeId = dto.EmployeeId,
                EmailConfirmed = true
            };

            var createResult = await _userManager.CreateAsync(user, dto.Password);
            if (!createResult.Succeeded)
            {
                return ServiceResult<AuthUserDto>.BadRequest(string.Join(" ", createResult.Errors.Select(e => e.Description)));
            }

            var roleResult = await _userManager.AddToRoleAsync(user, AppRoles.Employee);
            if (!roleResult.Succeeded)
            {
                return ServiceResult<AuthUserDto>.BadRequest(string.Join(" ", roleResult.Errors.Select(e => e.Description)));
            }

            var authUser = await BuildAuthUserDtoAsync(user, cancellationToken);
            return ServiceResult<AuthUserDto>.Success(authUser, "Registration successful.");
        }

        public async Task<ServiceResult<LoginResponseDto>> LoginAsync(LoginRequestDto dto, CancellationToken cancellationToken = default)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email.Trim());
            if (user is null)
            {
                return ServiceResult<LoginResponseDto>.BadRequest("Invalid email or password.");
            }

            var signInResult = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: false);
            if (!signInResult.Succeeded)
            {
                return ServiceResult<LoginResponseDto>.BadRequest("Invalid email or password.");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var tokenResult = GenerateJwtToken(user, roles);
            var authUser = await BuildAuthUserDtoAsync(user, cancellationToken);

            var response = new LoginResponseDto
            {
                Token = tokenResult.Token,
                ExpiresAt = tokenResult.ExpiresAt,
                User = authUser
            };

            return ServiceResult<LoginResponseDto>.Success(response, "Login successful.");
        }

        public async Task<ServiceResult<AuthUserDto>> GetCurrentUserAsync(string userId, CancellationToken cancellationToken = default)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user is null)
            {
                return ServiceResult<AuthUserDto>.NotFound("User was not found.");
            }

            var authUser = await BuildAuthUserDtoAsync(user, cancellationToken);
            return ServiceResult<AuthUserDto>.Success(authUser, "Current user retrieved successfully.");
        }

        private (string Token, DateTime ExpiresAt) GenerateJwtToken(ApplicationUser user, IList<string> roles)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var secretKey = jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key is not configured.");
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var expiresAt = DateTime.UtcNow.AddHours(8);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Name, user.UserName ?? string.Empty),
                new(ClaimTypes.Email, user.Email ?? string.Empty)
            };

            if (user.EmployeeId.HasValue)
            {
                claims.Add(new Claim("employeeId", user.EmployeeId.Value.ToString()));
            }

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
                claims.Add(new Claim("role", role));
            }

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials);

            return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
        }

        private async Task<AuthUserDto> BuildAuthUserDtoAsync(ApplicationUser user, CancellationToken cancellationToken)
        {
            var roles = await _userManager.GetRolesAsync(user);
            string? employeeName = null;

            if (user.EmployeeId.HasValue)
            {
                employeeName = await _context.Employees
                    .AsNoTracking()
                    .Where(e => e.EmployeeId == user.EmployeeId.Value)
                    .Select(e => (e.FirstName + " " + e.LastName).Trim())
                    .FirstOrDefaultAsync(cancellationToken);
            }

            return new AuthUserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                Roles = roles.ToArray(),
                Role = roles.FirstOrDefault() ?? string.Empty,
                EmployeeId = user.EmployeeId,
                EmployeeName = employeeName
            };
        }
    }
}
