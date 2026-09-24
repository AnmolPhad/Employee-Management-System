using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.Models
{
    public class ProjectAssignment
    {
        [Key]
        public int ProjectAssignmentId { get; set; }

        [Required]
        [Display(Name = "Project")]
        public int ProjectId { get; set; }

        [ForeignKey(nameof(ProjectId))]
        public virtual Project? Project { get; set; }

        [Required]
        [Display(Name = "Employee")]
        public int EmployeeId { get; set; }

        [ForeignKey(nameof(EmployeeId))]
        public virtual Employee? Employee { get; set; }

        [Required(ErrorMessage = "Role in project is required.")]
        [StringLength(100, ErrorMessage = "Role in project cannot exceed 100 characters.")]
        [Display(Name = "Role in Project")]
        public string RoleInProject { get; set; } = string.Empty;

        [Required(ErrorMessage = "Start Date is required.")]
        [DataType(DataType.Date)]
        [Display(Name = "Start Date")]
        public DateTime StartDate { get; set; } = DateTime.Today;

        [DataType(DataType.Date)]
        [Display(Name = "End Date")]
        public DateTime? EndDate { get; set; }

        [Range(1, 100, ErrorMessage = "Allocation percentage must be between 1 and 100.")]
        [Display(Name = "Allocation %")]
        public int AllocationPercentage { get; set; } = 100;

        [Display(Name = "Status")]
        public ProjectAssignmentStatus Status { get; set; } = ProjectAssignmentStatus.Active;
    }
}
