using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.Models
{
    public class Ticket
    {
        [Key]
        public int TicketId { get; set; }

        [Required]
        [Display(Name = "Employee (Creator)")]
        public int EmployeeId { get; set; }

        [ForeignKey(nameof(EmployeeId))]
        public virtual Employee? Employee { get; set; }

        [Required(ErrorMessage = "Title is required.")]
        [StringLength(150, ErrorMessage = "Title cannot exceed 150 characters.")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required.")]
        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Category is required.")]
        [StringLength(50, ErrorMessage = "Category cannot exceed 50 characters.")]
        public string Category { get; set; } = "General";

        [Display(Name = "Priority")]
        public TicketPriority Priority { get; set; } = TicketPriority.Medium;

        [Display(Name = "Status")]
        public TicketStatus Status { get; set; } = TicketStatus.Open;

        [Display(Name = "Assigned To")]
        public int? AssignedToId { get; set; }

        [ForeignKey(nameof(AssignedToId))]
        public virtual Employee? AssignedTo { get; set; }

        [Display(Name = "Created At")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Display(Name = "Updated At")]
        public DateTime? UpdatedAt { get; set; }

        [Display(Name = "Closed At")]
        public DateTime? ClosedAt { get; set; }
    }
}
