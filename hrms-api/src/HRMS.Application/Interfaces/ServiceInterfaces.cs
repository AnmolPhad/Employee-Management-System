using HRMS.Application.Common;
using HRMS.Application.DTOs;

namespace HRMS.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse<UserProfileDto>> RegisterAsync(RegisterRequest request);
    Task<ApiResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request);
    Task<ApiResponse> RevokeTokenAsync(string refreshToken);
    Task<ApiResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<ApiResponse<UserProfileDto>> GetCurrentUserProfileAsync(int userId);
    Task<ApiResponse> AssignRolesAsync(AssignRoleRequest request);
    Task<ApiResponse<List<string>>> GetAllRolesAsync();
}

public interface IEmployeeService
{
    Task<ApiResponse<PagedResult<EmployeeDto>>> GetEmployeesAsync(EmployeeFilterRequest filter);
    Task<ApiResponse<EmployeeDto>> GetEmployeeByIdAsync(int id);
    Task<ApiResponse<EmployeeDto>> GetMyProfileAsync(int userId);
    Task<ApiResponse<EmployeeDto>> CreateEmployeeAsync(CreateEmployeeRequest request);
    Task<ApiResponse<EmployeeDto>> UpdateEmployeeAsync(int id, UpdateEmployeeRequest request);
    Task<ApiResponse<EmployeeDto>> UpdateSelfProfileAsync(int userId, UpdateSelfProfileRequest request);
    Task<ApiResponse> DeleteEmployeeAsync(int id); // Soft delete
    Task<ApiResponse<List<EmployeeDto>>> GetDirectReportsAsync(int managerEmployeeId);
    Task<ApiResponse<List<EmployeeDto>>> SearchEmployeesAsync(string query);
}

public interface IDepartmentService
{
    Task<ApiResponse<List<DepartmentDto>>> GetAllDepartmentsAsync();
    Task<ApiResponse<DepartmentDto>> GetDepartmentByIdAsync(int id);
    Task<ApiResponse<DepartmentDto>> CreateDepartmentAsync(CreateDepartmentRequest request);
    Task<ApiResponse<DepartmentDto>> UpdateDepartmentAsync(int id, UpdateDepartmentRequest request);
    Task<ApiResponse> DeleteDepartmentAsync(int id);
    Task<ApiResponse<List<EmployeeDto>>> GetDepartmentEmployeesAsync(int departmentId);
    Task<ApiResponse<List<OrgChartNodeDto>>> GetOrgChartAsync();
}

public interface IDesignationService
{
    Task<ApiResponse<List<DesignationDto>>> GetAllDesignationsAsync();
    Task<ApiResponse<DesignationDto>> GetDesignationByIdAsync(int id);
    Task<ApiResponse<DesignationDto>> CreateDesignationAsync(CreateDesignationRequest request);
    Task<ApiResponse<DesignationDto>> UpdateDesignationAsync(int id, UpdateDesignationRequest request);
    Task<ApiResponse> DeleteDesignationAsync(int id);
}

public interface ILeaveService
{
    Task<ApiResponse<List<LeaveTypeDto>>> GetLeaveTypesAsync();
    Task<ApiResponse<LeaveTypeDto>> CreateLeaveTypeAsync(CreateLeaveTypeRequest request);
    Task<ApiResponse<LeaveRequestDto>> ApplyLeaveAsync(int employeeId, ApplyLeaveRequest request);
    Task<ApiResponse<List<LeaveRequestDto>>> GetMyLeavesAsync(int employeeId);
    Task<ApiResponse<List<LeaveRequestDto>>> GetAllLeavesAsync(int? departmentId, int? status);
    Task<ApiResponse<List<LeaveRequestDto>>> GetPendingApprovalsAsync(int managerEmployeeId);
    Task<ApiResponse<LeaveRequestDto>> ApproveLeaveAsync(int leaveRequestId, int approverEmployeeId, ApproveRejectLeaveRequest request);
    Task<ApiResponse<LeaveRequestDto>> RejectLeaveAsync(int leaveRequestId, int approverEmployeeId, ApproveRejectLeaveRequest request);
    Task<ApiResponse> CancelLeaveAsync(int leaveRequestId, int employeeId);
    Task<ApiResponse<List<LeaveBalanceDto>>> GetLeaveBalancesAsync(int employeeId, int year);
    Task<ApiResponse> AdjustLeaveBalanceAsync(int employeeId, int leaveTypeId, int year, AdjustLeaveBalanceRequest request);
}

