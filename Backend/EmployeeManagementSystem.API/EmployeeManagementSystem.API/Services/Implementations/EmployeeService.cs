using System.Security.Claims;
using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.Data;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Employee;
using EmployeeManagementSystem.API.Models;
using EmployeeManagementSystem.API.Models.Enums;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using EmployeeEntity = EmployeeManagementSystem.API.Models.Employee;

namespace EmployeeManagementSystem.API.Services.Implementations
{
    public class EmployeeService : IEmployeeService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<EmployeeService> _logger;

        public EmployeeService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ILogger<EmployeeService> logger)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

        public async Task<ServiceResult<PagedResponse<EmployeeResponseDto>>> GetEmployeesAsync(
            EmployeeQueryParameters queryParameters,
            ClaimsPrincipal? user = null,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Employees.AsNoTracking().AsQueryable();

            var isCallerAdmin = user != null && (user.IsInRole(AppRoles.Admin) || user.IsInRole("ADMIN"));
            if (!isCallerAdmin)
            {
                query = query.Where(e => e.RoleId != 1 && (e.Role == null || e.Role.RoleName != "System Administrator"));
            }

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

            if (queryParameters.IsManager.HasValue && queryParameters.IsManager.Value)
            {
                query = query.Where(e => e.Role != null && (e.Role.RoleName == "Project Manager" || e.Role.RoleName.EndsWith(" Manager") || e.Role.RoleName == "Manager"));
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

        public async Task<ServiceResult<EmployeeResponseDto>> GetEmployeeByIdAsync(
            int id,
            ClaimsPrincipal? user = null,
            CancellationToken cancellationToken = default)
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

            if (employee is null)
            {
                return ServiceResult<EmployeeResponseDto>.NotFound("Employee was not found.");
            }

            if (user != null)
            {
                var isCallerAdmin = user.IsInRole(AppRoles.Admin) || user.IsInRole("ADMIN");
                var isSystemAdmin = employee.RoleId == 1 ||
                    string.Equals(employee.RoleName, "System Administrator", StringComparison.OrdinalIgnoreCase);

                if (!isCallerAdmin && isSystemAdmin)
                {
                    _logger.LogWarning("Unauthorized attempt by non-admin user to access System Administrator profile EmployeeId {EmployeeId}.", id);
                    return ServiceResult<EmployeeResponseDto>.Forbidden("HR specialists are not authorized to view System Administrator profiles.");
                }
            }

            return ServiceResult<EmployeeResponseDto>.Success(employee, "Employee retrieved successfully.");
        }

        public async Task<ServiceResult<EmployeeResponseDto>> GetMyProfileAsync(string userId, CancellationToken cancellationToken = default)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user is null)
            {
                return ServiceResult<EmployeeResponseDto>.NotFound("User account was not found.");
            }

            int? employeeId = user.EmployeeId;
            if (!employeeId.HasValue)
            {
                var emp = await _context.Employees
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.UserId == userId || e.Email == user.Email, cancellationToken);
                employeeId = emp?.EmployeeId;
            }

            if (!employeeId.HasValue)
            {
                return ServiceResult<EmployeeResponseDto>.NotFound("No employee profile is linked to this user account.");
            }

            return await GetEmployeeByIdAsync(employeeId.Value, cancellationToken: cancellationToken);
        }

        public async Task<ServiceResult<List<EmployeeResponseDto>>> GetManagerCandidatesAsync(CancellationToken cancellationToken = default)
        {
            var managers = await _context.Employees
                .Include(e => e.Role)
                .Include(e => e.Department)
                .AsNoTracking()
                .Where(e => e.EmploymentStatus != EmploymentStatus.Terminated 
                         && e.EmploymentStatus != EmploymentStatus.Resigned
                         && e.Role != null 
                         && (e.Role.RoleName == "Project Manager" 
                             || e.Role.RoleName.EndsWith(" Manager") 
                             || e.Role.RoleName == "Manager"))
                .OrderBy(e => e.FirstName)
                .ThenBy(e => e.LastName)
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

            return ServiceResult<List<EmployeeResponseDto>>.Success(managers, "Manager candidates retrieved successfully.");
        }

        public async Task<ServiceResult<List<RoleResponseDto>>> GetRolesAsync(bool includeAdminRole = true, CancellationToken cancellationToken = default)
        {
            var query = _context.AppRoles.AsNoTracking().Where(r => r.IsActive);
            if (!includeAdminRole)
            {
                query = query.Where(r => r.RoleName != "System Administrator");
            }

            var roles = await query
                .OrderBy(r => r.RoleId)
                .Select(r => new RoleResponseDto
                {
                    RoleId = r.RoleId,
                    RoleName = r.RoleName,
                    Description = r.Description
                })
                .ToListAsync(cancellationToken);

            return ServiceResult<List<RoleResponseDto>>.Success(roles, "Roles retrieved successfully.");
        }

        public async Task<ServiceResult<EmployeeResponseDto>> CreateEmployeeAsync(EmployeeCreateDto dto, ClaimsPrincipal? user = null, CancellationToken cancellationToken = default)
        {
            var isCallerAdmin = user != null && (user.IsInRole(AppRoles.Admin) || user.IsInRole("ADMIN"));
            var targetRole = await _context.AppRoles.FirstOrDefaultAsync(r => r.RoleId == dto.RoleId, cancellationToken);
            if (targetRole != null && targetRole.RoleName.Equals("System Administrator", StringComparison.OrdinalIgnoreCase))
            {
                if (!isCallerAdmin)
                {
                    _logger.LogWarning("Unauthorized attempt by non-admin user to assign System Administrator role during employee creation.");
                    return ServiceResult<EmployeeResponseDto>.Forbidden("HR specialists are not authorized to assign the System Administrator role.");
                }
            }

            var validationResult = await ValidateEmployeeDtoAsync(dto.EmployeeCode, dto.Email, dto.DepartmentId, dto.RoleId, dto.ManagerId, dto.DateOfBirth, dto.DateOfJoining, dto.Gender, dto.EmploymentStatus, null, cancellationToken);
            if (!validationResult.Succeeded)
            {
                return validationResult.Status == ServiceResultStatus.Conflict
                    ? ServiceResult<EmployeeResponseDto>.Conflict(validationResult.Message)
                    : ServiceResult<EmployeeResponseDto>.BadRequest(validationResult.Message);
            }

            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
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

                var normalizedEmail = dto.Email.Trim();
                var identityUser = new ApplicationUser
                {
                    UserName = normalizedEmail,
                    Email = normalizedEmail,
                    EmailConfirmed = true,
                    EmployeeId = employee.EmployeeId
                };

                var password = string.IsNullOrWhiteSpace(dto.Password) ? "Employee@123" : dto.Password.Trim();
                var userCreateResult = await _userManager.CreateAsync(identityUser, password);
                if (!userCreateResult.Succeeded)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    var errors = string.Join(" ", userCreateResult.Errors.Select(e => e.Description));
                    return ServiceResult<EmployeeResponseDto>.BadRequest($"Failed to create employee user account: {errors}");
                }

                if (!await _roleManager.RoleExistsAsync(AppRoles.Employee))
                {
                    await _roleManager.CreateAsync(new IdentityRole(AppRoles.Employee));
                }

                var addRoleResult = await _userManager.AddToRoleAsync(identityUser, AppRoles.Employee);
                if (!addRoleResult.Succeeded)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    var errors = string.Join(" ", addRoleResult.Errors.Select(e => e.Description));
                    return ServiceResult<EmployeeResponseDto>.BadRequest($"Failed to assign Employee role: {errors}");
                }

                employee.UserId = identityUser.Id;
                await _context.SaveChangesAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                var createdEmployee = await GetEmployeeByIdAsync(employee.EmployeeId, user, cancellationToken);
                return ServiceResult<EmployeeResponseDto>.Success(createdEmployee.Data!, "Employee created successfully.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Transaction failed while creating employee {EmployeeCode}.", dto.EmployeeCode);
                return ServiceResult<EmployeeResponseDto>.InternalError("An unexpected error occurred while creating the employee.");
            }
        }

        public async Task<ServiceResult<EmployeeResponseDto>> UpdateEmployeeAsync(int id, EmployeeUpdateDto dto, ClaimsPrincipal? user = null, CancellationToken cancellationToken = default)
        {
            var employee = await _context.Employees.Include(e => e.Role).FirstOrDefaultAsync(e => e.EmployeeId == id, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<EmployeeResponseDto>.NotFound("Employee was not found.");
            }

            var isCallerAdmin = user != null && (user.IsInRole(AppRoles.Admin) || user.IsInRole("ADMIN"));
            var targetRole = await _context.AppRoles.FirstOrDefaultAsync(r => r.RoleId == dto.RoleId, cancellationToken);
            if (targetRole != null && targetRole.RoleName.Equals("System Administrator", StringComparison.OrdinalIgnoreCase))
            {
                if (!isCallerAdmin)
                {
                    _logger.LogWarning("Unauthorized attempt by non-admin user to assign System Administrator role to EmployeeId {EmployeeId}.", id);
                    return ServiceResult<EmployeeResponseDto>.Forbidden("HR specialists are not authorized to assign the System Administrator role.");
                }
            }

            if (employee.Role != null && employee.Role.RoleName.Equals("System Administrator", StringComparison.OrdinalIgnoreCase))
            {
                if (!isCallerAdmin)
                {
                    _logger.LogWarning("Unauthorized attempt by non-admin user to modify System Administrator EmployeeId {EmployeeId}.", id);
                    return ServiceResult<EmployeeResponseDto>.Forbidden("HR specialists are not authorized to modify a System Administrator employee profile.");
                }
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

            // Also synchronize email with linked Identity user if applicable
            var linkedUser = await _userManager.Users.FirstOrDefaultAsync(u => u.EmployeeId == id, cancellationToken);
            if (linkedUser is not null && !string.Equals(linkedUser.Email, dto.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                linkedUser.Email = dto.Email.Trim();
                linkedUser.UserName = dto.Email.Trim();
                await _userManager.UpdateAsync(linkedUser);
            }

            var updatedEmployee = await GetEmployeeByIdAsync(id, user, cancellationToken);
            return ServiceResult<EmployeeResponseDto>.Success(updatedEmployee.Data!, "Employee updated successfully.");
        }

        public async Task<ServiceResult<EmployeeResponseDto>> UpdatePersonalDetailsAsync(
            int id,
            EmployeePersonalUpdateDto dto,
            ClaimsPrincipal? user = null,
            CancellationToken cancellationToken = default)
        {
            var employee = await _context.Employees
                .Include(e => e.Role)
                .FirstOrDefaultAsync(e => e.EmployeeId == id, cancellationToken);

            if (employee is null)
            {
                return ServiceResult<EmployeeResponseDto>.NotFound("Employee was not found.");
            }

            if (user != null)
            {
                var isCallerAdmin = user.IsInRole(AppRoles.Admin) || user.IsInRole("ADMIN");
                var isSystemAdmin = employee.RoleId == 1 ||
                    (employee.Role != null && string.Equals(employee.Role.RoleName, "System Administrator", StringComparison.OrdinalIgnoreCase));

                if (!isCallerAdmin && isSystemAdmin)
                {
                    _logger.LogWarning("Unauthorized attempt by non-admin user to update System Administrator personal details EmployeeId {EmployeeId}.", id);
                    return ServiceResult<EmployeeResponseDto>.Forbidden("HR specialists are not authorized to modify System Administrator personal details.");
                }
            }

            if (dto.DateOfBirth.HasValue && dto.DateOfBirth.Value.Date > DateTime.Today)
            {
                return ServiceResult<EmployeeResponseDto>.BadRequest("Date of birth cannot be in the future.");
            }

            employee.Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();
            employee.DateOfBirth = dto.DateOfBirth?.Date;
            employee.Gender = dto.Gender;
            employee.Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim();
            employee.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var updatedEmployee = await GetEmployeeByIdAsync(id, user, cancellationToken);
            return ServiceResult<EmployeeResponseDto>.Success(updatedEmployee.Data!, "Personal information updated successfully.");
        }

        public async Task<ServiceResult<bool>> DeleteEmployeeAsync(
            int id,
            ClaimsPrincipal? user = null,
            CancellationToken cancellationToken = default)
        {
            var employee = await _context.Employees
                .Include(e => e.Role)
                .FirstOrDefaultAsync(e => e.EmployeeId == id, cancellationToken);

            if (employee is null)
            {
                return ServiceResult<bool>.NotFound("Employee was not found.");
            }

            if (user != null)
            {
                var isCallerAdmin = user.IsInRole(AppRoles.Admin) || user.IsInRole("ADMIN");
                var isSystemAdmin = employee.RoleId == 1 ||
                    (employee.Role != null && string.Equals(employee.Role.RoleName, "System Administrator", StringComparison.OrdinalIgnoreCase));

                if (!isCallerAdmin && isSystemAdmin)
                {
                    _logger.LogWarning("Unauthorized attempt by non-admin user to delete System Administrator EmployeeId {EmployeeId}.", id);
                    return ServiceResult<bool>.Forbidden("HR specialists are not authorized to delete System Administrator profiles.");
                }
            }

            var deleteBlockReason = await GetDeleteBlockReasonAsync(id, cancellationToken);
            if (!string.IsNullOrWhiteSpace(deleteBlockReason))
            {
                return ServiceResult<bool>.Conflict(deleteBlockReason);
            }

            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var linkedUser = await _userManager.Users.FirstOrDefaultAsync(u => u.EmployeeId == id, cancellationToken);
                if (linkedUser is not null)
                {
                    var userDeleteResult = await _userManager.DeleteAsync(linkedUser);
                    if (!userDeleteResult.Succeeded)
                    {
                        await transaction.RollbackAsync(cancellationToken);
                        return ServiceResult<bool>.BadRequest("Failed to delete linked user account.");
                    }
                }

                _context.Employees.Remove(employee);
                await _context.SaveChangesAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);
                return ServiceResult<bool>.Success(true, "Employee deleted successfully.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Failed to delete employee {EmployeeId}.", id);
                return ServiceResult<bool>.InternalError("An unexpected error occurred while deleting the employee.");
            }
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

            var duplicateUserEmailExists = await _userManager.Users.AnyAsync(u =>
                u.Email == normalizedEmail &&
                (!currentEmployeeId.HasValue || u.EmployeeId != currentEmployeeId.Value), cancellationToken);

            if (duplicateUserEmailExists)
            {
                return ServiceResult<bool>.Conflict("A user account with this email already exists.");
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

                var manager = await _context.Employees
                    .Include(e => e.Role)
                    .FirstOrDefaultAsync(e => e.EmployeeId == managerId.Value, cancellationToken);

                if (manager is null)
                {
                    return ServiceResult<bool>.BadRequest("Selected manager does not exist.");
                }

                if (manager.EmploymentStatus == EmploymentStatus.Terminated || manager.EmploymentStatus == EmploymentStatus.Resigned)
                {
                    return ServiceResult<bool>.BadRequest("Selected reporting manager is inactive or no longer employed.");
                }

                var isManagerQualified = manager.Role != null && 
                    (manager.Role.RoleName.Equals("Project Manager", StringComparison.OrdinalIgnoreCase) ||
                     manager.Role.RoleName.EndsWith(" Manager", StringComparison.OrdinalIgnoreCase) ||
                     manager.Role.RoleName.Equals("Manager", StringComparison.OrdinalIgnoreCase));

                if (!isManagerQualified)
                {
                    return ServiceResult<bool>.BadRequest($"Employee '{manager.FullName}' with role '{manager.Role?.RoleName}' does not qualify as a Reporting Manager. Only employees with a managerial role can be assigned as Reporting Manager.");
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

            return null;
        }
    }
}
