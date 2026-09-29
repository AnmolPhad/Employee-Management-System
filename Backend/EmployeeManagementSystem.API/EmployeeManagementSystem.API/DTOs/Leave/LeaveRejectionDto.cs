using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.DTOs.Leave
{
    public class LeaveRejectionDto
    {
        [Required(ErrorMessage = "Rejection reason is required.")]
        [StringLength(500, ErrorMessage = "Rejection reason cannot exceed 500 characters.")]
        public string RejectionReason { get; set; } = string.Empty;
    }
}
