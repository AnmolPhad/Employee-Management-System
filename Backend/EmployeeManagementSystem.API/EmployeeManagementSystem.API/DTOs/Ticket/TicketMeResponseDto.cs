namespace EmployeeManagementSystem.API.DTOs.Ticket
{
    public class TicketMeLeaveDetailsDto
    {
        public string LeaveTypeName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalDays { get; set; }
        public bool IsPaid { get; set; }
    }

    public class TicketMeResponseDto
    {
        public int TicketId { get; set; }
        public int? LeaveId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? AssignedToName { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? RejectedAt { get; set; }
        public TicketMeLeaveDetailsDto? LeaveDetails { get; set; }
    }
}
