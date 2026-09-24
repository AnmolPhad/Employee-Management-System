using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.Models
{
    public class Permission
    {
        [Key]
        public int PermissionId { get; set; }

        [Required(ErrorMessage = "Permission Name is required.")]
        [StringLength(100, ErrorMessage = "Permission Name cannot exceed 100 characters.")]
        [Display(Name = "Permission Name")]
        public string PermissionName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Module is required.")]
        [StringLength(50, ErrorMessage = "Module cannot exceed 50 characters.")]
        public string Module { get; set; } = string.Empty;

        [StringLength(250, ErrorMessage = "Description cannot exceed 250 characters.")]
        public string? Description { get; set; }

        // Navigation properties
        public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
}
