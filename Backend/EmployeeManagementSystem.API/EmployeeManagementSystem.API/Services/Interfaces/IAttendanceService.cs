using System.Security.Claims;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Attendance;
using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.Services.Interfaces
{
    public interface IAttendanceService
    {
        Task<ServiceResult<AttendanceResponseDto>> CheckInAsync(
            ClaimsPrincipal userPrincipal,
            AttendanceCheckInDto dto,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<AttendanceResponseDto>> CheckOutAsync(
            ClaimsPrincipal userPrincipal,
            AttendanceCheckOutDto dto,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<PagedResponse<AttendanceResponseDto>>> GetMyAttendanceAsync(
            ClaimsPrincipal userPrincipal,
            AttendanceQueryParameters queryParameters,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<AttendanceResponseDto>> GetMyAttendanceByIdAsync(
            ClaimsPrincipal userPrincipal,
            int id,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<PagedResponse<AttendanceResponseDto>>> GetAttendanceAsync(
            ClaimsPrincipal userPrincipal,
            AttendanceQueryParameters queryParameters,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<AttendanceResponseDto>> GetAttendanceByIdAsync(
            ClaimsPrincipal userPrincipal,
            int id,
            CancellationToken cancellationToken = default);

        Task<AttendanceStatus> DetermineDateStatusAsync(
            int employeeId,
            DateTime date,
            CancellationToken cancellationToken = default);
    }
}
