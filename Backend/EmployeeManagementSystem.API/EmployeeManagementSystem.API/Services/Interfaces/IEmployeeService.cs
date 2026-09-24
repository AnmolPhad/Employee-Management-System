using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Employee;

namespace EmployeeManagementSystem.API.Services.Interfaces
{
    public interface IEmployeeService
    {
        Task<ServiceResult<PagedResponse<EmployeeResponseDto>>> GetEmployeesAsync(EmployeeQueryParameters queryParameters, CancellationToken cancellationToken = default);
        Task<ServiceResult<EmployeeResponseDto>> GetEmployeeByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<ServiceResult<EmployeeResponseDto>> CreateEmployeeAsync(EmployeeCreateDto dto, CancellationToken cancellationToken = default);
        Task<ServiceResult<EmployeeResponseDto>> UpdateEmployeeAsync(int id, EmployeeUpdateDto dto, CancellationToken cancellationToken = default);
        Task<ServiceResult<bool>> DeleteEmployeeAsync(int id, CancellationToken cancellationToken = default);
        Task<ServiceResult<EmployeeResponseDto>> GetMyProfileAsync(string userId, CancellationToken cancellationToken = default);
    }
}
