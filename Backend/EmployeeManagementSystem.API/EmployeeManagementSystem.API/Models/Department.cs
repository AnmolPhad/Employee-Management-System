using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EmployeeManagementSystem.API.Models
{
    public class Department
    {
        [Key]
        public int DepartmentId { get; set; }

        [Required(ErrorMessage = "Department Name is required.")]
        [StringLength(100, ErrorMessage = "Department Name cannot exceed 100 characters.")]
        [Display(Name = "Department Name")]
        public string DepartmentName { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string? Description { get; set; }

        [StringLength(100, ErrorMessage = "Location cannot exceed 100 characters.")]
        public string? Location { get; set; }

        [Display(Name = "Department Head")]
        public int? DepartmentHeadId { get; set; }

        [ForeignKey(nameof(DepartmentHeadId))]
        public virtual Employee? DepartmentHead { get; set; }

        [Display(Name = "Is Active")]
        public bool IsActive { get; set; } = true;

        [Display(Name = "Created At")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Display(Name = "Updated At")]
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();
        public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}
