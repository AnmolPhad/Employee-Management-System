using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.DTOs.Auth
{
    public class RegisterRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        public string? UserName { get; set; }

        public int? EmployeeId { get; set; }

        /// <summary>
        /// Public registration only permits Employee. Admin/HR/Manager assignment must be done by an administrator.
        /// </summary>
        public string? Role { get; set; }
    }

    public class LoginRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthUserDto
    {
        public string Id { get; set; } = string.Empty;
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string Role { get; set; } = string.Empty;
        public IReadOnlyList<string> Roles { get; set; } = Array.Empty<string>();
        public int? EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
    }

    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public AuthUserDto User { get; set; } = new();
    }
}
