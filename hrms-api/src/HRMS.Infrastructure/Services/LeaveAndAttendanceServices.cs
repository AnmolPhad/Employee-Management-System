using HRMS.Application.Common;
using HRMS.Application.DTOs;
using HRMS.Application.Interfaces;
using HRMS.Domain.Entities;
using HRMS.Domain.Enums;
using HRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HRMS.Infrastructure.Services;

public class LeaveService : ILeaveService
{
    private readonly HrmsDbContext _context;
    private readonly IEmailService _emailService;

    public LeaveService(HrmsDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<ApiResponse<List<LeaveTypeDto>>> GetLeaveTypesAsync()
    {
        var types = await _context.LeaveTypes
            .Where(t => t.IsActive)
            .Select(t => new LeaveTypeDto
            {
                Id = t.Id,
                Name = t.Name,
                Code = t.Code,
                DefaultDaysPerYear = t.DefaultDaysPerYear,
                IsCarryForward = t.IsCarryForward,
                MaxCarryForwardDays = t.MaxCarryForwardDays,
                IsActive = t.IsActive
            })
            .ToListAsync();

        return ApiResponse<List<LeaveTypeDto>>.Ok(types);
    }

    public async Task<ApiResponse<LeaveTypeDto>> CreateLeaveTypeAsync(CreateLeaveTypeRequest request)
    {
        var type = new LeaveType
        {
            Name = request.Name.Trim(),
            Code = request.Code?.Trim().ToUpper(),
            DefaultDaysPerYear = request.DefaultDaysPerYear,
            IsCarryForward = request.IsCarryForward,
            MaxCarryForwardDays = request.MaxCarryForwardDays,
            CreatedAt = DateTime.UtcNow
        };

        _context.LeaveTypes.Add(type);
        await _context.SaveChangesAsync();

        return ApiResponse<LeaveTypeDto>.Ok(new LeaveTypeDto
        {
            Id = type.Id,
            Name = type.Name,
            Code = type.Code,
            DefaultDaysPerYear = type.DefaultDaysPerYear,
            IsCarryForward = type.IsCarryForward,
            MaxCarryForwardDays = type.MaxCarryForwardDays,
            IsActive = type.IsActive
        });
    }

    public async Task<ApiResponse<LeaveRequestDto>> ApplyLeaveAsync(int employeeId, ApplyLeaveRequest request)
    {
        if (request.EndDate < request.StartDate)
            return ApiResponse<LeaveRequestDto>.Fail("End date must be greater than or equal to start date.");

        var days = (request.EndDate.Date - request.StartDate.Date).Days + 1;
        var year = request.StartDate.Year;

        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(b => b.EmployeeId == employeeId && b.LeaveTypeId == request.LeaveTypeId && b.Year == year);

        if (balance == null || balance.RemainingLeaves < days)
        {
            return ApiResponse<LeaveRequestDto>.Fail($"Insufficient leave balance. Available: {balance?.RemainingLeaves ?? 0} days, requested: {days} days.");
        }

        var leave = new LeaveRequest
        {
            EmployeeId = employeeId,
            LeaveTypeId = request.LeaveTypeId,
            StartDate = request.StartDate.Date,
            EndDate = request.EndDate.Date,
            TotalDays = days,
            Reason = request.Reason.Trim(),
            Status = LeaveStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.LeaveRequests.Add(leave);
        await _context.SaveChangesAsync();

        return await GetLeaveRequestDtoByIdAsync(leave.Id);
    }

    public async Task<ApiResponse<List<LeaveRequestDto>>> GetMyLeavesAsync(int employeeId)
    {
        var leaves = await _context.LeaveRequests
            .Include(l => l.Employee)
            .Include(l => l.LeaveType)
            .Include(l => l.ApprovedBy)
            .Where(l => l.EmployeeId == employeeId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => MapToDto(l))
            .ToListAsync();

        return ApiResponse<List<LeaveRequestDto>>.Ok(leaves);
    }

    public async Task<ApiResponse<List<LeaveRequestDto>>> GetAllLeavesAsync(int? departmentId, int? status)
    {
        var query = _context.LeaveRequests
            .Include(l => l.Employee)
            .Include(l => l.LeaveType)
            .Include(l => l.ApprovedBy)
            .AsQueryable();

        if (departmentId.HasValue)
            query = query.Where(l => l.Employee.DepartmentId == departmentId.Value);

        if (status.HasValue)
            query = query.Where(l => (int)l.Status == status.Value);

        var list = await query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => MapToDto(l))
            .ToListAsync();

        return ApiResponse<List<LeaveRequestDto>>.Ok(list);
    }

    public async Task<ApiResponse<List<LeaveRequestDto>>> GetPendingApprovalsAsync(int managerEmployeeId)
    {
        var list = await _context.LeaveRequests
            .Include(l => l.Employee)
            .Include(l => l.LeaveType)
            .Include(l => l.ApprovedBy)
            .Where(l => l.Employee.ReportingManagerId == managerEmployeeId && l.Status == LeaveStatus.Pending)
            .OrderBy(l => l.StartDate)
            .Select(l => MapToDto(l))
            .ToListAsync();

        return ApiResponse<List<LeaveRequestDto>>.Ok(list);
    }

    public async Task<ApiResponse<LeaveRequestDto>> ApproveLeaveAsync(int leaveRequestId, int approverEmployeeId, ApproveRejectLeaveRequest request)
    {
        var leave = await _context.LeaveRequests
            .Include(l => l.Employee)
            .Include(l => l.LeaveType)
            .FirstOrDefaultAsync(l => l.Id == leaveRequestId);

        if (leave == null) return ApiResponse<LeaveRequestDto>.Fail("Leave request not found.");
        if (leave.Status != LeaveStatus.Pending) return ApiResponse<LeaveRequestDto>.Fail("Only pending leave requests can be approved.");

        // Deduct from balance
        var year = leave.StartDate.Year;
        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(b => b.EmployeeId == leave.EmployeeId && b.LeaveTypeId == leave.LeaveTypeId && b.Year == year);

        if (balance != null)
        {
            balance.UsedLeaves += leave.TotalDays;
            balance.UpdatedAt = DateTime.UtcNow;
        }

        leave.Status = LeaveStatus.Approved;
        leave.ApprovedById = approverEmployeeId;
        leave.ManagerComments = request.Comments;
        leave.ActionedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Email notification
        await _emailService.SendLeaveStatusNotificationAsync(
            leave.Employee.Email,
            $"{leave.Employee.FirstName} {leave.Employee.LastName}",
            leave.LeaveType.Name,
            "Approved",
            request.Comments);

        return await GetLeaveRequestDtoByIdAsync(leave.Id);
    }

    public async Task<ApiResponse<LeaveRequestDto>> RejectLeaveAsync(int leaveRequestId, int approverEmployeeId, ApproveRejectLeaveRequest request)
    {
        var leave = await _context.LeaveRequests
            .Include(l => l.Employee)
            .Include(l => l.LeaveType)
            .FirstOrDefaultAsync(l => l.Id == leaveRequestId);

        if (leave == null) return ApiResponse<LeaveRequestDto>.Fail("Leave request not found.");
        if (leave.Status != LeaveStatus.Pending) return ApiResponse<LeaveRequestDto>.Fail("Only pending leave requests can be rejected.");

        leave.Status = LeaveStatus.Rejected;
        leave.ApprovedById = approverEmployeeId;
        leave.ManagerComments = request.Comments;
        leave.ActionedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Email notification
        await _emailService.SendLeaveStatusNotificationAsync(
            leave.Employee.Email,
            $"{leave.Employee.FirstName} {leave.Employee.LastName}",
            leave.LeaveType.Name,
            "Rejected",
            request.Comments);

        return await GetLeaveRequestDtoByIdAsync(leave.Id);
    }

    public async Task<ApiResponse> CancelLeaveAsync(int leaveRequestId, int employeeId)
    {
        var leave = await _context.LeaveRequests.FirstOrDefaultAsync(l => l.Id == leaveRequestId && l.EmployeeId == employeeId);
        if (leave == null) return ApiResponse.Fail("Leave request not found.");
        if (leave.Status != LeaveStatus.Pending) return ApiResponse.Fail("Only pending requests can be cancelled.");

        leave.Status = LeaveStatus.Cancelled;
        leave.ActionedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse.Ok("Leave request cancelled.");
    }

    public async Task<ApiResponse<List<LeaveBalanceDto>>> GetLeaveBalancesAsync(int employeeId, int year)
    {
        var balances = await _context.LeaveBalances
            .Include(b => b.Employee)
            .Include(b => b.LeaveType)
            .Where(b => b.EmployeeId == employeeId && b.Year == year)
            .Select(b => new LeaveBalanceDto
            {
                Id = b.Id,
                EmployeeId = b.EmployeeId,
                EmployeeName = $"{b.Employee.FirstName} {b.Employee.LastName}".Trim(),
                LeaveTypeId = b.LeaveTypeId,
                LeaveTypeName = b.LeaveType.Name,
                Year = b.Year,
                TotalLeaves = b.TotalLeaves,
                UsedLeaves = b.UsedLeaves,
                RemainingLeaves = b.RemainingLeaves
            })
            .ToListAsync();

        return ApiResponse<List<LeaveBalanceDto>>.Ok(balances);
    }

    public async Task<ApiResponse> AdjustLeaveBalanceAsync(int employeeId, int leaveTypeId, int year, AdjustLeaveBalanceRequest request)
    {
        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(b => b.EmployeeId == employeeId && b.LeaveTypeId == leaveTypeId && b.Year == year);

        if (balance == null)
        {
            balance = new LeaveBalance
            {
                EmployeeId = employeeId,
                LeaveTypeId = leaveTypeId,
                Year = year,
                TotalLeaves = request.TotalLeaves,
                UsedLeaves = request.UsedLeaves,
                CreatedAt = DateTime.UtcNow
            };
            _context.LeaveBalances.Add(balance);
        }
        else
        {
            balance.TotalLeaves = request.TotalLeaves;
            balance.UsedLeaves = request.UsedLeaves;
            balance.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return ApiResponse.Ok("Leave balance adjusted.");
    }

    private async Task<ApiResponse<LeaveRequestDto>> GetLeaveRequestDtoByIdAsync(int id)
    {
        var leave = await _context.LeaveRequests
            .Include(l => l.Employee)
            .Include(l => l.LeaveType)
            .Include(l => l.ApprovedBy)
            .FirstOrDefaultAsync(l => l.Id == id);

        return leave != null
            ? ApiResponse<LeaveRequestDto>.Ok(MapToDto(leave))
            : ApiResponse<LeaveRequestDto>.Fail("Leave request not found.");
    }

    private static LeaveRequestDto MapToDto(LeaveRequest l) => new()
    {
        Id = l.Id,
        EmployeeId = l.EmployeeId,
        EmployeeName = $"{l.Employee.FirstName} {l.Employee.LastName}".Trim(),
        EmployeeCode = l.Employee.EmployeeCode,
        LeaveTypeId = l.LeaveTypeId,
        LeaveTypeName = l.LeaveType?.Name ?? "",
        StartDate = l.StartDate,
        EndDate = l.EndDate,
        TotalDays = l.TotalDays,
        Reason = l.Reason,
        Status = l.Status,
        ApprovedById = l.ApprovedById,
        ApprovedByName = l.ApprovedBy != null ? $"{l.ApprovedBy.FirstName} {l.ApprovedBy.LastName}".Trim() : null,
        ManagerComments = l.ManagerComments,
        CreatedAt = l.CreatedAt
    };
}

public class AttendanceService : IAttendanceService
{
    private readonly HrmsDbContext _context;

    public AttendanceService(HrmsDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<AttendanceDto>> CheckInAsync(int employeeId)
    {
        var today = DateTime.UtcNow.Date;
        var existing = await _context.Attendances.FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date == today);

        if (existing != null)
        {
            return ApiResponse<AttendanceDto>.Fail("Already checked in for today.");
        }

        var now = DateTime.UtcNow.TimeOfDay;
        var att = new Attendance
        {
            EmployeeId = employeeId,
            Date = today,
            CheckIn = now,
            Status = AttendanceStatus.Present,
            CreatedAt = DateTime.UtcNow
        };

        _context.Attendances.Add(att);
        await _context.SaveChangesAsync();

        return ApiResponse<AttendanceDto>.Ok(MapToDto(att));
    }

    public async Task<ApiResponse<AttendanceDto>> CheckOutAsync(int employeeId)
    {
        var today = DateTime.UtcNow.Date;
        var att = await _context.Attendances.FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date == today);

        if (att == null)
        {
            return ApiResponse<AttendanceDto>.Fail("No check-in record found for today.");
        }

        var now = DateTime.UtcNow.TimeOfDay;
        att.CheckOut = now;

        if (att.CheckIn.HasValue)
        {
            var diff = (now - att.CheckIn.Value).TotalHours;
            att.TotalHours = Math.Round((decimal)diff, 2);
            att.Status = att.TotalHours < 4 ? AttendanceStatus.HalfDay : AttendanceStatus.Present;
        }

        att.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<AttendanceDto>.Ok(MapToDto(att));
    }

    public async Task<ApiResponse<List<AttendanceDto>>> GetMyAttendanceAsync(int employeeId, DateTime fromDate, DateTime toDate)
    {
        var list = await _context.Attendances
            .Include(a => a.Employee)
            .Where(a => a.EmployeeId == employeeId && a.Date >= fromDate.Date && a.Date <= toDate.Date)
            .OrderByDescending(a => a.Date)
            .Select(a => MapToDto(a))
            .ToListAsync();

        return ApiResponse<List<AttendanceDto>>.Ok(list);
    }

    public async Task<ApiResponse<List<AttendanceDto>>> GetEmployeeAttendanceAsync(int employeeId, DateTime fromDate, DateTime toDate)
    {
        return await GetMyAttendanceAsync(employeeId, fromDate, toDate);
    }

    public async Task<ApiResponse<List<AttendanceReportDto>>> GetAttendanceReportAsync(int month, int year, int? departmentId)
    {
        var query = _context.Employees.Where(e => e.IsActive);
        if (departmentId.HasValue)
            query = query.Where(e => e.DepartmentId == departmentId.Value);

        var employees = await query.ToListAsync();
        var fromDate = new DateTime(year, month, 1);
        var toDate = fromDate.AddMonths(1).AddDays(-1);
        var daysInMonth = DateTime.DaysInMonth(year, month);

        var attendances = await _context.Attendances
            .Where(a => a.Date >= fromDate && a.Date <= toDate)
            .ToListAsync();

        var reports = new List<AttendanceReportDto>();

        foreach (var emp in employees)
        {
            var empAtt = attendances.Where(a => a.EmployeeId == emp.Id).ToList();
            var presentDays = empAtt.Count(a => a.Status == AttendanceStatus.Present);
            var halfDays = empAtt.Count(a => a.Status == AttendanceStatus.HalfDay);
            var leaveDays = empAtt.Count(a => a.Status == AttendanceStatus.OnLeave);
            var totalHours = empAtt.Sum(a => a.TotalHours);

            reports.Add(new AttendanceReportDto
            {
                EmployeeId = emp.Id,
                EmployeeName = $"{emp.FirstName} {emp.LastName}".Trim(),
                Month = month,
                Year = year,
                TotalWorkingDays = daysInMonth, // Simple approximation
                PresentDays = presentDays,
                HalfDays = halfDays,
                LeaveDays = leaveDays,
                AbsentDays = Math.Max(0, daysInMonth - (presentDays + halfDays + leaveDays)),
                TotalHoursLogged = totalHours
            });
        }

        return ApiResponse<List<AttendanceReportDto>>.Ok(reports);
    }

    private static AttendanceDto MapToDto(Attendance a) => new()
    {
        Id = a.Id,
        EmployeeId = a.EmployeeId,
        EmployeeName = a.Employee != null ? $"{a.Employee.FirstName} {a.Employee.LastName}".Trim() : "",
        Date = a.Date,
        CheckIn = a.CheckIn,
        CheckOut = a.CheckOut,
        TotalHours = a.TotalHours,
        Status = a.Status,
        Remarks = a.Remarks
    };
}
