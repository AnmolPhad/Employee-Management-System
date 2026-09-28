using HRMS.Domain.Enums;

namespace HRMS.Application.DTOs;

public class EmployeeDto
{
    public int Id { get; set; }
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
    public EmployeeStatus Status { get; set; }
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int? DesignationId { get; set; }
    public string? DesignationTitle { get; set; }
    public int? ReportingManagerId { get; set; }
    public string? ReportingManagerName { get; set; }
    public bool IsActive { get; set; }
}

public class CreateEmployeeRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public DateTime DateOfJoining { get; set; }
    public int? DepartmentId { get; set; }
    public int? DesignationId { get; set; }
    public int? ReportingManagerId { get; set; }
}

public class UpdateEmployeeRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public int? DesignationId { get; set; }
    public int? ReportingManagerId { get; set; }
    public EmployeeStatus Status { get; set; }
}

public class UpdateSelfProfileRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class EmployeeFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public int? DepartmentId { get; set; }
    public int? DesignationId { get; set; }
    public EmployeeStatus? Status { get; set; }
    public string? SortBy { get; set; } = "LastName";
    public string? SortDirection { get; set; } = "asc";
}
