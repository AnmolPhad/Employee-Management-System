namespace EmployeeManagementSystem.API.DTOs.Leave
{
    public class LeaveBalanceResponseDto
    {
        public int LeaveTypeId { get; set; }
        public string LeaveTypeName { get; set; } = string.Empty;
        public int AnnualEntitlement { get; set; }
        public int PendingDays { get; set; }
        public int ApprovedDays { get; set; }
        public int RejectedDays { get; set; }
        public int AvailableDays { get; set; }
        public string FinancialYear { get; set; } = string.Empty;
        public bool IsPaid { get; set; }
    }
}
