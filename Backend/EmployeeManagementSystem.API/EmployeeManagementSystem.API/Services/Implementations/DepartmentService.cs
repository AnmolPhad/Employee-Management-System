using EmployeeManagementSystem.API.Data;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Department;
using EmployeeManagementSystem.API.Models;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.API.Services.Implementations
{
    public class DepartmentService : IDepartmentService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DepartmentService> _logger;

        public DepartmentService(ApplicationDbContext context, ILogger<DepartmentService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ServiceResult<PagedResponse<DepartmentResponseDto>>> GetDepartmentsAsync(
            DepartmentQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Departments.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(queryParameters.Search))
            {
                var search = queryParameters.Search.Trim();
                query = query.Where(d =>
                    d.DepartmentName.Contains(search) ||
                    (d.Location != null && d.Location.Contains(search)) ||
                    (d.Description != null && d.Description.Contains(search)));
            }

            if (queryParameters.IsActive.HasValue)
            {
                query = query.Where(d => d.IsActive == queryParameters.IsActive.Value);
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var departments = await query
                .OrderBy(d => d.DepartmentName)
                .Skip((queryParameters.Page - 1) * queryParameters.PageSize)
                .Take(queryParameters.PageSize)
                .Select(d => new DepartmentResponseDto
                {
                    DepartmentId = d.DepartmentId,
                    DepartmentName = d.DepartmentName,
                    Description = d.Description,
                    Location = d.Location,
                    DepartmentHeadId = d.DepartmentHeadId,
                    DepartmentHeadName = d.DepartmentHead != null
                        ? (d.DepartmentHead.FirstName + " " + d.DepartmentHead.LastName).Trim()
                        : null,
                    DepartmentHeadEmail = d.DepartmentHead != null
                        ? d.DepartmentHead.Email
                        : null,
                    EmployeeCount = d.Employees.Count(),
                    IsActive = d.IsActive,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                })
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<DepartmentResponseDto>
            {
                Items = departments,
                Page = queryParameters.Page,
                PageSize = queryParameters.PageSize,
                TotalCount = totalCount,
                TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)queryParameters.PageSize)
            };

            return ServiceResult<PagedResponse<DepartmentResponseDto>>.Success(response, "Departments retrieved successfully.");
        }

        public async Task<ServiceResult<DepartmentResponseDto>> GetDepartmentByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var department = await _context.Departments
                .AsNoTracking()
                .Where(d => d.DepartmentId == id)
                .Select(d => new DepartmentResponseDto
                {
                    DepartmentId = d.DepartmentId,
                    DepartmentName = d.DepartmentName,
                    Description = d.Description,
                    Location = d.Location,
                    DepartmentHeadId = d.DepartmentHeadId,
                    DepartmentHeadName = d.DepartmentHead != null
                        ? (d.DepartmentHead.FirstName + " " + d.DepartmentHead.LastName).Trim()
                        : null,
                    DepartmentHeadEmail = d.DepartmentHead != null
                        ? d.DepartmentHead.Email
                        : null,
                    EmployeeCount = d.Employees.Count(),
                    IsActive = d.IsActive,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                })
                .FirstOrDefaultAsync(cancellationToken);

            return department is null
                ? ServiceResult<DepartmentResponseDto>.NotFound("Department was not found.")
                : ServiceResult<DepartmentResponseDto>.Success(department, "Department retrieved successfully.");
        }

        public async Task<ServiceResult<DepartmentResponseDto>> CreateDepartmentAsync(DepartmentCreateDto dto, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(dto.DepartmentName))
            {
                return ServiceResult<DepartmentResponseDto>.BadRequest("Department name is required.");
            }

            var normalizedName = dto.DepartmentName.Trim();
            var duplicateExists = await _context.Departments
                .AnyAsync(d => d.DepartmentName == normalizedName, cancellationToken);

            if (duplicateExists)
            {
                return ServiceResult<DepartmentResponseDto>.Conflict("A department with this name already exists.");
            }

            if (dto.DepartmentHeadId.HasValue)
            {
                var headExists = await _context.Employees
                    .AnyAsync(e => e.EmployeeId == dto.DepartmentHeadId.Value, cancellationToken);

                if (!headExists)
                {
                    return ServiceResult<DepartmentResponseDto>.BadRequest("The specified Department Head does not exist.");
                }
            }

            var department = new Department
            {
                DepartmentName = normalizedName,
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                Location = string.IsNullOrWhiteSpace(dto.Location) ? null : dto.Location.Trim(),
                DepartmentHeadId = dto.DepartmentHeadId,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Department {DepartmentName} (ID: {DepartmentId}) created successfully.", department.DepartmentName, department.DepartmentId);

            var createdDepartment = await GetDepartmentByIdAsync(department.DepartmentId, cancellationToken);
            return ServiceResult<DepartmentResponseDto>.Success(createdDepartment.Data!, "Department created successfully.");
        }

        public async Task<ServiceResult<DepartmentResponseDto>> UpdateDepartmentAsync(int id, DepartmentUpdateDto dto, CancellationToken cancellationToken = default)
        {
            var department = await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentId == id, cancellationToken);

            if (department is null)
            {
                return ServiceResult<DepartmentResponseDto>.NotFound("Department was not found.");
            }

            if (string.IsNullOrWhiteSpace(dto.DepartmentName))
            {
                return ServiceResult<DepartmentResponseDto>.BadRequest("Department name is required.");
            }

            var normalizedName = dto.DepartmentName.Trim();
            var duplicateExists = await _context.Departments
                .AnyAsync(d => d.DepartmentName == normalizedName && d.DepartmentId != id, cancellationToken);

            if (duplicateExists)
            {
                return ServiceResult<DepartmentResponseDto>.Conflict("A department with this name already exists.");
            }

            if (dto.DepartmentHeadId.HasValue)
            {
                var headExists = await _context.Employees
                    .AnyAsync(e => e.EmployeeId == dto.DepartmentHeadId.Value, cancellationToken);

                if (!headExists)
                {
                    return ServiceResult<DepartmentResponseDto>.BadRequest("The specified Department Head does not exist.");
                }
            }

            department.DepartmentName = normalizedName;
            department.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            department.Location = string.IsNullOrWhiteSpace(dto.Location) ? null : dto.Location.Trim();
            department.DepartmentHeadId = dto.DepartmentHeadId;
            department.IsActive = dto.IsActive;
            department.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Department ID {DepartmentId} updated successfully.", id);

            var updatedDepartment = await GetDepartmentByIdAsync(id, cancellationToken);
            return ServiceResult<DepartmentResponseDto>.Success(updatedDepartment.Data!, "Department updated successfully.");
        }

        public async Task<ServiceResult<bool>> DeleteDepartmentAsync(int id, CancellationToken cancellationToken = default)
        {
            var department = await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentId == id, cancellationToken);

            if (department is null)
            {
                return ServiceResult<bool>.NotFound("Department was not found.");
            }

            var hasEmployees = await _context.Employees
                .AnyAsync(e => e.DepartmentId == id, cancellationToken);

            if (hasEmployees)
            {
                return ServiceResult<bool>.Conflict("Department cannot be deleted because employees are currently assigned to it.");
            }

            // Unlink DepartmentHead before deletion to ensure safe FK handling
            department.DepartmentHeadId = null;
            await _context.SaveChangesAsync(cancellationToken);

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Department ID {DepartmentId} deleted successfully.", id);

            return ServiceResult<bool>.Success(true, "Department deleted successfully.");
        }
    }
}
