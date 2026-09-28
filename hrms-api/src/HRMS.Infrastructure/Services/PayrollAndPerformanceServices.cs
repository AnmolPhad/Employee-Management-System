using HRMS.Application.Common;
using HRMS.Application.DTOs;
using HRMS.Application.Interfaces;
using HRMS.Domain.Entities;
using HRMS.Domain.Enums;
using HRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HRMS.Infrastructure.Services;

public class PayrollService : IPayrollService
{
    private readonly HrmsDbContext _context;
    private readonly IEmailService _emailService;

    public PayrollService(HrmsDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<ApiResponse<SalaryStructureDto>> GetSalaryStructureAsync(int employeeId)
    {
        var structure = await _context.SalaryStructures
            .Include(s => s.Employee)
            .OrderByDescending(s => s.EffectiveFrom)
            .FirstOrDefaultAsync(s => s.EmployeeId == employeeId);

        if (structure == null)
            return ApiResponse<SalaryStructureDto>.Fail("Salary structure not defined for this employee.");

        return ApiResponse<SalaryStructureDto>.Ok(MapToDto(structure));
    }

    public async Task<ApiResponse<SalaryStructureDto>> UpsertSalaryStructureAsync(CreateSalaryStructureRequest request)
    {
        var existing = await _context.SalaryStructures
            .FirstOrDefaultAsync(s => s.EmployeeId == request.EmployeeId);

        if (existing == null)
        {
            existing = new SalaryStructure
            {
                EmployeeId = request.EmployeeId,
                CreatedAt = DateTime.UtcNow
            };
            _context.SalaryStructures.Add(existing);
        }

        existing.BasicSalary = request.BasicSalary;
        existing.HRA = request.HRA;
        existing.DA = request.DA;
        existing.MedicalAllowance = request.MedicalAllowance;
        existing.ConveyanceAllowance = request.ConveyanceAllowance;
        existing.SpecialAllowance = request.SpecialAllowance;
        existing.PF = request.PF;
        existing.ESI = request.ESI;
        existing.ProfessionalTax = request.ProfessionalTax;
        existing.TDS = request.TDS;
        existing.EffectiveFrom = request.EffectiveFrom;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetSalaryStructureAsync(request.EmployeeId);
    }

    public async Task<ApiResponse<List<PayslipDto>>> GeneratePayrollAsync(GeneratePayrollRequest request)
    {
        var query = _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Where(e => e.IsActive);

        if (request.DepartmentId.HasValue)
            query = query.Where(e => e.DepartmentId == request.DepartmentId.Value);

        var employees = await query.ToListAsync();
        var daysInMonth = DateTime.DaysInMonth(request.Year, request.Month);
        var generatedPayslips = new List<Payslip>();

        foreach (var emp in employees)
        {
            var salary = await _context.SalaryStructures
                .OrderByDescending(s => s.EffectiveFrom)
                .FirstOrDefaultAsync(s => s.EmployeeId == emp.Id);

            if (salary == null) continue; // Skip employees without configured salary

            // Check if already generated
            var existing = await _context.Payslips
                .FirstOrDefaultAsync(p => p.EmployeeId == emp.Id && p.Month == request.Month && p.Year == request.Year);

            if (existing != null)
            {
                generatedPayslips.Add(existing);
                continue;
            }

            var gross = salary.GrossSalary;
            var deductions = salary.TotalDeductions;
            var net = salary.NetSalary;

            var payslip = new Payslip
            {
                EmployeeId = emp.Id,
                SalaryStructureId = salary.Id,
                Month = request.Month,
                Year = request.Year,
                WorkingDays = daysInMonth,
                PresentDays = daysInMonth, // standard default
                LeaveDays = 0,
                BasicSalary = salary.BasicSalary,
                Allowances = salary.GrossSalary - salary.BasicSalary,
                GrossPay = gross,
                Deductions = deductions,
                NetPay = net,
                Status = PayslipStatus.Generated,
                GeneratedOn = DateTime.UtcNow
            };

            _context.Payslips.Add(payslip);
            generatedPayslips.Add(payslip);

            // Send notification
            await _emailService.SendPayslipGeneratedNotificationAsync(
                emp.Email,
                $"{emp.FirstName} {emp.LastName}",
                $"{request.Month:D2}/{request.Year}",
                net);
        }

        await _context.SaveChangesAsync();

        var dtos = generatedPayslips.Select(p => MapToPayslipDto(p, employees.FirstOrDefault(e => e.Id == p.EmployeeId))).ToList();
        return ApiResponse<List<PayslipDto>>.Ok(dtos, $"Generated payroll for {generatedPayslips.Count} employees.");
    }

    public async Task<ApiResponse<List<PayslipDto>>> GetMyPayslipsAsync(int employeeId)
    {
        var list = await _context.Payslips
            .Include(p => p.Employee)
                .ThenInclude(e => e.Department)
            .Include(p => p.Employee)
                .ThenInclude(e => e.Designation)
            .Where(p => p.EmployeeId == employeeId)
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .Select(p => MapToPayslipDto(p, p.Employee))
            .ToListAsync();

        return ApiResponse<List<PayslipDto>>.Ok(list);
    }

    public async Task<ApiResponse<List<PayslipDto>>> GetPayslipsAsync(int month, int year, int? departmentId)
    {
        var query = _context.Payslips
            .Include(p => p.Employee)
                .ThenInclude(e => e.Department)
            .Include(p => p.Employee)
                .ThenInclude(e => e.Designation)
            .Where(p => p.Month == month && p.Year == year);

        if (departmentId.HasValue)
            query = query.Where(p => p.Employee.DepartmentId == departmentId.Value);

        var list = await query
            .OrderBy(p => p.Employee.LastName)
            .Select(p => MapToPayslipDto(p, p.Employee))
            .ToListAsync();

        return ApiResponse<List<PayslipDto>>.Ok(list);
    }

    public async Task<ApiResponse<PayslipDto>> GetPayslipByIdAsync(int id)
    {
        var p = await _context.Payslips
            .Include(p => p.Employee)
                .ThenInclude(e => e.Department)
            .Include(p => p.Employee)
                .ThenInclude(e => e.Designation)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p == null) return ApiResponse<PayslipDto>.Fail("Payslip not found.");
        return ApiResponse<PayslipDto>.Ok(MapToPayslipDto(p, p.Employee));
    }

