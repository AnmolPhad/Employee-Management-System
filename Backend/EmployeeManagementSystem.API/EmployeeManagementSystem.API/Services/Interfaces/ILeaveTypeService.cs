using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.LeaveType;

namespace EmployeeManagementSystem.API.Services.Interfaces
{
    public interface ILeaveTypeService
    {
        Task<ServiceResult<PagedResponse<LeaveTypeResponseDto>>> GetLeaveTypesAsync(
            LeaveTypeQueryParameters queryParameters,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<LeaveTypeResponseDto>> GetLeaveTypeByIdAsync(
            int id,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<LeaveTypeResponseDto>> CreateLeaveTypeAsync(
            LeaveTypeCreateDto dto,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<LeaveTypeResponseDto>> UpdateLeaveTypeAsync(
            int id,
            LeaveTypeUpdateDto dto,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<bool>> DeleteLeaveTypeAsync(
            int id,
            CancellationToken cancellationToken = default);
    }
}
