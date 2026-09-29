namespace EmployeeManagementSystem.API.DTOs.LeaveType
{
    public class LeaveTypeResponseDto
    {
        public int LeaveTypeId { get; set; }
        public string LeaveTypeName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int MaxDaysPerYear { get; set; }
        public bool IsPaid { get; set; }
        public bool IsActive { get; set; }
        public int LeaveCount { get; set; }
    }
}
