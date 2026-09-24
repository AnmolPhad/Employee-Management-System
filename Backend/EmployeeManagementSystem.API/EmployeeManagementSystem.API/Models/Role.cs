using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.Models
{
    public class Role
    {
        [Key]
        public int RoleId { get; set; }

        [Required(ErrorMessage = "Role Name is required.")]
        [StringLength(50, ErrorMessage = "Role Name cannot exceed 50 characters.")]
        [Display(Name = "Role Name")]
        public string RoleName { get; set; } = string.Empty;

        [StringLength(250, ErrorMessage = "Description cannot exceed 250 characters.")]
        public string? Description { get; set; }

        [Display(Name = "Is Active")]
        public bool IsActive { get; set; } = true;

        [Display(Name = "Created At")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Display(Name = "Updated At")]
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();
        public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
}