    public async Task<ApiResponse<PayslipDto>> ApprovePayslipAsync(int id, int approverUserId)
    {
        var p = await _context.Payslips
            .Include(p => p.Employee)
                .ThenInclude(e => e.Department)
            .Include(p => p.Employee)
                .ThenInclude(e => e.Designation)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p == null) return ApiResponse<PayslipDto>.Fail("Payslip not found.");

        p.Status = PayslipStatus.Approved;
        p.ApprovedOn = DateTime.UtcNow;
        p.ApprovedById = approverUserId;
        await _context.SaveChangesAsync();

        return ApiResponse<PayslipDto>.Ok(MapToPayslipDto(p, p.Employee), "Payslip approved.");
    }

    private static SalaryStructureDto MapToDto(SalaryStructure s) => new()
    {
        Id = s.Id,
        EmployeeId = s.EmployeeId,
        EmployeeName = s.Employee != null ? $"{s.Employee.FirstName} {s.Employee.LastName}".Trim() : "",
        BasicSalary = s.BasicSalary,
        HRA = s.HRA,
        DA = s.DA,
        MedicalAllowance = s.MedicalAllowance,
        ConveyanceAllowance = s.ConveyanceAllowance,
        SpecialAllowance = s.SpecialAllowance,
        PF = s.PF,
        ESI = s.ESI,
        ProfessionalTax = s.ProfessionalTax,
        TDS = s.TDS,
        GrossSalary = s.GrossSalary,
        TotalDeductions = s.TotalDeductions,
        NetSalary = s.NetSalary,
        EffectiveFrom = s.EffectiveFrom
    };

    private static PayslipDto MapToPayslipDto(Payslip p, Employee? e) => new()
    {
        Id = p.Id,
        EmployeeId = p.EmployeeId,
        EmployeeName = e != null ? $"{e.FirstName} {e.LastName}".Trim() : "",
        EmployeeCode = e?.EmployeeCode ?? "",
        DepartmentName = e?.Department?.Name ?? "",
        DesignationTitle = e?.Designation?.Title ?? "",
        Month = p.Month,
        Year = p.Year,
        WorkingDays = p.WorkingDays,
        PresentDays = p.PresentDays,
        LeaveDays = p.LeaveDays,
        BasicSalary = p.BasicSalary,
        Allowances = p.Allowances,
        GrossPay = p.GrossPay,
        Deductions = p.Deductions,
        NetPay = p.NetPay,
        Status = p.Status,
        GeneratedOn = p.GeneratedOn
    };
}

