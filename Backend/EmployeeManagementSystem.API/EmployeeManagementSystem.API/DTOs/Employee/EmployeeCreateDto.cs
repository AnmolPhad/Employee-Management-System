using System.ComponentModel.DataAnnotations;
using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.DTOs.Employee
{
    public class EmployeeCreateDto
    {
        [Required]
        [StringLength(20)]
        public string EmployeeCode { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Phone]
        [StringLength(20)]
        public string? Phone { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public Gender? Gender { get; set; }

        [StringLength(250)]
        public string? Address { get; set; }

        [Required]
        public DateTime DateOfJoining { get; set; }

        [Required]
        public int DepartmentId { get; set; }

        [Required]
        public int RoleId { get; set; }

        public int? ManagerId { get; set; }

        [Required]
        public EmploymentStatus EmploymentStatus { get; set; }
    }
}
