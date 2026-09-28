using HRMS.Application.Common;
using HRMS.Application.DTOs;
using HRMS.Application.Interfaces;
using HRMS.Domain.Entities;
using HRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HRMS.Infrastructure.Services;

public class DepartmentService : IDepartmentService
{
    private readonly HrmsDbContext _context;

    public DepartmentService(HrmsDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<DepartmentDto>>> GetAllDepartmentsAsync()
    {
        var list = await _context.Departments
            .Include(d => d.Manager)
            .Include(d => d.Employees)
            .Select(d => new DepartmentDto
            {
                Id = d.Id,
                Name = d.Name,
                Code = d.Code,
                Description = d.Description,
                ManagerId = d.ManagerId,
                ManagerName = d.Manager != null ? $"{d.Manager.FirstName} {d.Manager.LastName}".Trim() : null,
                EmployeeCount = d.Employees.Count(e => e.IsActive),
                IsActive = d.IsActive
            })
            .ToListAsync();

        return ApiResponse<List<DepartmentDto>>.Ok(list);
    }

    public async Task<ApiResponse<DepartmentDto>> GetDepartmentByIdAsync(int id)
    {
        var d = await _context.Departments
            .Include(d => d.Manager)
            .Include(d => d.Employees)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (d == null) return ApiResponse<DepartmentDto>.Fail("Department not found.");

        return ApiResponse<DepartmentDto>.Ok(new DepartmentDto
        {
            Id = d.Id,
            Name = d.Name,
            Code = d.Code,
            Description = d.Description,
            ManagerId = d.ManagerId,
            ManagerName = d.Manager != null ? $"{d.Manager.FirstName} {d.Manager.LastName}".Trim() : null,
            EmployeeCount = d.Employees.Count(e => e.IsActive),
            IsActive = d.IsActive
        });
    }

    public async Task<ApiResponse<DepartmentDto>> CreateDepartmentAsync(CreateDepartmentRequest request)
    {
        var exists = await _context.Departments.AnyAsync(d => d.Code.ToLower() == request.Code.ToLower());
        if (exists) return ApiResponse<DepartmentDto>.Fail("Department with this code already exists.");

        var dept = new Department
        {
            Name = request.Name.Trim(),
            Code = request.Code.Trim().ToUpper(),
            Description = request.Description?.Trim(),
            ManagerId = request.ManagerId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Departments.Add(dept);
        await _context.SaveChangesAsync();

        return await GetDepartmentByIdAsync(dept.Id);
    }

    public async Task<ApiResponse<DepartmentDto>> UpdateDepartmentAsync(int id, UpdateDepartmentRequest request)
    {
        var dept = await _context.Departments.FindAsync(id);
        if (dept == null) return ApiResponse<DepartmentDto>.Fail("Department not found.");

        dept.Name = request.Name.Trim();
        dept.Code = request.Code.Trim().ToUpper();
        dept.Description = request.Description?.Trim();
        dept.ManagerId = request.ManagerId;
        dept.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetDepartmentByIdAsync(id);
    }

    public async Task<ApiResponse> DeleteDepartmentAsync(int id)
    {
        var dept = await _context.Departments.FindAsync(id);
        if (dept == null) return ApiResponse.Fail("Department not found.");

        dept.IsActive = false;
        dept.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return ApiResponse.Ok("Department deactivated successfully.");
    }

    public async Task<ApiResponse<List<EmployeeDto>>> GetDepartmentEmployeesAsync(int departmentId)
    {
        var employees = await _context.Employees
            .Include(e => e.Designation)
            .Where(e => e.DepartmentId == departmentId && e.IsActive)
            .Select(e => new EmployeeDto
            {
                Id = e.Id,
                EmployeeCode = e.EmployeeCode,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Email = e.Email,
                Phone = e.Phone,
                DesignationTitle = e.Designation != null ? e.Designation.Title : null,
                Status = e.Status
            })
            .ToListAsync();

        return ApiResponse<List<EmployeeDto>>.Ok(employees);
    }

    public async Task<ApiResponse<List<OrgChartNodeDto>>> GetOrgChartAsync()
    {
        var depts = await _context.Departments
            .Include(d => d.Manager)
            .Include(d => d.Employees)
                .ThenInclude(e => e.Designation)
            .Where(d => d.IsActive)
            .ToListAsync();

        var nodes = depts.Select(d => new OrgChartNodeDto
        {
            Id = d.Id,
            Name = d.Name,
            Code = d.Code,
            ManagerName = d.Manager != null ? $"{d.Manager.FirstName} {d.Manager.LastName}".Trim() : null,
            Employees = d.Employees.Where(e => e.IsActive).Select(e => new EmployeeDto
            {
                Id = e.Id,
                EmployeeCode = e.EmployeeCode,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Email = e.Email,
                DesignationTitle = e.Designation?.Title,
                Status = e.Status
            }).ToList()
        }).ToList();

        return ApiResponse<List<OrgChartNodeDto>>.Ok(nodes);
    }
}

public class DesignationService : IDesignationService
{
    private readonly HrmsDbContext _context;

    public DesignationService(HrmsDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<DesignationDto>>> GetAllDesignationsAsync()
    {
        var list = await _context.Designations
            .Include(d => d.Employees)
            .Select(d => new DesignationDto
            {
                Id = d.Id,
                Title = d.Title,
                Level = d.Level,
                Description = d.Description,
                EmployeeCount = d.Employees.Count(e => e.IsActive),
                IsActive = d.IsActive
            })
            .OrderBy(d => d.Level)
            .ToListAsync();

        return ApiResponse<List<DesignationDto>>.Ok(list);
    }

    public async Task<ApiResponse<DesignationDto>> GetDesignationByIdAsync(int id)
    {
        var d = await _context.Designations
            .Include(d => d.Employees)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (d == null) return ApiResponse<DesignationDto>.Fail("Designation not found.");

        return ApiResponse<DesignationDto>.Ok(new DesignationDto
        {
            Id = d.Id,
            Title = d.Title,
            Level = d.Level,
            Description = d.Description,
            EmployeeCount = d.Employees.Count(e => e.IsActive),
            IsActive = d.IsActive
        });
    }

    public async Task<ApiResponse<DesignationDto>> CreateDesignationAsync(CreateDesignationRequest request)
    {
        var exists = await _context.Designations.AnyAsync(d => d.Title.ToLower() == request.Title.ToLower());
        if (exists) return ApiResponse<DesignationDto>.Fail("Designation with this title already exists.");

        var desig = new Designation
        {
            Title = request.Title.Trim(),
            Level = request.Level,
            Description = request.Description?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Designations.Add(desig);
        await _context.SaveChangesAsync();

        return await GetDesignationByIdAsync(desig.Id);
    }

    public async Task<ApiResponse<DesignationDto>> UpdateDesignationAsync(int id, UpdateDesignationRequest request)
    {
        var desig = await _context.Designations.FindAsync(id);
        if (desig == null) return ApiResponse<DesignationDto>.Fail("Designation not found.");

        desig.Title = request.Title.Trim();
        desig.Level = request.Level;
        desig.Description = request.Description?.Trim();
        desig.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetDesignationByIdAsync(id);
    }

    public async Task<ApiResponse> DeleteDesignationAsync(int id)
    {
        var desig = await _context.Designations.FindAsync(id);
        if (desig == null) return ApiResponse.Fail("Designation not found.");

        desig.IsActive = false;
        desig.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return ApiResponse.Ok("Designation deactivated successfully.");
    }
}
