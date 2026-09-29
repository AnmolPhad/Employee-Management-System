using System.Data;
using System.Security.Claims;
using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.Data;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Ticket;
using EmployeeManagementSystem.API.Models;
using EmployeeManagementSystem.API.Models.Enums;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.API.Services.Implementations
{
    public class TicketService : ITicketService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<TicketService> _logger;

        public TicketService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<TicketService> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<Ticket?> CreateTicketForLeaveAsync(
            Leave leave,
            Employee applicant,
            LeaveType leaveType,
            CancellationToken cancellationToken = default)
        {
            // Determine applicant tier
            var applicantTier = await GetEmployeeTierAsync(applicant, cancellationToken);

            // Admin does NOT create leave tickets
            if (applicantTier == AppRoles.Admin)
            {
                _logger.LogInformation("Applicant {EmployeeId} is an Administrator. No leave approval ticket created.", applicant.EmployeeId);
                return null;
            }

            int approverEmployeeId;

            switch (applicantTier)
            {
                case AppRoles.Employee:
                    // Assigned to Reporting Manager
                    if (!applicant.ManagerId.HasValue)
                    {
                        throw new InvalidOperationException("Applicant has no reporting manager assigned to approve the leave ticket.");
                    }
                    approverEmployeeId = applicant.ManagerId.Value;
                    break;

                case AppRoles.Manager:
                    // Assigned to HR
                    var hrApprover = await ResolveApproverByRoleAsync(AppRoles.HR, applicant.EmployeeId, cancellationToken);
                    if (hrApprover is null)
                    {
                        throw new InvalidOperationException("No active HR personnel found to route manager's leave ticket.");
                    }
                    approverEmployeeId = hrApprover.EmployeeId;
                    break;

                case AppRoles.HR:
                    // Assigned to Admin
                    var adminApprover = await ResolveApproverByRoleAsync(AppRoles.Admin, applicant.EmployeeId, cancellationToken);
                    if (adminApprover is null)
                    {
                        throw new InvalidOperationException("No active Administrator found to route HR's leave ticket.");
                    }
                    approverEmployeeId = adminApprover.EmployeeId;
                    break;

                default:
                    throw new InvalidOperationException($"Unsupported applicant tier '{applicantTier}' for leave ticket creation.");
            }

            var ticket = new Ticket
            {
                EmployeeId = applicant.EmployeeId,
                LeaveId = leave.LeaveId,
                AssignedToId = approverEmployeeId,
                Title = $"Leave Application - {leaveType.LeaveTypeName} ({applicant.FullName})",
                Description = $"Leave application for {leave.TotalDays} day(s) from {leave.StartDate:yyyy-MM-dd} to {leave.EndDate:yyyy-MM-dd}. Reason: {leave.Reason}",
                Category = "Leave",
                Priority = TicketPriority.Medium,
                Status = TicketStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tickets.Add(ticket);

            // Audit record for ticket creation & assignment
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = applicant.UserId,
                Action = "TicketCreated",
                EntityName = "Ticket",
                EntityId = ticket.TicketId.ToString(),
                NewValue = $"Ticket created for LeaveId {leave.LeaveId} assigned to EmployeeId {approverEmployeeId}",
                Timestamp = DateTime.UtcNow
            });

            _logger.LogInformation("Leave ticket created for EmployeeId {ApplicantId}, LeaveId {LeaveId}, assigned to ApproverId {ApproverId}.",
                applicant.EmployeeId, leave.LeaveId, approverEmployeeId);

            return ticket;
        }

        public async Task<ServiceResult<PagedResponse<TicketMeResponseDto>>> GetMyTicketsAsync(
            ClaimsPrincipal userPrincipal,
            TicketQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            var employee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<PagedResponse<TicketMeResponseDto>>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var query = _context.Tickets
                .Include(t => t.AssignedTo)
                .Include(t => t.Leave)
                    .ThenInclude(l => l!.LeaveType)
                .AsNoTracking()
                .Where(t => t.EmployeeId == employee.EmployeeId);

            if (!string.IsNullOrWhiteSpace(queryParameters.Status) &&
                Enum.TryParse<TicketStatus>(queryParameters.Status, true, out var statusFilter))
            {
                query = query.Where(t => t.Status == statusFilter);
            }

            if (queryParameters.StartDate.HasValue)
            {
                query = query.Where(t => t.CreatedAt >= queryParameters.StartDate.Value);
            }

            if (queryParameters.EndDate.HasValue)
            {
                query = query.Where(t => t.CreatedAt <= queryParameters.EndDate.Value);
            }

            var totalCount = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, queryParameters.Page);
            var pageSize = Math.Clamp(queryParameters.PageSize, 1, 100);
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            query = queryParameters.SortOrder?.ToLowerInvariant() == "asc"
                ? query.OrderBy(t => t.CreatedAt)
                : query.OrderByDescending(t => t.CreatedAt);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => MapToMeResponseDto(t))
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<TicketMeResponseDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };

            return ServiceResult<PagedResponse<TicketMeResponseDto>>.Success(response, "Tickets retrieved successfully.");
        }

        public async Task<ServiceResult<TicketMeResponseDto>> GetMyTicketByIdAsync(
            ClaimsPrincipal userPrincipal,
            int ticketId,
            CancellationToken cancellationToken = default)
        {
            var employee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<TicketMeResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var ticket = await _context.Tickets
                .Include(t => t.AssignedTo)
                .Include(t => t.Leave)
                    .ThenInclude(l => l!.LeaveType)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TicketId == ticketId && t.EmployeeId == employee.EmployeeId, cancellationToken);

            if (ticket is null)
            {
                return ServiceResult<TicketMeResponseDto>.NotFound($"Ticket with ID {ticketId} was not found.");
            }

            return ServiceResult<TicketMeResponseDto>.Success(MapToMeResponseDto(ticket), "Ticket retrieved successfully.");
        }

        public async Task<ServiceResult<PagedResponse<TicketResponseDto>>> GetMyApprovalsAsync(
            ClaimsPrincipal userPrincipal,
            TicketQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            var approver = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (approver is null)
            {
                return ServiceResult<PagedResponse<TicketResponseDto>>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var query = _context.Tickets
                .Include(t => t.Employee)
                .Include(t => t.AssignedTo)
                .Include(t => t.Leave)
                    .ThenInclude(l => l!.LeaveType)
                .AsNoTracking()
                .Where(t => t.AssignedToId == approver.EmployeeId);

            if (!string.IsNullOrWhiteSpace(queryParameters.Status) &&
                Enum.TryParse<TicketStatus>(queryParameters.Status, true, out var statusFilter))
            {
                query = query.Where(t => t.Status == statusFilter);
            }

            if (queryParameters.EmployeeId.HasValue)
            {
                query = query.Where(t => t.EmployeeId == queryParameters.EmployeeId.Value);
            }

            if (queryParameters.StartDate.HasValue)
            {
                query = query.Where(t => t.CreatedAt >= queryParameters.StartDate.Value);
            }

            if (queryParameters.EndDate.HasValue)
            {
                query = query.Where(t => t.CreatedAt <= queryParameters.EndDate.Value);
            }

            var totalCount = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, queryParameters.Page);
            var pageSize = Math.Clamp(queryParameters.PageSize, 1, 100);
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            query = queryParameters.SortOrder?.ToLowerInvariant() == "asc"
                ? query.OrderBy(t => t.CreatedAt)
                : query.OrderByDescending(t => t.CreatedAt);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => MapToResponseDto(t))
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<TicketResponseDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };

            return ServiceResult<PagedResponse<TicketResponseDto>>.Success(response, "Assigned approval tickets retrieved successfully.");
        }

        public async Task<ServiceResult<TicketResponseDto>> GetTicketByIdAsync(
            ClaimsPrincipal userPrincipal,
            int ticketId,
            CancellationToken cancellationToken = default)
        {
            var employee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<TicketResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var ticket = await _context.Tickets
                .Include(t => t.Employee)
                .Include(t => t.AssignedTo)
                .Include(t => t.Leave)
                    .ThenInclude(l => l!.LeaveType)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TicketId == ticketId, cancellationToken);

            if (ticket is null)
            {
                return ServiceResult<TicketResponseDto>.NotFound($"Ticket with ID {ticketId} was not found.");
            }

            var userRoles = await GetUserRolesAsync(employee);
            var isAdmin = userRoles.Contains(AppRoles.Admin);

            // Authorized if user is assigned approver, creator, or admin
            if (ticket.AssignedToId != employee.EmployeeId && ticket.EmployeeId != employee.EmployeeId && !isAdmin)
            {
                _logger.LogWarning("Unauthorized ticket access attempt: EmployeeId {EmployeeId} tried to view TicketId {TicketId}.",
                    employee.EmployeeId, ticketId);
                return ServiceResult<TicketResponseDto>.Forbidden("You are not authorized to view this ticket.");
            }

            return ServiceResult<TicketResponseDto>.Success(MapToResponseDto(ticket), "Ticket retrieved successfully.");
        }

        public async Task<ServiceResult<TicketResponseDto>> ApproveTicketAsync(
            ClaimsPrincipal userPrincipal,
            int ticketId,
            CancellationToken cancellationToken = default)
        {
            var approver = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (approver is null)
            {
                return ServiceResult<TicketResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
            try
            {
                // Lock ticket row
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT TicketId FROM Tickets WITH (UPDLOCK, ROWLOCK) WHERE TicketId = {ticketId}",
                    cancellationToken);

                var ticket = await _context.Tickets
                    .Include(t => t.Employee)
                    .Include(t => t.AssignedTo)
                    .Include(t => t.Leave)
                        .ThenInclude(l => l!.LeaveType)
                    .FirstOrDefaultAsync(t => t.TicketId == ticketId, cancellationToken);

                if (ticket is null)
                {
                    return ServiceResult<TicketResponseDto>.NotFound($"Ticket with ID {ticketId} was not found.");
                }

                // Check status
                if (ticket.Status != TicketStatus.Pending)
                {
                    return ServiceResult<TicketResponseDto>.Conflict(
                        $"Ticket cannot be approved because it is already {ticket.Status.ToString().ToLowerInvariant()}. Only pending tickets can be approved.");
                }

                // Strictly verify current user is the assigned approver
                if (ticket.AssignedToId != approver.EmployeeId)
                {
                    _logger.LogWarning("Unauthorized approval attempt: EmployeeId {ApproverId} attempted to approve TicketId {TicketId} assigned to {AssignedToId}.",
                        approver.EmployeeId, ticketId, ticket.AssignedToId);

                    return ServiceResult<TicketResponseDto>.Forbidden(
                        "You are not authorized to approve this ticket. Only the assigned approver can approve it.");
                }

                // Employee cannot approve own ticket
                if (ticket.EmployeeId == approver.EmployeeId)
                {
                    return ServiceResult<TicketResponseDto>.Forbidden("You cannot approve your own leave ticket.");
                }

                var now = DateTime.UtcNow;

                // Synchronize Leave if attached
                if (ticket.LeaveId.HasValue && ticket.Leave != null)
                {
                    await _context.Database.ExecuteSqlInterpolatedAsync(
                        $"SELECT LeaveId FROM Leaves WITH (UPDLOCK, ROWLOCK) WHERE LeaveId = {ticket.LeaveId.Value}",
                        cancellationToken);

                    ticket.Leave.Status = LeaveStatus.Approved;
                    ticket.Leave.ApprovedById = approver.EmployeeId;
                    ticket.Leave.ApprovedDate = now;
                }

                ticket.Status = TicketStatus.Approved;
                ticket.ApprovedAt = now;
                ticket.UpdatedAt = now;

                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = approver.UserId,
                    Action = "TicketApproved",
                    EntityName = "Ticket",
                    EntityId = ticket.TicketId.ToString(),
                    NewValue = $"Ticket approved by ApproverId {approver.EmployeeId} at {now:o}",
                    Timestamp = now
                });

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Ticket ID {TicketId} approved by ApproverId {ApproverId} for EmployeeId {ApplicantId}.",
                    ticket.TicketId, approver.EmployeeId, ticket.EmployeeId);

                return ServiceResult<TicketResponseDto>.Success(MapToResponseDto(ticket), "Leave ticket approved successfully.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "An error occurred while approving Ticket ID {TicketId}.", ticketId);
                throw;
            }
        }

        public async Task<ServiceResult<TicketResponseDto>> RejectTicketAsync(
            ClaimsPrincipal userPrincipal,
            int ticketId,
            TicketRejectDto dto,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(dto.Reason))
            {
                return ServiceResult<TicketResponseDto>.BadRequest("Rejection reason is required.");
            }

            var approver = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (approver is null)
            {
                return ServiceResult<TicketResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
            try
            {
                // Lock ticket row
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT TicketId FROM Tickets WITH (UPDLOCK, ROWLOCK) WHERE TicketId = {ticketId}",
                    cancellationToken);

                var ticket = await _context.Tickets
                    .Include(t => t.Employee)
                    .Include(t => t.AssignedTo)
                    .Include(t => t.Leave)
                        .ThenInclude(l => l!.LeaveType)
                    .FirstOrDefaultAsync(t => t.TicketId == ticketId, cancellationToken);

                if (ticket is null)
                {
                    return ServiceResult<TicketResponseDto>.NotFound($"Ticket with ID {ticketId} was not found.");
                }

                // Check status
                if (ticket.Status != TicketStatus.Pending)
                {
                    return ServiceResult<TicketResponseDto>.Conflict(
                        $"Ticket cannot be rejected because it is already {ticket.Status.ToString().ToLowerInvariant()}. Only pending tickets can be rejected.");
                }

                // Strictly verify current user is the assigned approver
                if (ticket.AssignedToId != approver.EmployeeId)
                {
                    _logger.LogWarning("Unauthorized rejection attempt: EmployeeId {ApproverId} attempted to reject TicketId {TicketId} assigned to {AssignedToId}.",
                        approver.EmployeeId, ticketId, ticket.AssignedToId);

                    return ServiceResult<TicketResponseDto>.Forbidden(
                        "You are not authorized to reject this ticket. Only the assigned approver can reject it.");
                }

                // Employee cannot reject own ticket
                if (ticket.EmployeeId == approver.EmployeeId)
                {
                    return ServiceResult<TicketResponseDto>.Forbidden("You cannot reject your own leave ticket.");
                }

                var now = DateTime.UtcNow;

                // Synchronize Leave if attached (restores leave balance automatically)
                if (ticket.LeaveId.HasValue && ticket.Leave != null)
                {
                    await _context.Database.ExecuteSqlInterpolatedAsync(
                        $"SELECT LeaveId FROM Leaves WITH (UPDLOCK, ROWLOCK) WHERE LeaveId = {ticket.LeaveId.Value}",
                        cancellationToken);

                    ticket.Leave.Status = LeaveStatus.Rejected;
                    ticket.Leave.ApprovedById = approver.EmployeeId;
                    ticket.Leave.ApprovedDate = now;
                    ticket.Leave.RejectionReason = dto.Reason.Trim();
                }

                ticket.Status = TicketStatus.Rejected;
                ticket.RejectionReason = dto.Reason.Trim();
                ticket.RejectedAt = now;
                ticket.UpdatedAt = now;

                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = approver.UserId,
                    Action = "TicketRejected",
                    EntityName = "Ticket",
                    EntityId = ticket.TicketId.ToString(),
                    NewValue = $"Ticket rejected by ApproverId {approver.EmployeeId}. Reason: {dto.Reason.Trim()}",
                    Timestamp = now
                });

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Ticket ID {TicketId} rejected by ApproverId {ApproverId} for EmployeeId {ApplicantId}. Reason: {Reason}.",
                    ticket.TicketId, approver.EmployeeId, ticket.EmployeeId, ticket.RejectionReason);

                return ServiceResult<TicketResponseDto>.Success(MapToResponseDto(ticket), "Leave ticket rejected successfully.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "An error occurred while rejecting Ticket ID {TicketId}.", ticketId);
                throw;
            }
        }

        public async Task<ServiceResult<PagedResponse<TicketResponseDto>>> GetAllTicketsAdminAsync(
            TicketQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Tickets
                .Include(t => t.Employee)
                .Include(t => t.AssignedTo)
                .Include(t => t.Leave)
                    .ThenInclude(l => l!.LeaveType)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(queryParameters.Status) &&
                Enum.TryParse<TicketStatus>(queryParameters.Status, true, out var statusFilter))
            {
                query = query.Where(t => t.Status == statusFilter);
            }

            if (queryParameters.EmployeeId.HasValue)
            {
                query = query.Where(t => t.EmployeeId == queryParameters.EmployeeId.Value);
            }

            if (queryParameters.AssignedToId.HasValue)
            {
                query = query.Where(t => t.AssignedToId == queryParameters.AssignedToId.Value);
            }

            if (queryParameters.StartDate.HasValue)
            {
                query = query.Where(t => t.CreatedAt >= queryParameters.StartDate.Value);
            }

            if (queryParameters.EndDate.HasValue)
            {
                query = query.Where(t => t.CreatedAt <= queryParameters.EndDate.Value);
            }

            var totalCount = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, queryParameters.Page);
            var pageSize = Math.Clamp(queryParameters.PageSize, 1, 100);
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            query = queryParameters.SortOrder?.ToLowerInvariant() == "asc"
                ? query.OrderBy(t => t.CreatedAt)
                : query.OrderByDescending(t => t.CreatedAt);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => MapToResponseDto(t))
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<TicketResponseDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };

            return ServiceResult<PagedResponse<TicketResponseDto>>.Success(response, "All tickets retrieved successfully.");
        }

        public async Task<ServiceResult<TicketResponseDto>> GetTicketByIdAdminAsync(
            int ticketId,
            CancellationToken cancellationToken = default)
        {
            var ticket = await _context.Tickets
                .Include(t => t.Employee)
                .Include(t => t.AssignedTo)
                .Include(t => t.Leave)
                    .ThenInclude(l => l!.LeaveType)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TicketId == ticketId, cancellationToken);

            if (ticket is null)
            {
                return ServiceResult<TicketResponseDto>.NotFound($"Ticket with ID {ticketId} was not found.");
            }

            return ServiceResult<TicketResponseDto>.Success(MapToResponseDto(ticket), "Ticket retrieved successfully.");
        }

        // =====================================================================
        // PRIVATE HELPERS
        // =====================================================================

        private async Task<Employee?> GetCurrentEmployeeAsync(ClaimsPrincipal userPrincipal, CancellationToken cancellationToken)
        {
            var employeeIdClaim = userPrincipal.FindFirstValue("employeeId");
            if (int.TryParse(employeeIdClaim, out var employeeId))
            {
                var emp = await _context.Employees
                    .Include(e => e.Role)
                    .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, cancellationToken);
                if (emp is not null) return emp;
            }

            var userId = userPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(userId))
            {
                var appUser = await _userManager.FindByIdAsync(userId);
                if (appUser?.EmployeeId is not null)
                {
                    return await _context.Employees
                        .Include(e => e.Role)
                        .FirstOrDefaultAsync(e => e.EmployeeId == appUser.EmployeeId.Value, cancellationToken);
                }
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
                if (roleName.Contains("Admin", StringComparison.OrdinalIgnoreCase) || roleName.Contains("Administrator", StringComparison.OrdinalIgnoreCase)) roles.Add(AppRoles.Admin);
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

        private async Task<Employee?> ResolveApproverByRoleAsync(string targetRole, int excludeEmployeeId, CancellationToken cancellationToken)
        {
            var query = _context.Employees
                .Include(e => e.Role)
                .Where(e => e.EmployeeId != excludeEmployeeId &&
                            e.EmploymentStatus != EmploymentStatus.Resigned &&
                            e.EmploymentStatus != EmploymentStatus.Terminated);

            if (string.Equals(targetRole, AppRoles.HR, StringComparison.OrdinalIgnoreCase))
            {
                return await query
                    .Where(e => _context.UserRoles.Any(ur => ur.UserId == e.UserId && _context.Roles.Any(r => r.Id == ur.RoleId && r.Name == AppRoles.HR)) ||
                                (e.Role != null && e.Role.RoleName.Contains("HR")))
                    .OrderByDescending(e => _context.UserRoles.Any(ur => ur.UserId == e.UserId && _context.Roles.Any(r => r.Id == ur.RoleId && r.Name == AppRoles.HR)))
                    .ThenBy(e => e.EmployeeId)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            if (string.Equals(targetRole, AppRoles.Admin, StringComparison.OrdinalIgnoreCase))
            {
                return await query
                    .Where(e => _context.UserRoles.Any(ur => ur.UserId == e.UserId && _context.Roles.Any(r => r.Id == ur.RoleId && r.Name == AppRoles.Admin)) ||
                                (e.Role != null && (e.Role.RoleName.Contains("Admin") || e.Role.RoleName.Contains("Administrator"))))
                    .OrderByDescending(e => _context.UserRoles.Any(ur => ur.UserId == e.UserId && _context.Roles.Any(r => r.Id == ur.RoleId && r.Name == AppRoles.Admin)))
                    .ThenBy(e => e.EmployeeId)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            return null;
        }

        private static TicketResponseDto MapToResponseDto(Ticket ticket)
        {
            return new TicketResponseDto
            {
                TicketId = ticket.TicketId,
                LeaveId = ticket.LeaveId,
                EmployeeId = ticket.EmployeeId,
                EmployeeName = ticket.Employee?.FullName ?? string.Empty,
                EmployeeCode = ticket.Employee?.EmployeeCode ?? string.Empty,
                AssignedToId = ticket.AssignedToId,
                AssignedToName = ticket.AssignedTo?.FullName,
                Title = ticket.Title,
                Description = ticket.Description,
                Category = ticket.Category,
                Priority = ticket.Priority.ToString(),
                Status = ticket.Status.ToString(),
                RejectionReason = ticket.RejectionReason,
                CreatedAt = ticket.CreatedAt,
                UpdatedAt = ticket.UpdatedAt,
                ApprovedAt = ticket.ApprovedAt,
                RejectedAt = ticket.RejectedAt,
                LeaveDetails = ticket.Leave is null ? null : new TicketLeaveDetailsDto
                {
                    LeaveTypeId = ticket.Leave.LeaveTypeId,
                    LeaveTypeName = ticket.Leave.LeaveType?.LeaveTypeName ?? string.Empty,
                    StartDate = ticket.Leave.StartDate,
                    EndDate = ticket.Leave.EndDate,
                    TotalDays = ticket.Leave.TotalDays,
                    Reason = ticket.Leave.Reason,
                    LeaveStatus = ticket.Leave.Status.ToString(),
                    IsPaid = ticket.Leave.LeaveType?.IsPaid ?? true
                }
            };
        }

        private static TicketMeResponseDto MapToMeResponseDto(Ticket ticket)
        {
            return new TicketMeResponseDto
            {
                TicketId = ticket.TicketId,
                LeaveId = ticket.LeaveId,
                Title = ticket.Title,
                Description = ticket.Description,
                Status = ticket.Status.ToString(),
                AssignedToName = ticket.AssignedTo?.FullName,
                RejectionReason = ticket.RejectionReason,
                CreatedAt = ticket.CreatedAt,
                ApprovedAt = ticket.ApprovedAt,
                RejectedAt = ticket.RejectedAt,
                LeaveDetails = ticket.Leave is null ? null : new TicketMeLeaveDetailsDto
                {
                    LeaveTypeName = ticket.Leave.LeaveType?.LeaveTypeName ?? string.Empty,
                    StartDate = ticket.Leave.StartDate,
                    EndDate = ticket.Leave.EndDate,
                    TotalDays = ticket.Leave.TotalDays,
                    IsPaid = ticket.Leave.LeaveType?.IsPaid ?? true
                }
            };
        }
    }
}
