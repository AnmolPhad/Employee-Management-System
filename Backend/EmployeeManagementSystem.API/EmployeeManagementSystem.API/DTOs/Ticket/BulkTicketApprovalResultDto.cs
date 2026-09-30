namespace EmployeeManagementSystem.API.DTOs.Ticket
{
    public class BulkTicketApprovalResultDto
    {
        public int ApprovedCount { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
