using HRMS.Application.Common;
using HRMS.Application.DTOs;
using HRMS.Application.Interfaces;
using HRMS.Domain.Entities;
using HRMS.Domain.Enums;
using HRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HRMS.Infrastructure.Services;

public class EmployeeService : IEmployeeService
{
    private readonly HrmsDbContext _context;

    public EmployeeService(HrmsDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PagedResult<EmployeeDto>>> GetEmployeesAsync(EmployeeFilterRequest filter)
    {
        var query = _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.ReportingManager)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(e =>
                e.FirstName.ToLower().Contains(search) ||
                e.LastName.ToLower().Contains(search) ||
                e.Email.ToLower().Contains(search) ||
                e.EmployeeCode.ToLower().Contains(search));
        }

        if (filter.DepartmentId.HasValue)
            query = query.Where(e => e.DepartmentId == filter.DepartmentId.Value);

        if (filter.DesignationId.HasValue)
            query = query.Where(e => e.DesignationId == filter.DesignationId.Value);

        if (filter.Status.HasValue)
            query = query.Where(e => e.Status == filter.Status.Value);

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "firstname" => filter.SortDirection == "desc" ? query.OrderByDescending(e => e.FirstName) : query.OrderBy(e => e.FirstName),
            "dateofjoining" => filter.SortDirection == "desc" ? query.OrderByDescending(e => e.DateOfJoining) : query.OrderBy(e => e.DateOfJoining),
            "department" => filter.SortDirection == "desc" ? query.OrderByDescending(e => e.Department!.Name) : query.OrderBy(e => e.Department!.Name),
            _ => filter.SortDirection == "desc" ? query.OrderByDescending(e => e.LastName) : query.OrderBy(e => e.LastName)
        };

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(e => MapToDto(e))
            .ToListAsync();

        return ApiResponse<PagedResult<EmployeeDto>>.Ok(new PagedResult<EmployeeDto>(items, totalCount, filter.Page, filter.PageSize));
    }

    public async Task<ApiResponse<EmployeeDto>> GetEmployeeByIdAsync(int id)
    {
        var employee = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.ReportingManager)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employee == null)
            return ApiResponse<EmployeeDto>.Fail("Employee not found.");

        return ApiResponse<EmployeeDto>.Ok(MapToDto(employee));
    }

    public async Task<ApiResponse<EmployeeDto>> GetMyProfileAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null || !user.EmployeeId.HasValue)
            return ApiResponse<EmployeeDto>.Fail("No employee record linked to this user account.");

        return await GetEmployeeByIdAsync(user.EmployeeId.Value);
    }

    public async Task<ApiResponse<EmployeeDto>> CreateEmployeeAsync(CreateEmployeeRequest request)
    {
        var existingEmail = await _context.Employees.AnyAsync(e => e.Email.ToLower() == request.Email.ToLower());
        if (existingEmail)
            return ApiResponse<EmployeeDto>.Fail("An employee with this email already exists.");

        var count = await _context.Employees.CountAsync() + 1;
        var employeeCode = $"EMP-{DateTime.UtcNow.Year}-{count:D4}";

        var employee = new Employee
        {
            EmployeeCode = employeeCode,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            DateOfJoining = request.DateOfJoining,
            DepartmentId = request.DepartmentId,
            DesignationId = request.DesignationId,
            ReportingManagerId = request.ReportingManagerId,
            Status = EmployeeStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        // Initialize default leave balances for current year
        var leaveTypes = await _context.LeaveTypes.ToListAsync();
        var currentYear = DateTime.UtcNow.Year;
        foreach (var lt in leaveTypes)
        {
            _context.LeaveBalances.Add(new LeaveBalance
            {
                EmployeeId = employee.Id,
                LeaveTypeId = lt.Id,
                Year = currentYear,
                TotalLeaves = lt.DefaultDaysPerYear,
                UsedLeaves = 0
            });
        }
        await _context.SaveChangesAsync();

        return await GetEmployeeByIdAsync(employee.Id);
    }

    public async Task<ApiResponse<EmployeeDto>> UpdateEmployeeAsync(int id, UpdateEmployeeRequest request)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null)
            return ApiResponse<EmployeeDto>.Fail("Employee not found.");

        employee.FirstName = request.FirstName.Trim();
        employee.LastName = request.LastName.Trim();
        employee.Phone = request.Phone.Trim();
        employee.DateOfBirth = request.DateOfBirth;
        employee.Gender = request.Gender;
        employee.DepartmentId = request.DepartmentId;
        employee.DesignationId = request.DesignationId;
        employee.ReportingManagerId = request.ReportingManagerId;
        employee.Status = request.Status;
        employee.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetEmployeeByIdAsync(id);
    }

    public async Task<ApiResponse<EmployeeDto>> UpdateSelfProfileAsync(int userId, UpdateSelfProfileRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null || !user.EmployeeId.HasValue)
            return ApiResponse<EmployeeDto>.Fail("No employee record linked to current user.");

        var employee = await _context.Employees.FindAsync(user.EmployeeId.Value);
        if (employee == null)
            return ApiResponse<EmployeeDto>.Fail("Employee profile not found.");

        employee.FirstName = request.FirstName.Trim();
        employee.LastName = request.LastName.Trim();
        employee.Phone = request.Phone.Trim();
        employee.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetEmployeeByIdAsync(employee.Id);
    }

    public async Task<ApiResponse> DeleteEmployeeAsync(int id)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null)
            return ApiResponse.Fail("Employee not found.");

        // Soft delete
        employee.IsActive = false;
        employee.DeletedAt = DateTime.UtcNow;
        employee.Status = EmployeeStatus.Inactive;

        // Also deactivate associated user if any
        var user = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == id);
        if (user != null)
        {
            user.IsActive = false;
            user.DeletedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return ApiResponse.Ok("Employee soft-deleted successfully.");
    }

    public async Task<ApiResponse<List<EmployeeDto>>> GetDirectReportsAsync(int managerEmployeeId)
    {
        var reports = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.ReportingManager)
            .Where(e => e.ReportingManagerId == managerEmployeeId)
            .Select(e => MapToDto(e))
            .ToListAsync();

        return ApiResponse<List<EmployeeDto>>.Ok(reports);
    }

    public async Task<ApiResponse<List<EmployeeDto>>> SearchEmployeesAsync(string query)
    {
        var q = query.Trim().ToLower();
        var results = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.ReportingManager)
            .Where(e =>
                e.FirstName.ToLower().Contains(q) ||
                e.LastName.ToLower().Contains(q) ||
                e.Email.ToLower().Contains(q) ||
                e.EmployeeCode.ToLower().Contains(q))
            .Take(20)
            .Select(e => MapToDto(e))
            .ToListAsync();

        return ApiResponse<List<EmployeeDto>>.Ok(results);
    }

    private static EmployeeDto MapToDto(Employee e) => new()
    {
        Id = e.Id,
        EmployeeCode = e.EmployeeCode,
        FirstName = e.FirstName,
        LastName = e.LastName,
        Email = e.Email,
        Phone = e.Phone,
        DateOfBirth = e.DateOfBirth,
        Gender = e.Gender,
        DateOfJoining = e.DateOfJoining,
        DateOfLeaving = e.DateOfLeaving,
        Status = e.Status,
        DepartmentId = e.DepartmentId,
        DepartmentName = e.Department?.Name,
        DesignationId = e.DesignationId,
        DesignationTitle = e.Designation?.Title,
        ReportingManagerId = e.ReportingManagerId,
        ReportingManagerName = e.ReportingManager != null ? $"{e.ReportingManager.FirstName} {e.ReportingManager.LastName}".Trim() : null,
        IsActive = e.IsActive
    };
}