public interface IAttendanceService
{
    Task<ApiResponse<AttendanceDto>> CheckInAsync(int employeeId);
    Task<ApiResponse<AttendanceDto>> CheckOutAsync(int employeeId);
    Task<ApiResponse<List<AttendanceDto>>> GetMyAttendanceAsync(int employeeId, DateTime fromDate, DateTime toDate);
    Task<ApiResponse<List<AttendanceDto>>> GetEmployeeAttendanceAsync(int employeeId, DateTime fromDate, DateTime toDate);
    Task<ApiResponse<List<AttendanceReportDto>>> GetAttendanceReportAsync(int month, int year, int? departmentId);
}

public interface IPayrollService
{
    Task<ApiResponse<SalaryStructureDto>> GetSalaryStructureAsync(int employeeId);
    Task<ApiResponse<SalaryStructureDto>> UpsertSalaryStructureAsync(CreateSalaryStructureRequest request);
    Task<ApiResponse<List<PayslipDto>>> GeneratePayrollAsync(GeneratePayrollRequest request);
    Task<ApiResponse<List<PayslipDto>>> GetMyPayslipsAsync(int employeeId);
    Task<ApiResponse<List<PayslipDto>>> GetPayslipsAsync(int month, int year, int? departmentId);
    Task<ApiResponse<PayslipDto>> GetPayslipByIdAsync(int id);
    Task<ApiResponse<PayslipDto>> ApprovePayslipAsync(int id, int approverUserId);
}

public interface IPerformanceService
{
    Task<ApiResponse<PerformanceReviewDto>> CreateReviewAsync(CreateReviewRequest request);
    Task<ApiResponse<List<PerformanceReviewDto>>> GetMyReviewsAsync(int employeeId);
    Task<ApiResponse<List<PerformanceReviewDto>>> GetPendingReviewsForManagerAsync(int managerEmployeeId);
    Task<ApiResponse<List<PerformanceReviewDto>>> GetAllReviewsAsync(int? year, string? status);
    Task<ApiResponse<PerformanceReviewDto>> GetReviewByIdAsync(int id);
    Task<ApiResponse<PerformanceReviewDto>> SubmitSelfAssessmentAsync(int reviewId, int employeeId, SubmitSelfAssessmentRequest request);
    Task<ApiResponse<PerformanceReviewDto>> SubmitManagerReviewAsync(int reviewId, int managerEmployeeId, SubmitManagerReviewRequest request);
    Task<ApiResponse<PerformanceReviewDto>> FinalizeReviewAsync(int reviewId, FinalizeReviewRequest request);
}

public interface IAuditService
{
    Task LogAsync(Domain.Entities.AuditLog log);
}

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string bodyHtml);
    Task SendLeaveStatusNotificationAsync(string toEmail, string employeeName, string leaveType, string status, string? comments);
    Task SendPayslipGeneratedNotificationAsync(string toEmail, string employeeName, string monthYear, decimal netPay);
    Task SendReviewNotificationAsync(string toEmail, string employeeName, string reviewPeriod, string message);
}

public interface ITokenService
{
    string GenerateAccessToken(Domain.Entities.User user, IEnumerable<string> roles, IEnumerable<string> permissions);
    string GenerateRefreshToken();
}

public interface ICurrentUserService
{
    int? UserId { get; }
    string? Email { get; }
    int? EmployeeId { get; }
    IReadOnlyList<string> Roles { get; }
    IReadOnlyList<string> Permissions { get; }
    bool IsInRole(string role);
    bool HasPermission(string permission);
}
