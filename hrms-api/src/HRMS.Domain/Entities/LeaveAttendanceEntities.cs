using HRMS.Domain.Common;
using HRMS.Domain.Enums;

namespace HRMS.Domain.Entities;

public class LeaveType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public int DefaultDaysPerYear { get; set; }
    public bool IsCarryForward { get; set; }
    public int MaxCarryForwardDays { get; set; }
}

public class LeaveRequest : BaseEntity
{
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public int LeaveTypeId { get; set; }
    public LeaveType LeaveType { get; set; } = null!;

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public string Reason { get; set; } = string.Empty;
    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;

    public int? ApprovedById { get; set; }
    public Employee? ApprovedBy { get; set; }
    public string? ManagerComments { get; set; }
    public DateTime? ActionedAt { get; set; }
}

public class LeaveBalance : BaseEntity
{
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public int LeaveTypeId { get; set; }
    public LeaveType LeaveType { get; set; } = null!;

    public int Year { get; set; }
    public int TotalLeaves { get; set; }
    public int UsedLeaves { get; set; }
    public int RemainingLeaves => Math.Max(0, TotalLeaves - UsedLeaves);
}

public class Attendance : BaseEntity
{
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public DateTime Date { get; set; }
    public TimeSpan? CheckIn { get; set; }
    public TimeSpan? CheckOut { get; set; }
    public decimal TotalHours { get; set; }
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;
    public string? Remarks { get; set; }
}
