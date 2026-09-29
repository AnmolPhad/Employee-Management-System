using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.DTOs.LeaveType
{
    public class LeaveTypeUpdateDto
    {
        [Required(ErrorMessage = "Leave Type Name is required.")]
        [StringLength(50, ErrorMessage = "Leave Type Name cannot exceed 50 characters.")]
        public string LeaveTypeName { get; set; } = string.Empty;

        [StringLength(250, ErrorMessage = "Description cannot exceed 250 characters.")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Max days per year is required.")]
        [Range(1, 365, ErrorMessage = "Max days per year must be between 1 and 365.")]
        public int MaxDaysPerYear { get; set; } = 15;

        public bool IsPaid { get; set; } = true;

        public bool IsActive { get; set; } = true;
    }
}
