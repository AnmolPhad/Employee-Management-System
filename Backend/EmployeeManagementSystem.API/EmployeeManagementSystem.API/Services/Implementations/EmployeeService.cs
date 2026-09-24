using EmployeeManagementSystem.API.Data;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Employee;
using EmployeeManagementSystem.API.Models.Enums;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using EmployeeEntity = EmployeeManagementSystem.API.Models.Employee;

namespace EmployeeManagementSystem.API.Services.Implementations
{
    public class EmployeeService : IEmployeeService
    {
        private readonly ApplicationDbContext _context;

        public EmployeeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult<PagedResponse<EmployeeResponseDto>>> GetEmployeesAsync(
            EmployeeQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Employees.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(queryParameters.Search))
            {
                var search = queryParameters.Search.Trim();
                query = query.Where(e =>
                    e.EmployeeCode.Contains(search) ||
                    e.FirstName.Contains(search) ||
                    e.LastName.Contains(search) ||
                    e.Email.Contains(search) ||
                    (e.Phone != null && e.Phone.Contains(search)));
            }

            if (queryParameters.DepartmentId.HasValue)
            {
                query = query.Where(e => e.DepartmentId == queryParameters.DepartmentId.Value);
            }

            if (queryParameters.RoleId.HasValue)
            {
                query = query.Where(e => e.RoleId == queryParameters.RoleId.Value);
            }

            if (queryParameters.Status.HasValue)
            {
                query = query.Where(e => e.EmploymentStatus == queryParameters.Status.Value);
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var employees = await query
                .OrderBy(e => e.EmployeeCode)
                .Skip((queryParameters.Page - 1) * queryParameters.PageSize)
                .Take(queryParameters.PageSize)
                .Select(e => new EmployeeResponseDto
                {
                    EmployeeId = e.EmployeeId,
                    EmployeeCode = e.EmployeeCode,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    FullName = (e.FirstName + " " + e.LastName).Trim(),
                    Email = e.Email,
                    Phone = e.Phone,
                    DateOfBirth = e.DateOfBirth,
                    Gender = e.Gender,
                    Address = e.Address,
                    DateOfJoining = e.DateOfJoining,
                    DepartmentId = e.DepartmentId,
                    DepartmentName = e.Department != null ? e.Department.DepartmentName : null,
                    RoleId = e.RoleId,
                    RoleName = e.Role != null ? e.Role.RoleName : null,
                    ManagerId = e.ManagerId,
                    ManagerName = e.Manager != null ? (e.Manager.FirstName + " " + e.Manager.LastName).Trim() : null,
                    EmploymentStatus = e.EmploymentStatus,
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt
                })
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<EmployeeResponseDto>
            {
                Items = employees,
                Page = queryParameters.Page,
                PageSize = queryParameters.PageSize,
                TotalCount = totalCount,
                TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)queryParameters.PageSize)
            };

