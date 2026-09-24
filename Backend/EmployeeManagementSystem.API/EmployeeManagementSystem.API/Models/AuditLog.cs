using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EmployeeManagementSystem.API.Models
{
    public class AuditLog
    {
        [Key]
        public int AuditLogId { get; set; }

        [StringLength(450)]
        [Display(Name = "User ID")]
        public string? UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual ApplicationUser? User { get; set; }

        [Required(ErrorMessage = "Action is required.")]
        [StringLength(100)]
        public string Action { get; set; } = string.Empty;

        [Required(ErrorMessage = "Entity Name is required.")]
        [StringLength(100)]
        [Display(Name = "Entity Name")]
        public string EntityName { get; set; } = string.Empty;

        [StringLength(100)]
        [Display(Name = "Entity ID")]
        public string? EntityId { get; set; }

        [Display(Name = "Old Value")]
        public string? OldValue { get; set; }

        [Display(Name = "New Value")]
        public string? NewValue { get; set; }

        [StringLength(50)]
        [Display(Name = "IP Address")]
        public string? IPAddress { get; set; }

        [Display(Name = "Timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
