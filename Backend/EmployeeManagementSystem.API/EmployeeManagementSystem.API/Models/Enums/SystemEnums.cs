namespace EmployeeManagementSystem.API.Models.Enums
{
    public enum EmploymentStatus
    {
        FullTime = 1,
        PartTime = 2,
        Contract = 3,
        Intern = 4,
        Resigned = 5,
        Terminated = 6
    }

    public enum Gender
    {
        Male = 1,
        Female = 2,
        Other = 3
    }

    public enum ProjectStatus
    {
        Planned = 1,
        Active = 2,
        Completed = 3,
        Cancelled = 4
    }

    public enum ProjectAssignmentStatus
    {
        Active = 1,
        Inactive = 2,
        Completed = 3
    }

    public enum AttendanceStatus
    {
        Present = 1,
        Absent = 2,
        HalfDay = 3,
        Leave = 4,
        Holiday = 5
    }

    public enum LeaveStatus
    {
        Pending = 1,
        Approved = 2,
        Rejected = 3,
        Cancelled = 4
    }

    public enum SalaryStatus
    {
        Active = 1,
        Inactive = 2,
        Revised = 3
    }

    public enum TicketPriority
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }

    public enum TicketStatus
    {
        Open = 1,
        InProgress = 2,
        Resolved = 3,
        Closed = 4
    }
}
