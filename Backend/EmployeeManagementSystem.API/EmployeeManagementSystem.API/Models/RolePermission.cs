using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EmployeeManagementSystem.API.Models
{
    public class RolePermission
    {
        [Key]
        public int RolePermissionId { get; set; }

        [Required]
        public int RoleId { get; set; }

        [ForeignKey(nameof(RoleId))]
        public virtual Role? Role { get; set; }

        [Required]
        public int PermissionId { get; set; }

        [ForeignKey(nameof(PermissionId))]
        public virtual Permission? Permission { get; set; }
    }
}
