using System.Security.Claims;
using EmployeeManagementSystem.API.Data;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Salary;
using EmployeeManagementSystem.API.Models;
using EmployeeManagementSystem.API.Models.Enums;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.API.Services.Implementations
{
    public class SalaryService : ISalaryService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<SalaryService> _logger;

        public SalaryService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<SalaryService> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        // =====================================================================
        // ADMIN/HR CRUD
        // =====================================================================

        public async Task<ServiceResult<PagedResponse<SalaryResponseDto>>> GetSalariesAsync(
            SalaryQueryParameters queryParameters, CancellationToken cancellationToken)
        {
            var query = _context.Salaries
                .Include(s => s.Employee)
                .AsNoTracking()
                .AsQueryable();

            // Filters
            if (queryParameters.EmployeeId.HasValue)
                query = query.Where(s => s.EmployeeId == queryParameters.EmployeeId.Value);

            if (!string.IsNullOrWhiteSpace(queryParameters.Status) &&
                Enum.TryParse<SalaryStatus>(queryParameters.Status, true, out var statusFilter))
                query = query.Where(s => s.Status == statusFilter);

            // Sorting
            query = queryParameters.SortBy?.ToLowerInvariant() switch
            {
                "annualctc" => queryParameters.SortOrder?.ToLowerInvariant() == "asc"
                    ? query.OrderBy(s => s.AnnualCTC) : query.OrderByDescending(s => s.AnnualCTC),
                "basicsalary" => queryParameters.SortOrder?.ToLowerInvariant() == "asc"
                    ? query.OrderBy(s => s.BasicSalary) : query.OrderByDescending(s => s.BasicSalary),
                "createdat" => queryParameters.SortOrder?.ToLowerInvariant() == "asc"
                    ? query.OrderBy(s => s.CreatedAt) : query.OrderByDescending(s => s.CreatedAt),
                _ => queryParameters.SortOrder?.ToLowerInvariant() == "asc"
                    ? query.OrderBy(s => s.EffectiveFrom) : query.OrderByDescending(s => s.EffectiveFrom)
            };

            var totalCount = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, queryParameters.Page);
            var pageSize = Math.Clamp(queryParameters.PageSize, 1, 100);
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => MapToResponseDto(s))
                .ToListAsync(cancellationToken);

            var pagedResponse = new PagedResponse<SalaryResponseDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };

            return ServiceResult<PagedResponse<SalaryResponseDto>>.Success(pagedResponse, "Salaries retrieved successfully.");
        }

        public async Task<ServiceResult<SalaryResponseDto>> GetSalaryByIdAsync(
            int salaryId, CancellationToken cancellationToken)
        {
            var salary = await _context.Salaries
                .Include(s => s.Employee)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.SalaryId == salaryId, cancellationToken);

            if (salary == null)
                return ServiceResult<SalaryResponseDto>.NotFound($"Salary record with ID {salaryId} not found.");

            return ServiceResult<SalaryResponseDto>.Success(MapToResponseDto(salary), "Salary record retrieved successfully.");
        }

        public async Task<ServiceResult<IReadOnlyList<SalaryResponseDto>>> GetSalaryHistoryAsync(
            int employeeId, CancellationToken cancellationToken)
        {
            var employee = await _context.Employees.AsNoTracking()
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, cancellationToken);

            if (employee == null)
                return ServiceResult<IReadOnlyList<SalaryResponseDto>>.NotFound($"Employee with ID {employeeId} not found.");

            var salaries = await _context.Salaries
                .Include(s => s.Employee)
                .AsNoTracking()
                .Where(s => s.EmployeeId == employeeId)
                .OrderByDescending(s => s.EffectiveFrom)
                .Select(s => MapToResponseDto(s))
                .ToListAsync(cancellationToken);

            return ServiceResult<IReadOnlyList<SalaryResponseDto>>.Success(salaries, $"Salary history for employee {employeeId} retrieved. {salaries.Count} record(s).");
        }

        public async Task<ServiceResult<SalaryResponseDto>> CreateSalaryAsync(
            ClaimsPrincipal user, SalaryCreateDto dto, CancellationToken cancellationToken)
        {
            // Validate employee exists
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == dto.EmployeeId, cancellationToken);

            if (employee == null)
                return ServiceResult<SalaryResponseDto>.NotFound($"Employee with ID {dto.EmployeeId} not found.");

            // Get global settings for default PF percentage
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            var pfPercentage = dto.PFPercentage ?? settings.PFPercentage;

            // Close any existing active salary for this employee
            var activeSalary = await _context.Salaries
                .Where(s => s.EmployeeId == dto.EmployeeId && s.Status == SalaryStatus.Active)
                .FirstOrDefaultAsync(cancellationToken);

            if (activeSalary != null)
            {
                activeSalary.Status = SalaryStatus.Revised;
                activeSalary.EffectiveTo = dto.EffectiveFrom.AddDays(-1);
                activeSalary.UpdatedAt = DateTime.UtcNow;
            }

            // Calculate BasicSalary from AnnualCTC (monthly = annual / 12)
            var basicSalary = Math.Round(dto.AnnualCTC / 12m, 2);

            var salary = new Salary
            {
                EmployeeId = dto.EmployeeId,
                AnnualCTC = dto.AnnualCTC,
                BasicSalary = basicSalary,
                PFPercentage = pfPercentage,
                Allowances = dto.Allowances,
                Deductions = dto.Deductions,
                EffectiveFrom = dto.EffectiveFrom,
                Status = SalaryStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            salary.CalculateNetSalary();

            _context.Salaries.Add(salary);
            await _context.SaveChangesAsync(cancellationToken);

            // Reload with Employee navigation
            await _context.Entry(salary).Reference(s => s.Employee).LoadAsync(cancellationToken);

            _logger.LogInformation("Created salary record {SalaryId} for employee {EmployeeId} with CTC {CTC}.",
                salary.SalaryId, salary.EmployeeId, salary.AnnualCTC);

            return ServiceResult<SalaryResponseDto>.Success(MapToResponseDto(salary), "Salary record created successfully.");
        }

        public async Task<ServiceResult<SalaryResponseDto>> UpdateSalaryAsync(
            int salaryId, ClaimsPrincipal user, SalaryUpdateDto dto, CancellationToken cancellationToken)
        {
            var salary = await _context.Salaries
                .Include(s => s.Employee)
                .FirstOrDefaultAsync(s => s.SalaryId == salaryId, cancellationToken);

            if (salary == null)
                return ServiceResult<SalaryResponseDto>.NotFound($"Salary record with ID {salaryId} not found.");

            if (salary.Status != SalaryStatus.Active)
                return ServiceResult<SalaryResponseDto>.BadRequest("Only active salary records can be updated. Use increment for creating a new version.");

            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            var pfPercentage = dto.PFPercentage ?? settings.PFPercentage;

            salary.AnnualCTC = dto.AnnualCTC;
            salary.BasicSalary = Math.Round(dto.AnnualCTC / 12m, 2);
            salary.PFPercentage = pfPercentage;
            salary.Allowances = dto.Allowances;
            salary.Deductions = dto.Deductions;
            salary.EffectiveFrom = dto.EffectiveFrom;
            salary.UpdatedAt = DateTime.UtcNow;

            salary.CalculateNetSalary();

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated salary record {SalaryId} for employee {EmployeeId}.",
                salary.SalaryId, salary.EmployeeId);

            return ServiceResult<SalaryResponseDto>.Success(MapToResponseDto(salary), "Salary record updated successfully.");
        }

        public async Task<ServiceResult<bool>> DeleteSalaryAsync(
            int salaryId, CancellationToken cancellationToken)
        {
            var salary = await _context.Salaries
                .FirstOrDefaultAsync(s => s.SalaryId == salaryId, cancellationToken);

            if (salary == null)
                return ServiceResult<bool>.NotFound($"Salary record with ID {salaryId} not found.");

            salary.Status = SalaryStatus.Inactive;
            salary.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Soft-deleted salary record {SalaryId}.", salaryId);

            return ServiceResult<bool>.Success(true, "Salary record deleted (deactivated) successfully.");
        }

        public async Task<ServiceResult<SalaryResponseDto>> IncrementSalaryAsync(
            int salaryId, ClaimsPrincipal user, SalaryIncrementDto dto, CancellationToken cancellationToken)
        {
            var currentSalary = await _context.Salaries
                .Include(s => s.Employee)
                .FirstOrDefaultAsync(s => s.SalaryId == salaryId, cancellationToken);

            if (currentSalary == null)
                return ServiceResult<SalaryResponseDto>.NotFound($"Salary record with ID {salaryId} not found.");

            if (currentSalary.Status != SalaryStatus.Active)
                return ServiceResult<SalaryResponseDto>.BadRequest("Only active salary records can be incremented.");

            if (dto.NewAnnualCTC <= currentSalary.AnnualCTC)
                return ServiceResult<SalaryResponseDto>.BadRequest(
                    $"New Annual CTC ({dto.NewAnnualCTC:F2}) must be greater than current CTC ({currentSalary.AnnualCTC:F2}).");

            // Close the current salary
            currentSalary.Status = SalaryStatus.Revised;
            currentSalary.EffectiveTo = dto.EffectiveFrom.AddDays(-1);
            currentSalary.UpdatedAt = DateTime.UtcNow;

            // Get global settings for default PF percentage
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            var pfPercentage = dto.PFPercentage ?? settings.PFPercentage;

            var basicSalary = Math.Round(dto.NewAnnualCTC / 12m, 2);

            var newSalary = new Salary
            {
                EmployeeId = currentSalary.EmployeeId,
                AnnualCTC = dto.NewAnnualCTC,
                BasicSalary = basicSalary,
                PFPercentage = pfPercentage,
                Allowances = dto.Allowances,
                Deductions = dto.Deductions,
                EffectiveFrom = dto.EffectiveFrom,
                Status = SalaryStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            newSalary.CalculateNetSalary();

            _context.Salaries.Add(newSalary);
            await _context.SaveChangesAsync(cancellationToken);

            // Reload with Employee navigation
            await _context.Entry(newSalary).Reference(s => s.Employee).LoadAsync(cancellationToken);

            _logger.LogInformation(
                "Incremented salary for employee {EmployeeId}. Old SalaryId={OldId}, New SalaryId={NewId}, CTC: {OldCTC} -> {NewCTC}.",
                currentSalary.EmployeeId, salaryId, newSalary.SalaryId, currentSalary.AnnualCTC, newSalary.AnnualCTC);

            return ServiceResult<SalaryResponseDto>.Success(MapToResponseDto(newSalary),
                $"Salary incremented successfully. Previous record (ID: {salaryId}) marked as Revised.");
        }

        // =====================================================================
        // DYNAMIC MONTHLY CALCULATION
        // =====================================================================

        public async Task<ServiceResult<MonthlySalaryCalculationDto>> CalculateMonthlySalaryAsync(
            int employeeId, string month, CancellationToken cancellationToken)
        {
            // Parse month string (expected format: "yyyy-MM")
            if (!DateTime.TryParseExact(month, "yyyy-MM", null, System.Globalization.DateTimeStyles.None, out var monthDate))
                return ServiceResult<MonthlySalaryCalculationDto>.BadRequest("Invalid month format. Use yyyy-MM (e.g. 2026-09).");

            var monthStart = new DateTime(monthDate.Year, monthDate.Month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            // Check employee exists
            var employee = await _context.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, cancellationToken);

            if (employee == null)
                return ServiceResult<MonthlySalaryCalculationDto>.NotFound($"Employee with ID {employeeId} not found.");

            // Find the salary record active during this month
            // A salary is active for a month if: EffectiveFrom <= monthEnd AND (EffectiveTo is null OR EffectiveTo >= monthStart)
            // and Status is Active or Revised (Revised means it was active during that period).
            var salary = await _context.Salaries
                .AsNoTracking()
                .Where(s => s.EmployeeId == employeeId
                    && s.EffectiveFrom <= monthEnd
                    && (s.EffectiveTo == null || s.EffectiveTo >= monthStart))
                .OrderByDescending(s => s.EffectiveFrom)
                .FirstOrDefaultAsync(cancellationToken);

            if (salary == null)
                return ServiceResult<MonthlySalaryCalculationDto>.NotFound(
                    $"No salary record found for employee {employeeId} for month {month}.");

            // Get settings for unpaid leave divisor
            var settings = await GetOrCreateSettingsAsync(cancellationToken);

            // Count unpaid leave days in the given month
            // Unpaid leave = leaves where LeaveType.IsPaid == false AND Status == Approved
            // AND dates overlap with the month
            var unpaidLeaveDays = await _context.Leaves
                .Include(l => l.LeaveType)
                .AsNoTracking()
                .Where(l => l.EmployeeId == employeeId
                    && l.Status == LeaveStatus.Approved
                    && l.LeaveType!.IsPaid == false
                    && l.StartDate <= monthEnd
                    && l.EndDate >= monthStart)
                .SumAsync(l =>
                    // Calculate only the days that fall within this month
                    (EF.Functions.DateDiffDay(
                        l.StartDate < monthStart ? monthStart : l.StartDate,
                        l.EndDate > monthEnd ? monthEnd : l.EndDate) + 1),
                    cancellationToken);

            var dailySalary = settings.UnpaidLeaveDivisor > 0
                ? Math.Round(salary.BasicSalary / settings.UnpaidLeaveDivisor, 2)
                : 0;

            var unpaidLeaveDeduction = Math.Round(dailySalary * unpaidLeaveDays, 2);

            var monthlyGross = salary.BasicSalary + salary.Allowances - salary.Deductions - salary.PFAmount;
            var netSalary = monthlyGross - unpaidLeaveDeduction;

            var result = new MonthlySalaryCalculationDto
            {
                EmployeeId = employeeId,
                EmployeeName = employee.FullName,
                EmployeeCode = employee.EmployeeCode,
                Month = month,
                AnnualCTC = salary.AnnualCTC,
                MonthlyBasicSalary = salary.BasicSalary,
                PFPercentage = salary.PFPercentage,
                PFAmount = salary.PFAmount,
                Allowances = salary.Allowances,
                Deductions = salary.Deductions,
                MonthlyGrossSalary = monthlyGross,
                TotalUnpaidLeaveDays = unpaidLeaveDays,
                DailySalary = dailySalary,
                UnpaidLeaveDeduction = unpaidLeaveDeduction,
                NetSalary = netSalary,
                UnpaidLeaveDivisor = settings.UnpaidLeaveDivisor
            };

            return ServiceResult<MonthlySalaryCalculationDto>.Success(result,
                $"Monthly salary calculated for {employee.FullName} ({month}). Unpaid leave days: {unpaidLeaveDays}.");
        }

        // =====================================================================
        // EMPLOYEE SELF-SERVICE
        // =====================================================================

        public async Task<ServiceResult<SalaryMeResponseDto>> GetMySalaryAsync(
            ClaimsPrincipal user, CancellationToken cancellationToken)
        {
            var employeeId = await ResolveEmployeeIdAsync(user, cancellationToken);

            if (employeeId == null)
                return ServiceResult<SalaryMeResponseDto>.NotFound("Could not determine your employee profile.");

            var salary = await _context.Salaries
                .AsNoTracking()
                .Where(s => s.EmployeeId == employeeId.Value && s.Status == SalaryStatus.Active)
                .OrderByDescending(s => s.EffectiveFrom)
                .FirstOrDefaultAsync(cancellationToken);

            if (salary == null)
                return ServiceResult<SalaryMeResponseDto>.NotFound("No active salary record found for your profile.");

            var dto = new SalaryMeResponseDto
            {
                AnnualCTC = salary.AnnualCTC,
                EffectiveFrom = salary.EffectiveFrom,
                EffectiveTo = salary.EffectiveTo,
                Status = salary.Status.ToString()
            };

            return ServiceResult<SalaryMeResponseDto>.Success(dto, "Your salary information retrieved successfully.");
        }

        // =====================================================================
        // SETTINGS
        // =====================================================================

        public async Task<ServiceResult<SalaryCalculationSettingsDto>> GetSettingsAsync(
            CancellationToken cancellationToken)
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);

            var dto = new SalaryCalculationSettingsDto
            {
                SalaryCycle = settings.SalaryCycle,
                UnpaidLeaveDivisor = settings.UnpaidLeaveDivisor,
                PFPercentage = settings.PFPercentage
            };

            return ServiceResult<SalaryCalculationSettingsDto>.Success(dto, "Salary calculation settings retrieved.");
        }

        public async Task<ServiceResult<SalaryCalculationSettingsDto>> UpdateSettingsAsync(
            ClaimsPrincipal user, SalaryCalculationSettingsDto dto, CancellationToken cancellationToken)
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);

            settings.SalaryCycle = dto.SalaryCycle;
            settings.UnpaidLeaveDivisor = dto.UnpaidLeaveDivisor;
            settings.PFPercentage = dto.PFPercentage;
            settings.UpdatedAt = DateTime.UtcNow;
            settings.UpdatedBy = user.FindFirstValue(ClaimTypes.Email) ?? "Admin";

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Salary calculation settings updated by {User}.", settings.UpdatedBy);

            return ServiceResult<SalaryCalculationSettingsDto>.Success(dto, "Salary calculation settings updated successfully.");
        }

        // =====================================================================
        // PRIVATE HELPERS
        // =====================================================================

        private async Task<SalaryCalculationSettings> GetOrCreateSettingsAsync(CancellationToken cancellationToken)
        {
            var settings = await _context.SalaryCalculationSettings.FirstOrDefaultAsync(cancellationToken);

            if (settings == null)
            {
                settings = new SalaryCalculationSettings
                {
                    SalaryCycle = "Monthly",
                    UnpaidLeaveDivisor = 30m,
                    PFPercentage = 12.00m
                };
                _context.SalaryCalculationSettings.Add(settings);
                await _context.SaveChangesAsync(cancellationToken);
            }

            return settings;
        }

        private async Task<int?> ResolveEmployeeIdAsync(ClaimsPrincipal user, CancellationToken cancellationToken)
        {
            // Try employeeId claim first (set during JWT generation)
            var employeeIdClaim = user.FindFirstValue("employeeId");
            if (int.TryParse(employeeIdClaim, out var empId))
                return empId;

            // Fallback: resolve via Identity user -> Employee link
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return null;

            var appUser = await _userManager.FindByIdAsync(userId);
            return appUser?.EmployeeId;
        }

        private static SalaryResponseDto MapToResponseDto(Salary salary)
        {
            return new SalaryResponseDto
            {
                SalaryId = salary.SalaryId,
                EmployeeId = salary.EmployeeId,
                EmployeeName = salary.Employee?.FullName ?? string.Empty,
                EmployeeCode = salary.Employee?.EmployeeCode ?? string.Empty,
                AnnualCTC = salary.AnnualCTC,
                BasicSalary = salary.BasicSalary,
                PFPercentage = salary.PFPercentage,
                PFAmount = salary.PFAmount,
                Allowances = salary.Allowances,
                Deductions = salary.Deductions,
                NetSalary = salary.NetSalary,
                EffectiveFrom = salary.EffectiveFrom,
                EffectiveTo = salary.EffectiveTo,
                Status = salary.Status.ToString(),
                CreatedAt = salary.CreatedAt,
                UpdatedAt = salary.UpdatedAt
            };
        }
    }
}
