using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.Models
{
    public class LeaveType
    {
        [Key]
        public int LeaveTypeId { get; set; }

        [Required(ErrorMessage = "Leave Type Name is required.")]
        [StringLength(50, ErrorMessage = "Leave Type Name cannot exceed 50 characters.")]
        [Display(Name = "Leave Type Name")]
        public string LeaveTypeName { get; set; } = string.Empty;

        [StringLength(250, ErrorMessage = "Description cannot exceed 250 characters.")]
        public string? Description { get; set; }

        [Range(1, 365, ErrorMessage = "Max days per year must be between 1 and 365.")]
        [Display(Name = "Max Days Per Year")]
        public int MaxDaysPerYear { get; set; } = 15;

        [Display(Name = "Is Active")]
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual ICollection<Leave> Leaves { get; set; } = new List<Leave>();
    }
}
