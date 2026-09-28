using HRMS.Domain.Common;
using HRMS.Domain.Enums;

namespace HRMS.Domain.Entities;

public class Department : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ManagerId { get; set; }
    public Employee? Manager { get; set; }

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}

public class Designation : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public int Level { get; set; } = 1;
    public string? Description { get; set; }

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}

public class Employee : BaseEntity
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public DateTime DateOfJoining { get; set; }
    public DateTime? DateOfLeaving { get; set; }
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;

    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public int? DesignationId { get; set; }
    public Designation? Designation { get; set; }

    public int? ReportingManagerId { get; set; }
    public Employee? ReportingManager { get; set; }
    public ICollection<Employee> DirectReports { get; set; } = new List<Employee>();

    // Navigation properties for other modules
    public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    public ICollection<LeaveBalance> LeaveBalances { get; set; } = new List<LeaveBalance>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<SalaryStructure> SalaryStructures { get; set; } = new List<SalaryStructure>();
    public ICollection<Payslip> Payslips { get; set; } = new List<Payslip>();
    public ICollection<PerformanceReview> PerformanceReviews { get; set; } = new List<PerformanceReview>();
}
