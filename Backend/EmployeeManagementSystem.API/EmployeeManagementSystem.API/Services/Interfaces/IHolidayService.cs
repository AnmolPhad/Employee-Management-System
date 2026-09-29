using System.Security.Claims;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Holiday;

namespace EmployeeManagementSystem.API.Services.Interfaces
{
    public interface IHolidayService
    {
        Task<ServiceResult<PagedResponse<HolidayResponseDto>>> GetHolidaysAsync(
            HolidayQueryParameters queryParameters,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<HolidayResponseDto>> GetHolidayByIdAsync(
            int id,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<HolidayResponseDto>> CreateHolidayAsync(
            ClaimsPrincipal userPrincipal,
            HolidayCreateDto dto,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<HolidayResponseDto>> UpdateHolidayAsync(
            int id,
            ClaimsPrincipal userPrincipal,
            HolidayUpdateDto dto,
            CancellationToken cancellationToken = default);

        Task<ServiceResult<bool>> DeleteHolidayAsync(
            int id,
            CancellationToken cancellationToken = default);
    }
}