public class PerformanceService : IPerformanceService
{
    private readonly HrmsDbContext _context;
    private readonly IEmailService _emailService;

    public PerformanceService(HrmsDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<ApiResponse<PerformanceReviewDto>> CreateReviewAsync(CreateReviewRequest request)
    {
        var employee = await _context.Employees.FindAsync(request.EmployeeId);
        if (employee == null) return ApiResponse<PerformanceReviewDto>.Fail("Employee not found.");

        var reviewer = await _context.Employees.FindAsync(request.ReviewerId);
        if (reviewer == null) return ApiResponse<PerformanceReviewDto>.Fail("Reviewer not found.");

        var review = new PerformanceReview
        {
            EmployeeId = request.EmployeeId,
            ReviewerId = request.ReviewerId,
            ReviewPeriod = request.ReviewPeriod.Trim(),
            Year = request.Year,
            Status = ReviewStatus.SelfAssessmentPending,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var goalReq in request.Goals)
        {
            review.Goals.Add(new ReviewGoal
            {
                GoalTitle = goalReq.GoalTitle.Trim(),
                Description = goalReq.Description.Trim(),
                Weightage = goalReq.Weightage
            });
        }

        _context.PerformanceReviews.Add(review);
        await _context.SaveChangesAsync();

        await _emailService.SendReviewNotificationAsync(
            employee.Email,
            employee.FullName,
            review.ReviewPeriod,
            "A new review cycle has been initiated. Please submit your self-assessment.");

        return await GetReviewByIdAsync(review.Id);
    }

    public async Task<ApiResponse<List<PerformanceReviewDto>>> GetMyReviewsAsync(int employeeId)
    {
        var list = await _context.PerformanceReviews
            .Include(r => r.Employee)
            .Include(r => r.Reviewer)
            .Include(r => r.Goals)
            .Where(r => r.EmployeeId == employeeId)
            .OrderByDescending(r => r.Year)
            .Select(r => MapToDto(r))
            .ToListAsync();

        return ApiResponse<List<PerformanceReviewDto>>.Ok(list);
    }

    public async Task<ApiResponse<List<PerformanceReviewDto>>> GetPendingReviewsForManagerAsync(int managerEmployeeId)
    {
        var list = await _context.PerformanceReviews
            .Include(r => r.Employee)
            .Include(r => r.Reviewer)
            .Include(r => r.Goals)
            .Where(r => r.ReviewerId == managerEmployeeId && r.Status == ReviewStatus.ManagerReviewPending)
            .OrderBy(r => r.CreatedAt)
            .Select(r => MapToDto(r))
            .ToListAsync();

        return ApiResponse<List<PerformanceReviewDto>>.Ok(list);
    }

    public async Task<ApiResponse<List<PerformanceReviewDto>>> GetAllReviewsAsync(int? year, string? status)
    {
        var query = _context.PerformanceReviews
            .Include(r => r.Employee)
            .Include(r => r.Reviewer)
            .Include(r => r.Goals)
            .AsQueryable();

        if (year.HasValue) query = query.Where(r => r.Year == year.Value);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ReviewStatus>(status, true, out var revStatus))
            query = query.Where(r => r.Status == revStatus);

        var list = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => MapToDto(r))
            .ToListAsync();

