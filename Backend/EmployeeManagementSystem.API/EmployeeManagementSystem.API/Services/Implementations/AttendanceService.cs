using System.Data;
using System.Security.Claims;
using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.Data;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Attendance;
using EmployeeManagementSystem.API.Models;
using EmployeeManagementSystem.API.Models.Enums;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EmployeeManagementSystem.API.Services.Implementations
{
    public class AttendanceService : IAttendanceService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IOptions<OrganizationSettings> _orgSettings;
        private readonly ILogger<AttendanceService> _logger;

        public AttendanceService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            IOptions<OrganizationSettings> orgSettings,
            ILogger<AttendanceService> logger)
        {
            _context = context;
            _userManager = userManager;
            _orgSettings = orgSettings;
            _logger = logger;
        }

        public async Task<ServiceResult<AttendanceResponseDto>> CheckInAsync(
            ClaimsPrincipal userPrincipal,
            AttendanceCheckInDto dto,
            CancellationToken cancellationToken = default)
        {
            var employee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<AttendanceResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var targetDate = dto.Date?.Date ?? GetOrganizationToday();
            var punchTime = dto.Time ?? GetOrganizationNow().TimeOfDay;

            // 1. Check if target date is an Approved Leave
            var hasApprovedLeave = await _context.Leaves
                .AsNoTracking()
                .AnyAsync(l => l.EmployeeId == employee.EmployeeId &&
                               l.Status == LeaveStatus.Approved &&
                               l.StartDate <= targetDate && l.EndDate >= targetDate, cancellationToken);

            if (hasApprovedLeave)
            {
                _logger.LogWarning("Check-in rejected for EmployeeId {EmployeeId} on {Date:yyyy-MM-dd}: Employee has approved leave.",
                    employee.EmployeeId, targetDate);
                return ServiceResult<AttendanceResponseDto>.BadRequest("Cannot check in: You have an approved leave on this date.");
            }

            // 2. Check if target date is an active Holiday
            var holiday = await _context.Holidays
                .AsNoTracking()
                .FirstOrDefaultAsync(h => h.IsActive && h.HolidayDate == targetDate, cancellationToken);

            if (holiday != null)
            {
                _logger.LogWarning("Check-in rejected for EmployeeId {EmployeeId} on {Date:yyyy-MM-dd}: Today is official holiday {HolidayName}.",
                    employee.EmployeeId, targetDate, holiday.HolidayName);
                return ServiceResult<AttendanceResponseDto>.BadRequest($"Cannot check in: Today is an official holiday ({holiday.HolidayName}).");
            }

            // 3. Check if target date is a Weekly Off
            var weeklyOffs = _orgSettings.Value?.WeeklyOffDays ?? new List<DayOfWeek> { DayOfWeek.Saturday, DayOfWeek.Sunday };
            if (weeklyOffs.Contains(targetDate.DayOfWeek))
            {
                _logger.LogWarning("Check-in rejected for EmployeeId {EmployeeId} on {Date:yyyy-MM-dd}: Today is weekly off ({DayOfWeek}).",
                    employee.EmployeeId, targetDate, targetDate.DayOfWeek);
                return ServiceResult<AttendanceResponseDto>.BadRequest("Cannot check in: Today is a weekly off.");
            }

            // 4. Concurrency-safe check-in using SQL Server row lock
            using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT EmployeeId FROM Employees WITH (UPDLOCK, ROWLOCK) WHERE EmployeeId = {employee.EmployeeId}",
                    cancellationToken);

                var attendance = await _context.Attendances
                    .FirstOrDefaultAsync(a => a.EmployeeId == employee.EmployeeId && a.AttendanceDate == targetDate, cancellationToken);

                if (attendance == null)
                {
                    attendance = new Attendance
                    {
                        EmployeeId = employee.EmployeeId,
                        AttendanceDate = targetDate,
                        CheckInTime = punchTime,
                        Status = AttendanceStatus.Present,
                        Remarks = dto.Remarks
                    };
                    _context.Attendances.Add(attendance);
                }
                else
                {
                    // First Check-in rule: If CheckInTime already recorded, keep earliest punch
                    if (!attendance.CheckInTime.HasValue)
                    {
                        attendance.CheckInTime = punchTime;
                    }
                    else if (punchTime < attendance.CheckInTime.Value)
                    {
                        attendance.CheckInTime = punchTime;
                    }

                    if (!string.IsNullOrWhiteSpace(dto.Remarks))
                    {
                        attendance.Remarks = dto.Remarks;
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Check-in recorded for EmployeeId {EmployeeId} on {Date:yyyy-MM-dd} at {Time}.",
                    employee.EmployeeId, targetDate, attendance.CheckInTime);

                return ServiceResult<AttendanceResponseDto>.Success(ProjectToDto(attendance, employee), "Check-in recorded successfully.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Error recording check-in for EmployeeId {EmployeeId}.", employee.EmployeeId);
                throw;
            }
        }

        public async Task<ServiceResult<AttendanceResponseDto>> CheckOutAsync(
            ClaimsPrincipal userPrincipal,
            AttendanceCheckOutDto dto,
            CancellationToken cancellationToken = default)
        {
            var employee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<AttendanceResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var targetDate = dto.Date?.Date ?? GetOrganizationToday();
            var punchTime = dto.Time ?? GetOrganizationNow().TimeOfDay;

            using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT EmployeeId FROM Employees WITH (UPDLOCK, ROWLOCK) WHERE EmployeeId = {employee.EmployeeId}",
                    cancellationToken);

                var attendance = await _context.Attendances
                    .FirstOrDefaultAsync(a => a.EmployeeId == employee.EmployeeId && a.AttendanceDate == targetDate, cancellationToken);

                if (attendance == null || !attendance.CheckInTime.HasValue)
                {
                    _logger.LogWarning("Check-out rejected for EmployeeId {EmployeeId} on {Date:yyyy-MM-dd}: No check-in found.",
                        employee.EmployeeId, targetDate);
                    return ServiceResult<AttendanceResponseDto>.BadRequest("Check-in is required before check-out.");
                }

                if (punchTime < attendance.CheckInTime.Value)
                {
                    return ServiceResult<AttendanceResponseDto>.BadRequest("Check-out time cannot be earlier than check-in time.");
                }

                // Last Check-out rule: Latest punch becomes official CheckOutTime
                if (!attendance.CheckOutTime.HasValue || punchTime > attendance.CheckOutTime.Value)
                {
                    attendance.CheckOutTime = punchTime;
                }

                // Calculate WorkingHours = LastCheckOut - FirstCheckIn
                var duration = attendance.CheckOutTime.Value - attendance.CheckInTime.Value;
                attendance.WorkHours = Math.Round(duration.TotalHours, 2);

                // Determine AttendanceStatus using exact TimeSpan duration comparisons
                if (duration > TimeSpan.FromHours(8))
                {
                    attendance.Status = AttendanceStatus.Present;
                }
                else if (duration >= TimeSpan.FromHours(4) && duration <= TimeSpan.FromHours(8))
                {
                    attendance.Status = AttendanceStatus.HalfDay;
                }
                else
                {
                    attendance.Status = AttendanceStatus.Absent;
                }

                if (!string.IsNullOrWhiteSpace(dto.Remarks))
                {
                    attendance.Remarks = dto.Remarks;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Check-out recorded for EmployeeId {EmployeeId} on {Date:yyyy-MM-dd} at {Time}. WorkingHours: {WorkHours}h, Status: {Status}.",
                    employee.EmployeeId, targetDate, attendance.CheckOutTime, attendance.WorkHours, attendance.Status);

                return ServiceResult<AttendanceResponseDto>.Success(ProjectToDto(attendance, employee), "Check-out recorded successfully.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Error recording check-out for EmployeeId {EmployeeId}.", employee.EmployeeId);
                throw;
            }
        }

        public async Task<AttendanceStatus> DetermineDateStatusAsync(
            int employeeId,
            DateTime date,
            CancellationToken cancellationToken = default)
        {
            var targetDate = date.Date;

            // Priority 1: Approved Leave -> OnLeave
            var hasApprovedLeave = await _context.Leaves
                .AsNoTracking()
                .AnyAsync(l => l.EmployeeId == employeeId &&
                               l.Status == LeaveStatus.Approved &&
                               l.StartDate <= targetDate && l.EndDate >= targetDate, cancellationToken);

            if (hasApprovedLeave)
            {
                return AttendanceStatus.OnLeave;
            }

            // Priority 2: Holiday -> Holiday
            var isHoliday = await _context.Holidays
                .AsNoTracking()
                .AnyAsync(h => h.IsActive && h.HolidayDate == targetDate, cancellationToken);

            if (isHoliday)
            {
                return AttendanceStatus.Holiday;
            }

            // Priority 3: Weekly Off -> WeekOff
            var weeklyOffs = _orgSettings.Value?.WeeklyOffDays ?? new List<DayOfWeek> { DayOfWeek.Saturday, DayOfWeek.Sunday };
            if (weeklyOffs.Contains(targetDate.DayOfWeek))
            {
                return AttendanceStatus.WeekOff;
            }

            // Priority 4: Normal Working Day -> Calculate attendance
            var attendance = await _context.Attendances
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.AttendanceDate == targetDate, cancellationToken);

            if (attendance != null && attendance.CheckInTime.HasValue)
            {
                if (attendance.CheckOutTime.HasValue)
                {
                    var duration = attendance.CheckOutTime.Value - attendance.CheckInTime.Value;
                    if (duration > TimeSpan.FromHours(8)) return AttendanceStatus.Present;
                    if (duration >= TimeSpan.FromHours(4) && duration <= TimeSpan.FromHours(8)) return AttendanceStatus.HalfDay;
                    return AttendanceStatus.Absent;
                }

                return targetDate == GetOrganizationToday() ? AttendanceStatus.Present : AttendanceStatus.Absent;
            }

            return AttendanceStatus.Absent;
        }

        public async Task<ServiceResult<PagedResponse<AttendanceResponseDto>>> GetMyAttendanceAsync(
            ClaimsPrincipal userPrincipal,
            AttendanceQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            var employee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<PagedResponse<AttendanceResponseDto>>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            queryParameters.EmployeeId = employee.EmployeeId;
            return await QueryAttendanceAsync(employee.EmployeeId, queryParameters, cancellationToken);
        }

        public async Task<ServiceResult<AttendanceResponseDto>> GetMyAttendanceByIdAsync(
            ClaimsPrincipal userPrincipal,
            int id,
            CancellationToken cancellationToken = default)
        {
            var employee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (employee is null)
            {
                return ServiceResult<AttendanceResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var attendance = await _context.Attendances
                .AsNoTracking()
                .Include(a => a.Employee)
                    .ThenInclude(e => e!.Department)
                .FirstOrDefaultAsync(a => a.AttendanceId == id && a.EmployeeId == employee.EmployeeId, cancellationToken);

            return attendance is null
                ? ServiceResult<AttendanceResponseDto>.NotFound("Attendance record was not found.")
                : ServiceResult<AttendanceResponseDto>.Success(ProjectToDto(attendance, attendance.Employee!), "Attendance record retrieved successfully.");
        }

        public async Task<ServiceResult<PagedResponse<AttendanceResponseDto>>> GetAttendanceAsync(
            ClaimsPrincipal userPrincipal,
            AttendanceQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            var callerEmployee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (callerEmployee is null)
            {
                return ServiceResult<PagedResponse<AttendanceResponseDto>>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var callerRoles = await GetUserRolesAsync(callerEmployee);
            var isAdminOrHr = callerRoles.Contains(AppRoles.Admin) || callerRoles.Contains(AppRoles.HR);
            var isManager = callerRoles.Contains(AppRoles.Manager) ||
                            await _context.Employees.AnyAsync(e => e.ManagerId == callerEmployee.EmployeeId, cancellationToken);

            if (!isAdminOrHr && !isManager)
            {
                return ServiceResult<PagedResponse<AttendanceResponseDto>>.Forbidden("You are not authorized to view department attendance records.");
            }

            int? managerScopeId = (!isAdminOrHr && isManager) ? callerEmployee.EmployeeId : null;
            return await QueryAttendanceAsync(queryParameters.EmployeeId, queryParameters, cancellationToken, managerScopeId);
        }

        public async Task<ServiceResult<AttendanceResponseDto>> GetAttendanceByIdAsync(
            ClaimsPrincipal userPrincipal,
            int id,
            CancellationToken cancellationToken = default)
        {
            var callerEmployee = await GetCurrentEmployeeAsync(userPrincipal, cancellationToken);
            if (callerEmployee is null)
            {
                return ServiceResult<AttendanceResponseDto>.Unauthorized("Authenticated user is not linked to an employee profile.");
            }

            var callerRoles = await GetUserRolesAsync(callerEmployee);
            var isAdminOrHr = callerRoles.Contains(AppRoles.Admin) || callerRoles.Contains(AppRoles.HR);
            var isManager = callerRoles.Contains(AppRoles.Manager) ||
                            await _context.Employees.AnyAsync(e => e.ManagerId == callerEmployee.EmployeeId, cancellationToken);

            if (!isAdminOrHr && !isManager)
            {
                return ServiceResult<AttendanceResponseDto>.Forbidden("You are not authorized to view this attendance record.");
            }

            var query = _context.Attendances
                .AsNoTracking()
                .Include(a => a.Employee)
                    .ThenInclude(e => e!.Department)
                .Where(a => a.AttendanceId == id);

            if (!isAdminOrHr && isManager)
            {
                query = query.Where(a => a.Employee!.ManagerId == callerEmployee.EmployeeId);
            }

            var attendance = await query.FirstOrDefaultAsync(cancellationToken);

            return attendance is null
                ? ServiceResult<AttendanceResponseDto>.NotFound("Attendance record was not found.")
                : ServiceResult<AttendanceResponseDto>.Success(ProjectToDto(attendance, attendance.Employee!), "Attendance record retrieved successfully.");
        }

        // =========================================================================
        // PRIVATE QUERY & HELPER METHODS
        // =========================================================================

        private async Task<ServiceResult<PagedResponse<AttendanceResponseDto>>> QueryAttendanceAsync(
            int? specificEmployeeId,
            AttendanceQueryParameters queryParameters,
            CancellationToken cancellationToken,
            int? managerSubordinateScopeId = null)
        {
            // If year and month provided, resolve to startDate and endDate
            var startDate = queryParameters.StartDate?.Date;
            var endDate = queryParameters.EndDate?.Date;

            if (queryParameters.Year.HasValue && queryParameters.Month.HasValue)
            {
                startDate = new DateTime(queryParameters.Year.Value, queryParameters.Month.Value, 1);
                endDate = startDate.Value.AddMonths(1).AddDays(-1);
            }
            else if (queryParameters.Year.HasValue)
            {
                startDate = new DateTime(queryParameters.Year.Value, 1, 1);
                endDate = new DateTime(queryParameters.Year.Value, 12, 31);
            }

            // If querying a single employee with an explicit date range, produce daily attendance for every calendar date
            if (specificEmployeeId.HasValue && startDate.HasValue && endDate.HasValue && (endDate.Value - startDate.Value).TotalDays <= 90)
            {
                return await GenerateDailyAttendanceRangeAsync(specificEmployeeId.Value, startDate.Value, endDate.Value, queryParameters, cancellationToken);
            }

            var query = _context.Attendances
                .AsNoTracking()
                .Include(a => a.Employee)
                    .ThenInclude(e => e!.Department)
                .AsQueryable();

            if (specificEmployeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == specificEmployeeId.Value);
            }

            if (managerSubordinateScopeId.HasValue)
            {
                query = query.Where(a => a.Employee!.ManagerId == managerSubordinateScopeId.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(a => a.AttendanceDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(a => a.AttendanceDate <= endDate.Value);
            }

            if (queryParameters.Status.HasValue)
            {
                query = query.Where(a => a.Status == queryParameters.Status.Value);
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(a => a.AttendanceDate)
                .ThenBy(a => a.EmployeeId)
                .Skip((queryParameters.Page - 1) * queryParameters.PageSize)
                .Take(queryParameters.PageSize)
                .Select(a => ProjectToDto(a, a.Employee!))
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<AttendanceResponseDto>
            {
                Items = items,
                Page = queryParameters.Page,
                PageSize = queryParameters.PageSize,
                TotalCount = totalCount,
                TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)queryParameters.PageSize)
            };

            return ServiceResult<PagedResponse<AttendanceResponseDto>>.Success(response, "Attendance records retrieved successfully.");
        }

        private async Task<ServiceResult<PagedResponse<AttendanceResponseDto>>> GenerateDailyAttendanceRangeAsync(
            int employeeId,
            DateTime startDate,
            DateTime endDate,
            AttendanceQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var employee = await _context.Employees
                .AsNoTracking()
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, cancellationToken);

            if (employee == null)
            {
                return ServiceResult<PagedResponse<AttendanceResponseDto>>.NotFound("Employee was not found.");
            }

            var attendances = await _context.Attendances
                .AsNoTracking()
                .Where(a => a.EmployeeId == employeeId && a.AttendanceDate >= startDate && a.AttendanceDate <= endDate)
                .ToDictionaryAsync(a => a.AttendanceDate.Date, cancellationToken);

            var approvedLeaves = await _context.Leaves
                .AsNoTracking()
                .Where(l => l.EmployeeId == employeeId &&
                            l.Status == LeaveStatus.Approved &&
                            l.StartDate <= endDate && l.EndDate >= startDate)
                .ToListAsync(cancellationToken);

            var holidays = await _context.Holidays
                .AsNoTracking()
                .Where(h => h.IsActive && h.HolidayDate >= startDate && h.HolidayDate <= endDate)
                .ToDictionaryAsync(h => h.HolidayDate.Date, cancellationToken);

            var weeklyOffs = _orgSettings.Value?.WeeklyOffDays ?? new List<DayOfWeek> { DayOfWeek.Saturday, DayOfWeek.Sunday };

            var dailyList = new List<AttendanceResponseDto>();

            for (var cur = startDate; cur <= endDate; cur = cur.AddDays(1))
            {
                var curDate = cur.Date;

                // Priority 1: Approved Leave -> OnLeave
                if (approvedLeaves.Any(l => l.StartDate <= curDate && l.EndDate >= curDate))
                {
                    dailyList.Add(new AttendanceResponseDto
                    {
                        AttendanceId = attendances.TryGetValue(curDate, out var att) ? att.AttendanceId : 0,
                        EmployeeId = employee.EmployeeId,
                        EmployeeCode = employee.EmployeeCode,
                        EmployeeName = employee.FullName,
                        DepartmentName = employee.Department?.DepartmentName,
                        AttendanceDate = curDate,
                        Status = AttendanceStatus.OnLeave,
                        Remarks = "Approved Leave"
                    });
                    continue;
                }

                // Priority 2: Holiday -> Holiday
                if (holidays.TryGetValue(curDate, out var hol))
                {
                    dailyList.Add(new AttendanceResponseDto
                    {
                        AttendanceId = attendances.TryGetValue(curDate, out var att) ? att.AttendanceId : 0,
                        EmployeeId = employee.EmployeeId,
                        EmployeeCode = employee.EmployeeCode,
                        EmployeeName = employee.FullName,
                        DepartmentName = employee.Department?.DepartmentName,
                        AttendanceDate = curDate,
                        Status = AttendanceStatus.Holiday,
                        Remarks = hol.HolidayName
                    });
                    continue;
                }

                // Priority 3: Weekly Off -> WeekOff
                if (weeklyOffs.Contains(curDate.DayOfWeek))
                {
                    dailyList.Add(new AttendanceResponseDto
                    {
                        AttendanceId = attendances.TryGetValue(curDate, out var att) ? att.AttendanceId : 0,
                        EmployeeId = employee.EmployeeId,
                        EmployeeCode = employee.EmployeeCode,
                        EmployeeName = employee.FullName,
                        DepartmentName = employee.Department?.DepartmentName,
                        AttendanceDate = curDate,
                        Status = AttendanceStatus.WeekOff,
                        Remarks = "Weekly Off"
                    });
                    continue;
                }

                // Priority 4: Stored Punch
                if (attendances.TryGetValue(curDate, out var storedAtt))
                {
                    dailyList.Add(ProjectToDto(storedAtt, employee));
                }
                else
                {
                    dailyList.Add(new AttendanceResponseDto
                    {
                        AttendanceId = 0,
                        EmployeeId = employee.EmployeeId,
                        EmployeeCode = employee.EmployeeCode,
                        EmployeeName = employee.FullName,
                        DepartmentName = employee.Department?.DepartmentName,
                        AttendanceDate = curDate,
                        Status = AttendanceStatus.Absent,
                        Remarks = "No Punch Recorded"
                    });
                }
            }

            if (queryParameters.Status.HasValue)
            {
                dailyList = dailyList.Where(d => d.Status == queryParameters.Status.Value).ToList();
            }

            var totalCount = dailyList.Count;
            var pagedItems = dailyList
                .OrderByDescending(d => d.AttendanceDate)
                .Skip((queryParameters.Page - 1) * queryParameters.PageSize)
                .Take(queryParameters.PageSize)
                .ToList();

            var response = new PagedResponse<AttendanceResponseDto>
            {
                Items = pagedItems,
                Page = queryParameters.Page,
                PageSize = queryParameters.PageSize,
                TotalCount = totalCount,
                TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)queryParameters.PageSize)
            };

            return ServiceResult<PagedResponse<AttendanceResponseDto>>.Success(response, "Daily attendance retrieved successfully.");
        }

        private static AttendanceResponseDto ProjectToDto(Attendance attendance, Employee employee)
        {
            return new AttendanceResponseDto
            {
                AttendanceId = attendance.AttendanceId,
                EmployeeId = attendance.EmployeeId,
                EmployeeCode = employee.EmployeeCode,
                EmployeeName = employee.FullName,
                DepartmentName = employee.Department?.DepartmentName,
                AttendanceDate = attendance.AttendanceDate,
                CheckInTime = attendance.CheckInTime,
                CheckOutTime = attendance.CheckOutTime,
                WorkHours = attendance.WorkHours,
                Status = attendance.Status,
                Remarks = attendance.Remarks
            };
        }

        private async Task<Employee?> GetCurrentEmployeeAsync(ClaimsPrincipal userPrincipal, CancellationToken cancellationToken)
        {
            var employeeIdClaim = userPrincipal.FindFirst("employeeId")?.Value;
            if (int.TryParse(employeeIdClaim, out var empId))
            {
                var emp = await _context.Employees
                    .Include(e => e.Department)
                    .Include(e => e.Role)
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
                        .Include(e => e.Department)
                        .Include(e => e.Role)
                        .FirstOrDefaultAsync(e => e.EmployeeId == appUser.EmployeeId.Value, cancellationToken);

                    if (emp is not null) return emp;
                }

                return await _context.Employees
                    .Include(e => e.Department)
                    .Include(e => e.Role)
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

        private TimeZoneInfo GetOrganizationTimeZone()
        {
            try
            {
                var tzId = _orgSettings.Value?.TimeZoneId;
                if (!string.IsNullOrWhiteSpace(tzId))
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(tzId);
                }
            }
            catch
            {
                // Fallback to local timezone if custom timezone identifier is not found on OS
            }

            return TimeZoneInfo.Local;
        }

        private DateTime GetOrganizationNow()
        {
            var tz = GetOrganizationTimeZone();
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        }

        private DateTime GetOrganizationToday()
        {
            return GetOrganizationNow().Date;
        }
    }
}
