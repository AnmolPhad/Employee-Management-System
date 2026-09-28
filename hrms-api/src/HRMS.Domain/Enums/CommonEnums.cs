namespace HRMS.Domain.Enums;

public enum EmployeeStatus
{
    Active = 1,
    OnProbation = 2,
    OnNotice = 3,
    Resigned = 4,
    Terminated = 5,
    Inactive = 6
}

public enum LeaveStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Cancelled = 4
}

public enum AttendanceStatus
{
    Present = 1,
    Absent = 2,
    HalfDay = 3,
    OnLeave = 4,
    Holiday = 5,
    Weekend = 6
}

public enum PayslipStatus
{
    Draft = 1,
    Generated = 2,
    Approved = 3,
    Paid = 4
}

public enum ReviewStatus
{
    Draft = 1,
    GoalSetting = 2,
    SelfAssessmentPending = 3,
    ManagerReviewPending = 4,
    HRReviewPending = 5,
    Completed = 6,
    Cancelled = 7
}
