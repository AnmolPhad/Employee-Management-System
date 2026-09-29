using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.DTOs.Leave
{
    public class LeaveCreateDto
    {
        [Required(ErrorMessage = "Leave Type is required.")]
        public int LeaveTypeId { get; set; }

        [Required(ErrorMessage = "Start Date is required.")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "End Date is required.")]
        public DateTime EndDate { get; set; }

        [Required(ErrorMessage = "Reason is required.")]
        [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters.")]
        public string Reason { get; set; } = string.Empty;
    }
}