            return ServiceResult<PagedResponse<EmployeeResponseDto>>.Success(response, "Employees retrieved successfully.");
        }

        public async Task<ServiceResult<EmployeeResponseDto>> GetEmployeeByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var employee = await _context.Employees
                .AsNoTracking()
                .Where(e => e.EmployeeId == id)
                .Select(e => new EmployeeResponseDto
                {
                    EmployeeId = e.EmployeeId,
                    EmployeeCode = e.EmployeeCode,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    FullName = (e.FirstName + " " + e.LastName).Trim(),
                    Email = e.Email,
                    Phone = e.Phone,
                    DateOfBirth = e.DateOfBirth,
                    Gender = e.Gender,
                    Address = e.Address,
                    DateOfJoining = e.DateOfJoining,
                    DepartmentId = e.DepartmentId,
                    DepartmentName = e.Department != null ? e.Department.DepartmentName : null,
                    RoleId = e.RoleId,
                    RoleName = e.Role != null ? e.Role.RoleName : null,
                    ManagerId = e.ManagerId,
                    ManagerName = e.Manager != null ? (e.Manager.FirstName + " " + e.Manager.LastName).Trim() : null,
                    EmploymentStatus = e.EmploymentStatus,
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt
                })
                .FirstOrDefaultAsync(cancellationToken);

            return employee is null
                ? ServiceResult<EmployeeResponseDto>.NotFound("Employee was not found.")
                : ServiceResult<EmployeeResponseDto>.Success(employee, "Employee retrieved successfully.");
        }

        public async Task<ServiceResult<EmployeeResponseDto>> CreateEmployeeAsync(EmployeeCreateDto dto, CancellationToken cancellationToken = default)
        {
            var validationResult = await ValidateEmployeeDtoAsync(dto.EmployeeCode, dto.Email, dto.DepartmentId, dto.RoleId, dto.ManagerId, dto.DateOfBirth, dto.DateOfJoining, dto.Gender, dto.EmploymentStatus, null, cancellationToken);
            if (!validationResult.Succeeded)
            {
                return validationResult.Status == ServiceResultStatus.Conflict
                    ? ServiceResult<EmployeeResponseDto>.Conflict(validationResult.Message)
                    : ServiceResult<EmployeeResponseDto>.BadRequest(validationResult.Message);
            }

            var employee = new EmployeeEntity
            {
                EmployeeCode = dto.EmployeeCode.Trim(),
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Email = dto.Email.Trim(),
                Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
                DateOfBirth = dto.DateOfBirth,
                Gender = dto.Gender,
                Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim(),
                DateOfJoining = dto.DateOfJoining.Date,
                DepartmentId = dto.DepartmentId,
                RoleId = dto.RoleId,
                ManagerId = dto.ManagerId,
                EmploymentStatus = dto.EmploymentStatus,
                CreatedAt = DateTime.UtcNow
            };

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync(cancellationToken);

            var createdEmployee = await GetEmployeeByIdAsync(employee.EmployeeId, cancellationToken);
            return ServiceResult<EmployeeResponseDto>.Success(createdEmployee.Data!, "Employee created successfully.");
        }

        public async Task<ServiceResult<EmployeeResponseDto>> UpdateEmployeeAsync(int id, EmployeeUpdateDto dto, CancellationToken cancellationToken = default)
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == id, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<EmployeeResponseDto>.NotFound("Employee was not found.");
            }

            var validationResult = await ValidateEmployeeDtoAsync(dto.EmployeeCode, dto.Email, dto.DepartmentId, dto.RoleId, dto.ManagerId, dto.DateOfBirth, dto.DateOfJoining, dto.Gender, dto.EmploymentStatus, id, cancellationToken);
            if (!validationResult.Succeeded)
            {
                return validationResult.Status == ServiceResultStatus.Conflict
                    ? ServiceResult<EmployeeResponseDto>.Conflict(validationResult.Message)
                    : ServiceResult<EmployeeResponseDto>.BadRequest(validationResult.Message);
            }

            employee.EmployeeCode = dto.EmployeeCode.Trim();
            employee.FirstName = dto.FirstName.Trim();
            employee.LastName = dto.LastName.Trim();
            employee.Email = dto.Email.Trim();
            employee.Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();
            employee.DateOfBirth = dto.DateOfBirth;
            employee.Gender = dto.Gender;
            employee.Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim();
            employee.DateOfJoining = dto.DateOfJoining.Date;
            employee.DepartmentId = dto.DepartmentId;
            employee.RoleId = dto.RoleId;
            employee.ManagerId = dto.ManagerId;
            employee.EmploymentStatus = dto.EmploymentStatus;
            employee.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var updatedEmployee = await GetEmployeeByIdAsync(id, cancellationToken);
            return ServiceResult<EmployeeResponseDto>.Success(updatedEmployee.Data!, "Employee updated successfully.");
        }

        public async Task<ServiceResult<bool>> DeleteEmployeeAsync(int id, CancellationToken cancellationToken = default)
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == id, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<bool>.NotFound("Employee was not found.");
            }

            var deleteBlockReason = await GetDeleteBlockReasonAsync(id, cancellationToken);
            if (!string.IsNullOrWhiteSpace(deleteBlockReason))
            {
                return ServiceResult<bool>.Conflict(deleteBlockReason);
            }

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync(cancellationToken);

            return ServiceResult<bool>.Success(true, "Employee deleted successfully.");
        }

        private async Task<ServiceResult<bool>> ValidateEmployeeDtoAsync(
            string employeeCode,
            string email,
            int departmentId,
            int roleId,
            int? managerId,
            DateTime? dateOfBirth,
            DateTime dateOfJoining,
            Gender? gender,
            EmploymentStatus employmentStatus,
            int? currentEmployeeId,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                return ServiceResult<bool>.BadRequest("Employee code is required.");
            }

            if (string.IsNullOrWhiteSpace(email))
            {
                return ServiceResult<bool>.BadRequest("Email is required.");
            }

            if (dateOfJoining == default)
            {
                return ServiceResult<bool>.BadRequest("Date of joining is required.");
            }

            if (dateOfBirth.HasValue && dateOfBirth.Value.Date > DateTime.UtcNow.Date)
            {
                return ServiceResult<bool>.BadRequest("Date of birth cannot be in the future.");
            }

            if (gender.HasValue && !Enum.IsDefined(typeof(Gender), gender.Value))
            {
                return ServiceResult<bool>.BadRequest("Invalid gender value.");
            }

            if (!Enum.IsDefined(typeof(EmploymentStatus), employmentStatus))
            {
                return ServiceResult<bool>.BadRequest("Invalid employment status value.");
            }

            var normalizedEmployeeCode = employeeCode.Trim();
            var normalizedEmail = email.Trim();

            var duplicateEmployeeCodeExists = await _context.Employees.AnyAsync(e =>
                e.EmployeeCode == normalizedEmployeeCode &&
                (!currentEmployeeId.HasValue || e.EmployeeId != currentEmployeeId.Value), cancellationToken);

            if (duplicateEmployeeCodeExists)
            {
                return ServiceResult<bool>.Conflict("An employee with this employee code already exists.");
            }

            var duplicateEmailExists = await _context.Employees.AnyAsync(e =>
                e.Email == normalizedEmail &&
                (!currentEmployeeId.HasValue || e.EmployeeId != currentEmployeeId.Value), cancellationToken);

            if (duplicateEmailExists)
            {
                return ServiceResult<bool>.Conflict("An employee with this email already exists.");
            }

            var departmentExists = await _context.Departments.AnyAsync(d => d.DepartmentId == departmentId, cancellationToken);
            if (!departmentExists)
            {
                return ServiceResult<bool>.BadRequest("Department does not exist.");
            }

            var roleExists = await _context.AppRoles.AnyAsync(r => r.RoleId == roleId, cancellationToken);
            if (!roleExists)
            {
                return ServiceResult<bool>.BadRequest("Role does not exist.");
            }

            if (managerId.HasValue)
            {
                if (currentEmployeeId.HasValue && managerId.Value == currentEmployeeId.Value)
                {
                    return ServiceResult<bool>.BadRequest("An employee cannot be their own manager.");
                }

                var managerExists = await _context.Employees.AnyAsync(e => e.EmployeeId == managerId.Value, cancellationToken);
                if (!managerExists)
                {
                    return ServiceResult<bool>.BadRequest("Manager does not exist.");
                }
            }

            return ServiceResult<bool>.Success(true, "Employee data is valid.");
        }

        private async Task<string?> GetDeleteBlockReasonAsync(int employeeId, CancellationToken cancellationToken)
        {
            if (await _context.Employees.AnyAsync(e => e.ManagerId == employeeId, cancellationToken))
            {
                return "Employee cannot be deleted because they are assigned as a manager for other employees.";
            }

            if (await _context.Departments.AnyAsync(d => d.DepartmentHeadId == employeeId, cancellationToken))
            {
                return "Employee cannot be deleted because they are assigned as a department head.";
            }

            if (await _context.Projects.AnyAsync(p => p.ProjectManagerId == employeeId, cancellationToken))
            {
                return "Employee cannot be deleted because they are assigned as a project manager.";
            }

            if (await _context.ProjectAssignments.AnyAsync(pa => pa.EmployeeId == employeeId, cancellationToken))
            {
                return "Employee cannot be deleted because project assignments exist for this employee.";
            }

            if (await _context.Attendances.AnyAsync(a => a.EmployeeId == employeeId, cancellationToken))
            {
                return "Employee cannot be deleted because attendance history exists for this employee.";
            }

            if (await _context.Leaves.AnyAsync(l => l.EmployeeId == employeeId || l.ApprovedById == employeeId, cancellationToken))
            {
                return "Employee cannot be deleted because leave records reference this employee.";
            }

            if (await _context.Salaries.AnyAsync(s => s.EmployeeId == employeeId, cancellationToken))
            {
                return "Employee cannot be deleted because salary history exists for this employee.";
            }

            if (await _context.Performances.AnyAsync(p => p.EmployeeId == employeeId || p.ReviewedById == employeeId, cancellationToken))
            {
                return "Employee cannot be deleted because performance records reference this employee.";
            }

            if (await _context.Tickets.AnyAsync(t => t.EmployeeId == employeeId || t.AssignedToId == employeeId, cancellationToken))
            {
                return "Employee cannot be deleted because tickets reference this employee.";
            }

            if (await _context.Users.AnyAsync(u => u.EmployeeId == employeeId, cancellationToken))
            {
                return "Employee cannot be deleted because an application user account is linked to this employee.";
            }

            return null;
        }
    }
}
