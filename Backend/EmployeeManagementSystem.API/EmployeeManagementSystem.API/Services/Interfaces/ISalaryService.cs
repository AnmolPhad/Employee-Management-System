using System.Security.Claims;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Salary;

namespace EmployeeManagementSystem.API.Services.Interfaces
{
    public interface ISalaryService
    {
        // ===================== Admin/HR CRUD =====================

        /// <summary>
        /// Get all salary records with pagination and filters.
        /// </summary>
        Task<ServiceResult<PagedResponse<SalaryResponseDto>>> GetSalariesAsync(
            SalaryQueryParameters queryParameters, CancellationToken cancellationToken);

        /// <summary>
        /// Get a single salary record by ID.
        /// </summary>
        Task<ServiceResult<SalaryResponseDto>> GetSalaryByIdAsync(
            int salaryId, CancellationToken cancellationToken);

        /// <summary>
        /// Get salary history for a specific employee.
        /// </summary>
        Task<ServiceResult<IReadOnlyList<SalaryResponseDto>>> GetSalaryHistoryAsync(
            int employeeId, CancellationToken cancellationToken);

        /// <summary>
        /// Create a new salary record.
        /// Closes any previous active salary for the same employee.
        /// </summary>
        Task<ServiceResult<SalaryResponseDto>> CreateSalaryAsync(
            ClaimsPrincipal user, SalaryCreateDto dto, CancellationToken cancellationToken);

        /// <summary>
        /// Update an existing salary record.
        /// Only Active salary records can be updated.
        /// </summary>
        Task<ServiceResult<SalaryResponseDto>> UpdateSalaryAsync(
            int salaryId, ClaimsPrincipal user, SalaryUpdateDto dto, CancellationToken cancellationToken);

        /// <summary>
        /// Delete a salary record (soft delete — sets status to Inactive).
        /// </summary>
        Task<ServiceResult<bool>> DeleteSalaryAsync(
            int salaryId, CancellationToken cancellationToken);

        /// <summary>
        /// Increment salary — creates a new salary version, does NOT overwrite.
        /// Closes the current active salary and creates a new one.
        /// </summary>
        Task<ServiceResult<SalaryResponseDto>> IncrementSalaryAsync(
            int salaryId, ClaimsPrincipal user, SalaryIncrementDto dto, CancellationToken cancellationToken);

        // ===================== Dynamic Calculation =====================

        /// <summary>
        /// Calculate dynamic monthly salary for an employee for a given month.
        /// Integrates with Leave data to compute unpaid leave deductions.
        /// </summary>
        Task<ServiceResult<MonthlySalaryCalculationDto>> CalculateMonthlySalaryAsync(
            int employeeId, string month, CancellationToken cancellationToken);

        // ===================== Employee Self-Service =====================

        /// <summary>
        /// Get salary info for the logged-in employee (CTC only — restricted view).
        /// </summary>
        Task<ServiceResult<SalaryMeResponseDto>> GetMySalaryAsync(
            ClaimsPrincipal user, CancellationToken cancellationToken);

        // ===================== Settings =====================

        /// <summary>
        /// Get the current salary calculation settings.
        /// </summary>
        Task<ServiceResult<SalaryCalculationSettingsDto>> GetSettingsAsync(
            CancellationToken cancellationToken);

        /// <summary>
        /// Update the salary calculation settings.
        /// </summary>
        Task<ServiceResult<SalaryCalculationSettingsDto>> UpdateSettingsAsync(
            ClaimsPrincipal user, SalaryCalculationSettingsDto dto, CancellationToken cancellationToken);
    }
}