        return ApiResponse<List<PerformanceReviewDto>>.Ok(list);
    }

    public async Task<ApiResponse<PerformanceReviewDto>> GetReviewByIdAsync(int id)
    {
        var r = await _context.PerformanceReviews
            .Include(r => r.Employee)
            .Include(r => r.Reviewer)
            .Include(r => r.Goals)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (r == null) return ApiResponse<PerformanceReviewDto>.Fail("Performance review not found.");
        return ApiResponse<PerformanceReviewDto>.Ok(MapToDto(r));
    }

    public async Task<ApiResponse<PerformanceReviewDto>> SubmitSelfAssessmentAsync(int reviewId, int employeeId, SubmitSelfAssessmentRequest request)
    {
        var review = await _context.PerformanceReviews
            .Include(r => r.Goals)
            .Include(r => r.Reviewer)
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.EmployeeId == employeeId);

        if (review == null) return ApiResponse<PerformanceReviewDto>.Fail("Review not found.");
        if (review.Status != ReviewStatus.SelfAssessmentPending)
            return ApiResponse<PerformanceReviewDto>.Fail("Self assessment cannot be submitted in the current review status.");

        review.SelfRating = request.SelfRating;
        review.SelfComments = request.SelfComments.Trim();
        review.Status = ReviewStatus.ManagerReviewPending;
        review.SubmittedAt = DateTime.UtcNow;

        if (request.GoalScores != null)
        {
            foreach (var goal in review.Goals)
            {
                if (request.GoalScores.TryGetValue(goal.Id, out var score))
                    goal.SelfScore = score;
            }
        }

        await _context.SaveChangesAsync();

        if (review.Reviewer != null)
        {
            await _emailService.SendReviewNotificationAsync(
                review.Reviewer.Email,
                review.Reviewer.FullName,
                review.ReviewPeriod,
                "Employee self-assessment has been submitted and is ready for your manager review.");
        }

        return await GetReviewByIdAsync(reviewId);
    }

    public async Task<ApiResponse<PerformanceReviewDto>> SubmitManagerReviewAsync(int reviewId, int managerEmployeeId, SubmitManagerReviewRequest request)
    {
        var review = await _context.PerformanceReviews
            .Include(r => r.Goals)
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.ReviewerId == managerEmployeeId);

        if (review == null) return ApiResponse<PerformanceReviewDto>.Fail("Review not found.");
        if (review.Status != ReviewStatus.ManagerReviewPending)
            return ApiResponse<PerformanceReviewDto>.Fail("Review is not pending manager evaluation.");

        review.ManagerRating = request.ManagerRating;
        review.ManagerComments = request.ManagerComments.Trim();
        review.Status = ReviewStatus.HRReviewPending;
        review.ManagerReviewedAt = DateTime.UtcNow;

        if (request.GoalScores != null)
        {
            foreach (var goal in review.Goals)
            {
                if (request.GoalScores.TryGetValue(goal.Id, out var score))
                    goal.ManagerScore = score;
            }
        }

        await _context.SaveChangesAsync();
        return await GetReviewByIdAsync(reviewId);
    }

    public async Task<ApiResponse<PerformanceReviewDto>> FinalizeReviewAsync(int reviewId, FinalizeReviewRequest request)
    {
        var review = await _context.PerformanceReviews
            .Include(r => r.Employee)
            .FirstOrDefaultAsync(r => r.Id == reviewId);

        if (review == null) return ApiResponse<PerformanceReviewDto>.Fail("Review not found.");

        review.FinalRating = request.FinalRating;
        review.HRComments = request.HRComments.Trim();
        review.Status = ReviewStatus.Completed;
        review.FinalizedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        if (review.Employee != null)
        {
            await _emailService.SendReviewNotificationAsync(
                review.Employee.Email,
                review.Employee.FullName,
                review.ReviewPeriod,
                $"Your performance review has been finalized. Final Rating: {request.FinalRating:N1}/5.0");
        }

        return await GetReviewByIdAsync(reviewId);
    }

    private static PerformanceReviewDto MapToDto(PerformanceReview r) => new()
    {
        Id = r.Id,
        EmployeeId = r.EmployeeId,
        EmployeeName = r.Employee != null ? $"{r.Employee.FirstName} {r.Employee.LastName}".Trim() : "",
        EmployeeCode = r.Employee?.EmployeeCode ?? "",
        ReviewerId = r.ReviewerId,
        ReviewerName = r.Reviewer != null ? $"{r.Reviewer.FirstName} {r.Reviewer.LastName}".Trim() : "",
        ReviewPeriod = r.ReviewPeriod,
        Year = r.Year,
        SelfRating = r.SelfRating,
        ManagerRating = r.ManagerRating,
        FinalRating = r.FinalRating,
        SelfComments = r.SelfComments,
        ManagerComments = r.ManagerComments,
        HRComments = r.HRComments,
        Status = r.Status,
        CreatedAt = r.CreatedAt,
        Goals = r.Goals.Select(g => new ReviewGoalDto
        {
            Id = g.Id,
            PerformanceReviewId = g.PerformanceReviewId,
            GoalTitle = g.GoalTitle,
            Description = g.Description,
            Weightage = g.Weightage,
            SelfScore = g.SelfScore,
            ManagerScore = g.ManagerScore,
            Comments = g.Comments
        }).ToList()
    };
}
