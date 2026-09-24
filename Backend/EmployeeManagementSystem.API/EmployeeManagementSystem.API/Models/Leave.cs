using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.Models
{
    public class Leave
    {
        [Key]
        public int LeaveId { get; set; }

        [Required]
        [Display(Name = "Employee")]
        public int EmployeeId { get; set; }

        [ForeignKey(nameof(EmployeeId))]
        public virtual Employee? Employee { get; set; }

        [Required]
        [Display(Name = "Leave Type")]
        public int LeaveTypeId { get; set; }

        [ForeignKey(nameof(LeaveTypeId))]
        public virtual LeaveType? LeaveType { get; set; }

        [Required(ErrorMessage = "Start Date is required.")]
        [DataType(DataType.Date)]
        [Display(Name = "Start Date")]
        public DateTime StartDate { get; set; } = DateTime.Today;

        [Required(ErrorMessage = "End Date is required.")]
        [DataType(DataType.Date)]
        [Display(Name = "End Date")]
        public DateTime EndDate { get; set; } = DateTime.Today;

        [Required]
        [Range(1, 365, ErrorMessage = "Total days must be at least 1.")]
        [Display(Name = "Total Days")]
        public int TotalDays { get; set; } = 1;

        [Required(ErrorMessage = "Reason is required.")]
        [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters.")]
        public string Reason { get; set; } = string.Empty;

        [Display(Name = "Status")]
        public LeaveStatus Status { get; set; } = LeaveStatus.Pending;

        [Display(Name = "Applied Date")]
        public DateTime AppliedDate { get; set; } = DateTime.UtcNow;

        [Display(Name = "Approved / Processed By")]
        public int? ApprovedById { get; set; }

        [ForeignKey(nameof(ApprovedById))]
        public virtual Employee? ApprovedBy { get; set; }

        [Display(Name = "Approved / Processed Date")]
        public DateTime? ApprovedDate { get; set; }

        [StringLength(500, ErrorMessage = "Rejection Reason cannot exceed 500 characters.")]
        [Display(Name = "Rejection Reason")]
        public string? RejectionReason { get; set; }
    }
}
