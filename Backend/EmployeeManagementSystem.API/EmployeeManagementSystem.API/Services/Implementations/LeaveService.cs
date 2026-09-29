using System.Data;
using System.Security.Claims;
using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.Data;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Leave;
using EmployeeManagementSystem.API.Models;
using EmployeeManagementSystem.API.Models.Enums;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.API.Services.Implementations
{
    public class LeaveService : ILeaveService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<LeaveService> _logger;
        private readonly ITicketService _ticketService;

        public LeaveService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<LeaveService> logger,
            ITicketService ticketService)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
            _ticketService = ticketService;
        }

        public async Task<ServiceResult<LeaveResponseDto>> ApplyLeaveAsync(
            ClaimsPrincipal userPrincipal,
            LeaveCreateDto dto,
            CancellationToken cancellationToken = default)
        {
            var employee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<LeaveResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            if (employee.EmploymentStatus == EmploymentStatus.Resigned || employee.EmploymentStatus == EmploymentStatus.Terminated)
            {
                return ServiceResult<LeaveResponseDto>.BadRequest("Inactive or terminated employees cannot apply for leave.");
            }

            var leaveType = await _context.LeaveTypes
                .AsNoTracking()
                .FirstOrDefaultAsync(lt => lt.LeaveTypeId == dto.LeaveTypeId, cancellationToken);

            if (leaveType is null || !leaveType.IsActive)
            {
                return ServiceResult<LeaveResponseDto>.BadRequest("The specified Leave Type was not found or is currently inactive.");
            }

            var startDate = dto.StartDate.Date;
            var endDate = dto.EndDate.Date;

            if (endDate < startDate)
            {
                return ServiceResult<LeaveResponseDto>.BadRequest("End Date cannot be before Start Date.");
            }

            var totalDays = (endDate - startDate).Days + 1;

            if (string.IsNullOrWhiteSpace(dto.Reason))
            {
                return ServiceResult<LeaveResponseDto>.BadRequest("A reason for the leave application is required.");
            }

            // Hierarchy readiness check: normal employee must have a reporting manager assigned
            var applicantTier = await GetEmployeeTierAsync(employee, cancellationToken);
            if (applicantTier == AppRoles.Employee)
            {
                if (!employee.ManagerId.HasValue)
                {
                    return ServiceResult<LeaveResponseDto>.BadRequest(
                        "You do not have a reporting manager assigned to approve your leave request. Please contact HR or your administrator.");
                }

                var managerExists = await _context.Employees
                    .AsNoTracking()
                    .AnyAsync(e => e.EmployeeId == employee.ManagerId.Value &&
                                   e.EmploymentStatus != EmploymentStatus.Resigned &&
                                   e.EmploymentStatus != EmploymentStatus.Terminated, cancellationToken);

                if (!managerExists)
                {
                    return ServiceResult<LeaveResponseDto>.BadRequest(
                        "Your assigned reporting manager does not exist or is inactive. Please contact HR.");
                }
            }

            // Concurrency-safe transaction: serialize requests for this employee
            using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT EmployeeId FROM Employees WITH (UPDLOCK, ROWLOCK) WHERE EmployeeId = {employee.EmployeeId}",
                    cancellationToken);

                // Overlap validation: Pending or Approved leave blocks overlapping dates
                var overlappingExists = await _context.Leaves
                    .AnyAsync(l => l.EmployeeId == employee.EmployeeId &&
                                   (l.Status == LeaveStatus.Pending || l.Status == LeaveStatus.Approved) &&
                                   l.StartDate <= endDate && l.EndDate >= startDate, cancellationToken);

                if (overlappingExists)
                {
                    _logger.LogWarning("Leave application rejected for EmployeeId {EmployeeId}: Overlapping dates between {StartDate:yyyy-MM-dd} and {EndDate:yyyy-MM-dd}.",
                        employee.EmployeeId, startDate, endDate);

                    return ServiceResult<LeaveResponseDto>.Conflict(
                        "Leave has already been applied for one or more dates in the requested period.");
                }

                // Balance validation per affected calendar year
                var startYear = startDate.Year;
                var endYear = endDate.Year;

                for (var y = startYear; y <= endYear; y++)
                {
                    var requestedDaysInYear = CalculateDaysInYear(startDate, endDate, y);
                    if (requestedDaysInYear <= 0) continue;

                    var yearStart = new DateTime(y, 1, 1);
                    var yearEnd = new DateTime(y, 12, 31);

                    var leavesInYear = await _context.Leaves
                        .AsNoTracking()
                        .Where(l => l.EmployeeId == employee.EmployeeId &&
                                    l.LeaveTypeId == leaveType.LeaveTypeId &&
                                    (l.Status == LeaveStatus.Pending || l.Status == LeaveStatus.Approved) &&
                                    l.StartDate <= yearEnd && l.EndDate >= yearStart)
                        .Select(l => new { l.StartDate, l.EndDate, l.Status })
                        .ToListAsync(cancellationToken);

                    var pendingDaysInYear = leavesInYear
                        .Where(l => l.Status == LeaveStatus.Pending)
                        .Sum(l => CalculateDaysInYear(l.StartDate, l.EndDate, y));

                    var approvedDaysInYear = leavesInYear
                        .Where(l => l.Status == LeaveStatus.Approved)
                        .Sum(l => CalculateDaysInYear(l.StartDate, l.EndDate, y));

                    var availableDaysInYear = leaveType.MaxDaysPerYear - pendingDaysInYear - approvedDaysInYear;

                    if (requestedDaysInYear > availableDaysInYear)
                    {
                        _logger.LogWarning("Leave application rejected for EmployeeId {EmployeeId}: Insufficient balance for LeaveTypeId {LeaveTypeId} in {Year}. Requested: {RequestedDays}, Available: {AvailableDays}.",
                            employee.EmployeeId, leaveType.LeaveTypeId, y, requestedDaysInYear, availableDaysInYear);

                        return ServiceResult<LeaveResponseDto>.BadRequest(
                            $"Insufficient leave balance for {leaveType.LeaveTypeName} in year {y}. Requested: {requestedDaysInYear} day(s), Available: {availableDaysInYear} day(s).");
                    }
                }

                var leave = new Leave
                {
                    EmployeeId = employee.EmployeeId,
                    LeaveTypeId = leaveType.LeaveTypeId,
                    StartDate = startDate,
                    EndDate = endDate,
                    TotalDays = totalDays,
                    Reason = dto.Reason.Trim(),
                    Status = LeaveStatus.Pending,
                    AppliedDate = DateTime.UtcNow
                };

                _context.Leaves.Add(leave);
                await _context.SaveChangesAsync(cancellationToken);

                // Automatically create and route the leave approval ticket within the same transaction
                await _ticketService.CreateTicketForLeaveAsync(leave, employee, leaveType, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Leave application created successfully. LeaveId: {LeaveId}, EmployeeId: {EmployeeId}, LeaveTypeId: {LeaveTypeId}, StartDate: {StartDate:yyyy-MM-dd}, EndDate: {EndDate:yyyy-MM-dd}, TotalDays: {TotalDays}.",
                    leave.LeaveId, employee.EmployeeId, leave.LeaveTypeId, leave.StartDate, leave.EndDate, leave.TotalDays);

                var responseDto = await ProjectToResponseDtoAsync(leave.LeaveId, cancellationToken);
                return ServiceResult<LeaveResponseDto>.Success(responseDto!, "Leave applied successfully.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "An error occurred while creating leave for EmployeeId {EmployeeId}.", employee.EmployeeId);
                throw;
            }
        }

        public async Task<ServiceResult<PagedResponse<LeaveResponseDto>>> GetMyLeavesAsync(
            ClaimsPrincipal userPrincipal,
            LeaveQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            var employee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<PagedResponse<LeaveResponseDto>>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var query = _context.Leaves
                .AsNoTracking()
                .Where(l => l.EmployeeId == employee.EmployeeId);

            if (queryParameters.Status.HasValue)
            {
                query = query.Where(l => l.Status == queryParameters.Status.Value);
            }

            if (queryParameters.LeaveTypeId.HasValue)
            {
                query = query.Where(l => l.LeaveTypeId == queryParameters.LeaveTypeId.Value);
            }

            if (queryParameters.StartDate.HasValue)
            {
                query = query.Where(l => l.StartDate >= queryParameters.StartDate.Value.Date);
            }

            if (queryParameters.EndDate.HasValue)
            {
                query = query.Where(l => l.EndDate <= queryParameters.EndDate.Value.Date);
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(l => l.AppliedDate)
                .Skip((queryParameters.Page - 1) * queryParameters.PageSize)
                .Take(queryParameters.PageSize)
                .Select(l => new LeaveResponseDto
                {
                    LeaveId = l.LeaveId,
                    EmployeeId = l.EmployeeId,
                    EmployeeCode = l.Employee!.EmployeeCode,
                    EmployeeName = (l.Employee.FirstName + " " + l.Employee.LastName).Trim(),
                    EmployeeEmail = l.Employee.Email,
                    DepartmentName = l.Employee.Department != null ? l.Employee.Department.DepartmentName : null,
                    LeaveTypeId = l.LeaveTypeId,
                    LeaveTypeName = l.LeaveType != null ? l.LeaveType.LeaveTypeName : string.Empty,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    TotalDays = l.TotalDays,
                    Reason = l.Reason,
                    Status = l.Status,
                    AppliedDate = l.AppliedDate,
                    ApprovedById = l.ApprovedById,
                    ApprovedByName = l.ApprovedBy != null ? (l.ApprovedBy.FirstName + " " + l.ApprovedBy.LastName).Trim() : null,
                    ApprovedByEmail = l.ApprovedBy != null ? l.ApprovedBy.Email : null,
                    ApprovedDate = l.ApprovedDate,
                    RejectionReason = l.RejectionReason
                })
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<LeaveResponseDto>
            {
                Items = items,
                Page = queryParameters.Page,
                PageSize = queryParameters.PageSize,
                TotalCount = totalCount,
                TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)queryParameters.PageSize)
            };

            return ServiceResult<PagedResponse<LeaveResponseDto>>.Success(response, "My leave history retrieved successfully.");
        }

        public async Task<ServiceResult<LeaveResponseDto>> GetMyLeaveByIdAsync(
            ClaimsPrincipal userPrincipal,
            int leaveId,
            CancellationToken cancellationToken = default)
        {
            var employee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<LeaveResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var leave = await _context.Leaves
                .AsNoTracking()
                .Where(l => l.LeaveId == leaveId && l.EmployeeId == employee.EmployeeId)
                .Select(l => new LeaveResponseDto
                {
                    LeaveId = l.LeaveId,
                    EmployeeId = l.EmployeeId,
                    EmployeeCode = l.Employee!.EmployeeCode,
                    EmployeeName = (l.Employee.FirstName + " " + l.Employee.LastName).Trim(),
                    EmployeeEmail = l.Employee.Email,
                    DepartmentName = l.Employee.Department != null ? l.Employee.Department.DepartmentName : null,
                    LeaveTypeId = l.LeaveTypeId,
                    LeaveTypeName = l.LeaveType != null ? l.LeaveType.LeaveTypeName : string.Empty,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    TotalDays = l.TotalDays,
                    Reason = l.Reason,
                    Status = l.Status,
                    AppliedDate = l.AppliedDate,
                    ApprovedById = l.ApprovedById,
                    ApprovedByName = l.ApprovedBy != null ? (l.ApprovedBy.FirstName + " " + l.ApprovedBy.LastName).Trim() : null,
                    ApprovedByEmail = l.ApprovedBy != null ? l.ApprovedBy.Email : null,
                    ApprovedDate = l.ApprovedDate,
                    RejectionReason = l.RejectionReason
                })
                .FirstOrDefaultAsync(cancellationToken);

            return leave is null
                ? ServiceResult<LeaveResponseDto>.NotFound("Leave request was not found.")
                : ServiceResult<LeaveResponseDto>.Success(leave, "Leave request retrieved successfully.");
        }

        public async Task<ServiceResult<IReadOnlyList<LeaveBalanceResponseDto>>> GetMyLeaveBalanceAsync(
            ClaimsPrincipal userPrincipal,
            int? year = null,
            CancellationToken cancellationToken = default)
        {
            var employee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<IReadOnlyList<LeaveBalanceResponseDto>>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var targetYear = year ?? DateTime.UtcNow.Year;
            var yearStart = new DateTime(targetYear, 1, 1);
            var yearEnd = new DateTime(targetYear, 12, 31);

            var leaveTypes = await _context.LeaveTypes
                .AsNoTracking()
                .Where(lt => lt.IsActive)
                .OrderBy(lt => lt.LeaveTypeId)
                .ToListAsync(cancellationToken);

            var employeeLeavesInYear = await _context.Leaves
                .AsNoTracking()
                .Where(l => l.EmployeeId == employee.EmployeeId &&
                            l.StartDate <= yearEnd && l.EndDate >= yearStart)
                .Select(l => new { l.LeaveTypeId, l.StartDate, l.EndDate, l.Status })
                .ToListAsync(cancellationToken);

            var balances = new List<LeaveBalanceResponseDto>();

            foreach (var lt in leaveTypes)
            {
                var typeLeaves = employeeLeavesInYear.Where(l => l.LeaveTypeId == lt.LeaveTypeId).ToList();

                var pendingDays = typeLeaves
                    .Where(l => l.Status == LeaveStatus.Pending)
                    .Sum(l => CalculateDaysInYear(l.StartDate, l.EndDate, targetYear));

                var approvedDays = typeLeaves
                    .Where(l => l.Status == LeaveStatus.Approved)
                    .Sum(l => CalculateDaysInYear(l.StartDate, l.EndDate, targetYear));

                var rejectedDays = typeLeaves
                    .Where(l => l.Status == LeaveStatus.Rejected)
                    .Sum(l => CalculateDaysInYear(l.StartDate, l.EndDate, targetYear));

                var availableDays = lt.MaxDaysPerYear - pendingDays - approvedDays;

                balances.Add(new LeaveBalanceResponseDto
                {
                    LeaveTypeId = lt.LeaveTypeId,
                    LeaveTypeName = lt.LeaveTypeName,
                    AnnualEntitlement = lt.MaxDaysPerYear,
                    PendingDays = pendingDays,
                    ApprovedDays = approvedDays,
                    RejectedDays = rejectedDays,
                    AvailableDays = availableDays < 0 ? 0 : availableDays
                });
            }

            return ServiceResult<IReadOnlyList<LeaveBalanceResponseDto>>.Success(balances, "Leave balances retrieved successfully.");
        }

        public async Task<ServiceResult<IReadOnlyList<ActiveLeaveTypeResponseDto>>> GetActiveLeaveTypesAsync(
            CancellationToken cancellationToken = default)
        {
            var list = await _context.LeaveTypes
                .AsNoTracking()
                .Where(lt => lt.IsActive)
                .OrderBy(lt => lt.LeaveTypeName)
                .Select(lt => new ActiveLeaveTypeResponseDto
                {
                    LeaveTypeId = lt.LeaveTypeId,
                    LeaveTypeName = lt.LeaveTypeName,
                    Description = lt.Description,
                    MaxDaysPerYear = lt.MaxDaysPerYear,
                    IsPaid = lt.IsPaid
                })
                .ToListAsync(cancellationToken);

            return ServiceResult<IReadOnlyList<ActiveLeaveTypeResponseDto>>.Success(list, "Active leave types retrieved successfully.");
        }

        public async Task<ServiceResult<PagedResponse<LeaveResponseDto>>> GetLeavesAsync(
            ClaimsPrincipal userPrincipal,
            LeaveQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            var callerEmployee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (callerEmployee is null)
            {
                return ServiceResult<PagedResponse<LeaveResponseDto>>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var callerRoles = await GetUserRolesAsync(callerEmployee);
            var isAdminOrHr = callerRoles.Contains(AppRoles.Admin) || callerRoles.Contains(AppRoles.HR);
            var isManager = callerRoles.Contains(AppRoles.Manager) ||
                            await _context.Employees.AnyAsync(e => e.ManagerId == callerEmployee.EmployeeId, cancellationToken);

            if (!isAdminOrHr && !isManager)
            {
                return ServiceResult<PagedResponse<LeaveResponseDto>>.Forbidden("You are not authorized to view department leave requests.");
            }

            var query = _context.Leaves.AsNoTracking().AsQueryable();

            if (!isAdminOrHr && isManager)
            {
                // Manager only sees subordinates or leaves they processed
                query = query.Where(l => l.Employee!.ManagerId == callerEmployee.EmployeeId || l.ApprovedById == callerEmployee.EmployeeId);
            }

            if (queryParameters.EmployeeId.HasValue)
            {
                query = query.Where(l => l.EmployeeId == queryParameters.EmployeeId.Value);
            }

            if (queryParameters.LeaveTypeId.HasValue)
            {
                query = query.Where(l => l.LeaveTypeId == queryParameters.LeaveTypeId.Value);
            }

            if (queryParameters.Status.HasValue)
            {
                query = query.Where(l => l.Status == queryParameters.Status.Value);
            }

            if (queryParameters.StartDate.HasValue)
            {
                query = query.Where(l => l.StartDate >= queryParameters.StartDate.Value.Date);
            }

            if (queryParameters.EndDate.HasValue)
            {
                query = query.Where(l => l.EndDate <= queryParameters.EndDate.Value.Date);
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(l => l.AppliedDate)
                .Skip((queryParameters.Page - 1) * queryParameters.PageSize)
                .Take(queryParameters.PageSize)
                .Select(l => new LeaveResponseDto
                {
                    LeaveId = l.LeaveId,
                    EmployeeId = l.EmployeeId,
                    EmployeeCode = l.Employee!.EmployeeCode,
                    EmployeeName = (l.Employee.FirstName + " " + l.Employee.LastName).Trim(),
                    EmployeeEmail = l.Employee.Email,
                    DepartmentName = l.Employee.Department != null ? l.Employee.Department.DepartmentName : null,
                    LeaveTypeId = l.LeaveTypeId,
                    LeaveTypeName = l.LeaveType != null ? l.LeaveType.LeaveTypeName : string.Empty,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    TotalDays = l.TotalDays,
                    Reason = l.Reason,
                    Status = l.Status,
                    AppliedDate = l.AppliedDate,
                    ApprovedById = l.ApprovedById,
                    ApprovedByName = l.ApprovedBy != null ? (l.ApprovedBy.FirstName + " " + l.ApprovedBy.LastName).Trim() : null,
                    ApprovedByEmail = l.ApprovedBy != null ? l.ApprovedBy.Email : null,
                    ApprovedDate = l.ApprovedDate,
                    RejectionReason = l.RejectionReason
                })
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<LeaveResponseDto>
            {
                Items = items,
                Page = queryParameters.Page,
                PageSize = queryParameters.PageSize,
                TotalCount = totalCount,
                TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)queryParameters.PageSize)
            };

            return ServiceResult<PagedResponse<LeaveResponseDto>>.Success(response, "Leave requests retrieved successfully.");
        }

        public async Task<ServiceResult<LeaveResponseDto>> GetLeaveByIdAsync(
            ClaimsPrincipal userPrincipal,
            int leaveId,
            CancellationToken cancellationToken = default)
        {
            var callerEmployee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (callerEmployee is null)
            {
                return ServiceResult<LeaveResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var callerRoles = await GetUserRolesAsync(callerEmployee);
            var isAdminOrHr = callerRoles.Contains(AppRoles.Admin) || callerRoles.Contains(AppRoles.HR);
            var isManager = callerRoles.Contains(AppRoles.Manager) ||
                            await _context.Employees.AnyAsync(e => e.ManagerId == callerEmployee.EmployeeId, cancellationToken);

            if (!isAdminOrHr && !isManager)
            {
                return ServiceResult<LeaveResponseDto>.Forbidden("You are not authorized to view this leave request.");
            }

            var query = _context.Leaves
                .AsNoTracking()
                .Where(l => l.LeaveId == leaveId);

            if (!isAdminOrHr && isManager)
            {
                query = query.Where(l => l.Employee!.ManagerId == callerEmployee.EmployeeId || l.ApprovedById == callerEmployee.EmployeeId);
            }

            var leave = await query
                .Select(l => new LeaveResponseDto
                {
                    LeaveId = l.LeaveId,
                    EmployeeId = l.EmployeeId,
                    EmployeeCode = l.Employee!.EmployeeCode,
                    EmployeeName = (l.Employee.FirstName + " " + l.Employee.LastName).Trim(),
                    EmployeeEmail = l.Employee.Email,
                    DepartmentName = l.Employee.Department != null ? l.Employee.Department.DepartmentName : null,
                    LeaveTypeId = l.LeaveTypeId,
                    LeaveTypeName = l.LeaveType != null ? l.LeaveType.LeaveTypeName : string.Empty,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    TotalDays = l.TotalDays,
                    Reason = l.Reason,
                    Status = l.Status,
                    AppliedDate = l.AppliedDate,
                    ApprovedById = l.ApprovedById,
                    ApprovedByName = l.ApprovedBy != null ? (l.ApprovedBy.FirstName + " " + l.ApprovedBy.LastName).Trim() : null,
                    ApprovedByEmail = l.ApprovedBy != null ? l.ApprovedBy.Email : null,
                    ApprovedDate = l.ApprovedDate,
                    RejectionReason = l.RejectionReason
                })
                .FirstOrDefaultAsync(cancellationToken);

            return leave is null
                ? ServiceResult<LeaveResponseDto>.NotFound("Leave request was not found.")
                : ServiceResult<LeaveResponseDto>.Success(leave, "Leave request retrieved successfully.");
        }

        public async Task<ServiceResult<LeaveResponseDto>> ApproveLeaveAsync(
            ClaimsPrincipal userPrincipal,
            int leaveId,
            CancellationToken cancellationToken = default)
        {
            var approverEmployee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (approverEmployee is null)
            {
                return ServiceResult<LeaveResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT LeaveId FROM Leaves WITH (UPDLOCK, ROWLOCK) WHERE LeaveId = {leaveId}",
                    cancellationToken);

                var leave = await _context.Leaves
                    .Include(l => l.Employee)
                        .ThenInclude(e => e!.Role)
                    .Include(l => l.LeaveType)
                    .FirstOrDefaultAsync(l => l.LeaveId == leaveId, cancellationToken);

                if (leave is null)
                {
                    return ServiceResult<LeaveResponseDto>.NotFound("Leave request was not found.");
                }

                if (leave.Status != LeaveStatus.Pending)
                {
                    return ServiceResult<LeaveResponseDto>.Conflict(
                        $"Leave request cannot be processed because it is already {leave.Status.ToString().ToLowerInvariant()}. Only pending leaves can be approved or rejected.");
                }

                var authValidation = await ValidateApproverAuthorizationAsync(approverEmployee, leave.Employee!, cancellationToken);
                if (!authValidation.Succeeded)
                {
                    return ServiceResult<LeaveResponseDto>.Forbidden(authValidation.Message);
                }

                leave.Status = LeaveStatus.Approved;
                leave.ApprovedById = approverEmployee.EmployeeId;
                leave.ApprovedDate = DateTime.UtcNow;

                // Synchronize associated Ticket if exists
                var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.LeaveId == leave.LeaveId, cancellationToken);
                if (ticket != null && ticket.Status == TicketStatus.Pending)
                {
                    ticket.Status = TicketStatus.Approved;
                    ticket.ApprovedAt = DateTime.UtcNow;
                    ticket.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Leave ID {LeaveId} approved by ApproverId {ApproverId} for EmployeeId {EmployeeId}.",
                    leave.LeaveId, approverEmployee.EmployeeId, leave.EmployeeId);

                var responseDto = await ProjectToResponseDtoAsync(leave.LeaveId, cancellationToken);
                return ServiceResult<LeaveResponseDto>.Success(responseDto!, "Leave request approved successfully.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "An error occurred while approving leave ID {LeaveId}.", leaveId);
                throw;
            }
        }

        public async Task<ServiceResult<LeaveResponseDto>> RejectLeaveAsync(
            ClaimsPrincipal userPrincipal,
            int leaveId,
            LeaveRejectionDto dto,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(dto.RejectionReason))
            {
                return ServiceResult<LeaveResponseDto>.BadRequest("Rejection reason is required.");
            }

            var approverEmployee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (approverEmployee is null)
            {
                return ServiceResult<LeaveResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT LeaveId FROM Leaves WITH (UPDLOCK, ROWLOCK) WHERE LeaveId = {leaveId}",
                    cancellationToken);

                var leave = await _context.Leaves
                    .Include(l => l.Employee)
                        .ThenInclude(e => e!.Role)
                    .Include(l => l.LeaveType)
                    .FirstOrDefaultAsync(l => l.LeaveId == leaveId, cancellationToken);

                if (leave is null)
                {
                    return ServiceResult<LeaveResponseDto>.NotFound("Leave request was not found.");
                }

                if (leave.Status != LeaveStatus.Pending)
                {
                    return ServiceResult<LeaveResponseDto>.Conflict(
                        $"Leave request cannot be processed because it is already {leave.Status.ToString().ToLowerInvariant()}. Only pending leaves can be approved or rejected.");
                }

                var authValidation = await ValidateApproverAuthorizationAsync(approverEmployee, leave.Employee!, cancellationToken);
                if (!authValidation.Succeeded)
                {
                    return ServiceResult<LeaveResponseDto>.Forbidden(authValidation.Message);
                }

                leave.Status = LeaveStatus.Rejected;
                leave.ApprovedById = approverEmployee.EmployeeId;
                leave.ApprovedDate = DateTime.UtcNow;
                leave.RejectionReason = dto.RejectionReason.Trim();

                // Synchronize associated Ticket if exists
                var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.LeaveId == leave.LeaveId, cancellationToken);
                if (ticket != null && ticket.Status == TicketStatus.Pending)
                {
                    ticket.Status = TicketStatus.Rejected;
                    ticket.RejectionReason = dto.RejectionReason.Trim();
                    ticket.RejectedAt = DateTime.UtcNow;
                    ticket.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Leave ID {LeaveId} rejected by ApproverId {ApproverId} for EmployeeId {EmployeeId}. Reason: {RejectionReason}.",
                    leave.LeaveId, approverEmployee.EmployeeId, leave.EmployeeId, leave.RejectionReason);

                var responseDto = await ProjectToResponseDtoAsync(leave.LeaveId, cancellationToken);
                return ServiceResult<LeaveResponseDto>.Success(responseDto!, "Leave request rejected successfully.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "An error occurred while rejecting leave ID {LeaveId}.", leaveId);
                throw;
            }
        }

        // =========================================================================
        // PRIVATE HELPER METHODS
        // =========================================================================

        private async Task<Employee?> GetCurrentEmployeeAsync(ClaimsPrincipal userPrincipal, CancellationToken cancellationToken)
        {
            var employeeIdClaim = userPrincipal.FindFirst("employeeId")?.Value;
            if (int.TryParse(employeeIdClaim, out var empId))
            {
                var emp = await _context.Employees
                    .Include(e => e.Role)
                    .Include(e => e.Department)
                    .FirstOrDefaultAsync(e => e.EmployeeId == empId, cancellationToken);

                if (emp is not null) return emp;
            }

            var userId = userPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(userId))
            {
                var appUser = await _userManager.FindByIdAsync(userId);
                if (appUser?.EmployeeId != null)
                {
                    var emp = await _context.Employees
                        .Include(e => e.Role)
                        .Include(e => e.Department)
                        .FirstOrDefaultAsync(e => e.EmployeeId == appUser.EmployeeId.Value, cancellationToken);

                    if (emp is not null) return emp;
                }

                return await _context.Employees
                    .Include(e => e.Role)
                    .Include(e => e.Department)
                    .FirstOrDefaultAsync(e => e.UserId == userId || (appUser != null && e.Email == appUser.Email), cancellationToken);
            }

            return null;
        }

        private async Task<HashSet<string>> GetUserRolesAsync(Employee employee)
        {
            var roles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (!string.IsNullOrWhiteSpace(employee.UserId))
            {
                var user = await _userManager.FindByIdAsync(employee.UserId);
                if (user is not null)
                {
                    var identityRoles = await _userManager.GetRolesAsync(user);
                    foreach (var r in identityRoles)
                    {
                        roles.Add(r);
                    }
                }
            }

            if (employee.Role is not null)
            {
                var roleName = employee.Role.RoleName;
                if (roleName.Contains("Admin", StringComparison.OrdinalIgnoreCase)) roles.Add(AppRoles.Admin);
                if (roleName.Contains("HR", StringComparison.OrdinalIgnoreCase)) roles.Add(AppRoles.HR);
                if (roleName.Contains("Manager", StringComparison.OrdinalIgnoreCase) || roleName.Contains("Lead", StringComparison.OrdinalIgnoreCase)) roles.Add(AppRoles.Manager);
            }

            return roles;
        }

        private async Task<string> GetEmployeeTierAsync(Employee employee, CancellationToken cancellationToken)
        {
            var roles = await GetUserRolesAsync(employee);

            if (roles.Contains(AppRoles.Admin)) return AppRoles.Admin;
            if (roles.Contains(AppRoles.HR)) return AppRoles.HR;
            if (roles.Contains(AppRoles.Manager)) return AppRoles.Manager;

            var hasSubordinates = await _context.Employees
                .AnyAsync(e => e.ManagerId == employee.EmployeeId, cancellationToken);

            if (hasSubordinates)
            {
                return AppRoles.Manager;
            }

            return AppRoles.Employee;
        }

        private async Task<ServiceResult<bool>> ValidateApproverAuthorizationAsync(
            Employee approver,
            Employee applicant,
            CancellationToken cancellationToken)
        {
            // 1. Self-approval is strictly forbidden
            if (approver.EmployeeId == applicant.EmployeeId)
            {
                return ServiceResult<bool>.Forbidden("You cannot approve or reject your own leave request.");
            }

            var approverRoles = await GetUserRolesAsync(approver);
            var applicantTier = await GetEmployeeTierAsync(applicant, cancellationToken);

            switch (applicantTier)
            {
                case AppRoles.Employee:
                    // Must be applicant's assigned manager
                    if (applicant.ManagerId != approver.EmployeeId)
                    {
                        return ServiceResult<bool>.Forbidden(
                            "You are not authorized to approve or reject this leave request. Only the employee's assigned manager can approve it.");
                    }
                    return ServiceResult<bool>.Success(true, "Authorized.");

                case AppRoles.Manager:
                    // Must be HR or Admin
                    if (!approverRoles.Contains(AppRoles.HR) && !approverRoles.Contains(AppRoles.Admin))
                    {
                        return ServiceResult<bool>.Forbidden("Only HR or Administrator can approve or reject a manager's leave request.");
                    }
                    return ServiceResult<bool>.Success(true, "Authorized.");

                case AppRoles.HR:
                    // Must be Admin
                    if (!approverRoles.Contains(AppRoles.Admin))
                    {
                        return ServiceResult<bool>.Forbidden("Only an Administrator can approve or reject HR leave requests.");
                    }
                    return ServiceResult<bool>.Success(true, "Authorized.");

                case AppRoles.Admin:
                    // Must be another Admin
                    if (!approverRoles.Contains(AppRoles.Admin))
                    {
                        return ServiceResult<bool>.Forbidden("Only an Administrator can approve or reject an Administrator's leave request.");
                    }
                    return ServiceResult<bool>.Success(true, "Authorized.");

                default:
                    return ServiceResult<bool>.Forbidden("You are not authorized to approve or reject this leave request.");
            }
        }

        private static int CalculateDaysInYear(DateTime startDate, DateTime endDate, int year)
        {
            var yearStart = new DateTime(year, 1, 1);
            var yearEnd = new DateTime(year, 12, 31);

            if (endDate.Date < yearStart || startDate.Date > yearEnd)
            {
                return 0;
            }

            var effectiveStart = startDate.Date < yearStart ? yearStart : startDate.Date;
            var effectiveEnd = endDate.Date > yearEnd ? yearEnd : endDate.Date;

            return (effectiveEnd - effectiveStart).Days + 1;
        }

        private async Task<LeaveResponseDto?> ProjectToResponseDtoAsync(int leaveId, CancellationToken cancellationToken)
        {
            return await _context.Leaves
                .AsNoTracking()
                .Where(l => l.LeaveId == leaveId)
                .Select(l => new LeaveResponseDto
                {
                    LeaveId = l.LeaveId,
                    EmployeeId = l.EmployeeId,
                    EmployeeCode = l.Employee!.EmployeeCode,
                    EmployeeName = (l.Employee.FirstName + " " + l.Employee.LastName).Trim(),
                    EmployeeEmail = l.Employee.Email,
                    DepartmentName = l.Employee.Department != null ? l.Employee.Department.DepartmentName : null,
                    LeaveTypeId = l.LeaveTypeId,
                    LeaveTypeName = l.LeaveType != null ? l.LeaveType.LeaveTypeName : string.Empty,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    TotalDays = l.TotalDays,
                    Reason = l.Reason,
                    Status = l.Status,
                    AppliedDate = l.AppliedDate,
                    ApprovedById = l.ApprovedById,
                    ApprovedByName = l.ApprovedBy != null ? (l.ApprovedBy.FirstName + " " + l.ApprovedBy.LastName).Trim() : null,
                    ApprovedByEmail = l.ApprovedBy != null ? l.ApprovedBy.Email : null,
                    ApprovedDate = l.ApprovedDate,
                    RejectionReason = l.RejectionReason
                })
                .FirstOrDefaultAsync(cancellationToken);
        }
    }
}
