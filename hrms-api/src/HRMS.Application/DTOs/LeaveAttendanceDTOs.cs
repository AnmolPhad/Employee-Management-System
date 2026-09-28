using HRMS.Domain.Enums;

namespace HRMS.Application.DTOs;

public class LeaveTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public int DefaultDaysPerYear { get; set; }
    public bool IsCarryForward { get; set; }
    public int MaxCarryForwardDays { get; set; }
    public bool IsActive { get; set; }
}

public class CreateLeaveTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public int DefaultDaysPerYear { get; set; }
    public bool IsCarryForward { get; set; }
    public int MaxCarryForwardDays { get; set; }
}

public class LeaveRequestDto
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public int LeaveTypeId { get; set; }
    public string LeaveTypeName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public string Reason { get; set; } = string.Empty;
    public LeaveStatus Status { get; set; }
    public int? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public string? ManagerComments { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ApplyLeaveRequest
{
    public int LeaveTypeId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ApproveRejectLeaveRequest
{
    public string? Comments { get; set; }
}

public class LeaveBalanceDto
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int LeaveTypeId { get; set; }
    public string LeaveTypeName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int TotalLeaves { get; set; }
    public int UsedLeaves { get; set; }
    public int RemainingLeaves { get; set; }
}

public class AdjustLeaveBalanceRequest
{
    public int TotalLeaves { get; set; }
    public int UsedLeaves { get; set; }
}

public class AttendanceDto
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public TimeSpan? CheckIn { get; set; }
    public TimeSpan? CheckOut { get; set; }
    public decimal TotalHours { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Remarks { get; set; }
}

public class AttendanceReportDto
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int Month { get; set; }
    public int Year { get; set; }
    public int TotalWorkingDays { get; set; }
    public int PresentDays { get; set; }
    public int AbsentDays { get; set; }
    public int HalfDays { get; set; }
    public int LeaveDays { get; set; }
    public decimal TotalHoursLogged { get; set; }
}
