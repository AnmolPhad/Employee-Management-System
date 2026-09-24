using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.Models
{
    public class Project
    {
        [Key]
        public int ProjectId { get; set; }

        [Required(ErrorMessage = "Project Name is required.")]
        [StringLength(150, ErrorMessage = "Project Name cannot exceed 150 characters.")]
        [Display(Name = "Project Name")]
        public string ProjectName { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Department is required.")]
        [Display(Name = "Department")]
        public int DepartmentId { get; set; }

        [ForeignKey(nameof(DepartmentId))]
        public virtual Department? Department { get; set; }

        [Display(Name = "Project Manager")]
        public int? ProjectManagerId { get; set; }

        [ForeignKey(nameof(ProjectManagerId))]
        public virtual Employee? ProjectManager { get; set; }

        [Required(ErrorMessage = "Start Date is required.")]
        [DataType(DataType.Date)]
        [Display(Name = "Start Date")]
        public DateTime StartDate { get; set; } = DateTime.Today;

        [DataType(DataType.Date)]
        [Display(Name = "End Date")]
        public DateTime? EndDate { get; set; }

        [Display(Name = "Status")]
        public ProjectStatus Status { get; set; } = ProjectStatus.Planned;

        [Display(Name = "Created At")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Display(Name = "Updated At")]
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<ProjectAssignment> Assignments { get; set; } = new List<ProjectAssignment>();
    }
}
