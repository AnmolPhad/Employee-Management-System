namespace EmployeeManagementSystem.API.DTOs.Leave
{
    public class ActiveLeaveTypeResponseDto
    {
        public int LeaveTypeId { get; set; }
        public string LeaveTypeName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int MaxDaysPerYear { get; set; }
        public bool IsPaid { get; set; }
    }
}
