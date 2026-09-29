using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.DTOs.Ticket
{
    public class TicketRejectDto
    {
        [Required(ErrorMessage = "Rejection reason is required.")]
        [StringLength(500, ErrorMessage = "Rejection reason cannot exceed 500 characters.")]
        public string Reason { get; set; } = string.Empty;
    }
}
