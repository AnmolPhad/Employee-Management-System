using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.DTOs.Employee
{
    public class EmployeeResponseDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeCode { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public Gender? Gender { get; set; }
        public string? Address { get; set; }
        public DateTime DateOfJoining { get; set; }
        public int DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public int RoleId { get; set; }
        public string? RoleName { get; set; }
        public int? ManagerId { get; set; }
        public string? ManagerName { get; set; }
        public EmploymentStatus EmploymentStatus { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
