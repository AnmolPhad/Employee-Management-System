using System.Security.Claims;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Leave;

namespace EmployeeManagementSystem.API.Services.Interfaces
{
    public interface ILeaveService
    {
        Task<ServiceResult<LeaveResponseDto>> ApplyLeaveAsync(
            ClaimsPrincipal userPrincipal,
            LeaveCreateDto dto,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<PagedResponse<LeaveResponseDto>>> GetMyLeavesAsync(
            ClaimsPrincipal userPrincipal,
            LeaveQueryParameters queryParameters,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<LeaveResponseDto>> GetMyLeaveByIdAsync(
            ClaimsPrincipal userPrincipal,
            int leaveId,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<IReadOnlyList<LeaveBalanceResponseDto>>> GetMyLeaveBalanceAsync(
            ClaimsPrincipal userPrincipal,
            int? year = null,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<IReadOnlyList<ActiveLeaveTypeResponseDto>>> GetActiveLeaveTypesAsync(
            CancellationToken cancellationToken = default);

        Task<ServiceResult<PagedResponse<LeaveResponseDto>>> GetLeavesAsync(
            ClaimsPrincipal userPrincipal,
            LeaveQueryParameters queryParameters,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<LeaveResponseDto>> GetLeaveByIdAsync(
            ClaimsPrincipal userPrincipal,
            int leaveId,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<LeaveResponseDto>> ApproveLeaveAsync(
            ClaimsPrincipal userPrincipal,
            int leaveId,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<LeaveResponseDto>> RejectLeaveAsync(
            ClaimsPrincipal userPrincipal,
            int leaveId,
            LeaveRejectionDto dto,
            CancellationToken cancellationToken = default);
    }
}
