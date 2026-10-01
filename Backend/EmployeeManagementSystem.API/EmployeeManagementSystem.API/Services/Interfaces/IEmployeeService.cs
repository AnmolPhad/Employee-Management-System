using System.Security.Claims;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Employee;

namespace EmployeeManagementSystem.API.Services.Interfaces
{
    public interface IEmployeeService
    {
        Task<ServiceResult<PagedResponse<EmployeeResponseDto>>> GetEmployeesAsync(EmployeeQueryParameters queryParameters, ClaimsPrincipal? user = null, CancellationToken cancellationToken = default);
        Task<ServiceResult<EmployeeResponseDto>> GetEmployeeByIdAsync(int id, ClaimsPrincipal? user = null, CancellationToken cancellationToken = default);
        Task<ServiceResult<List<EmployeeResponseDto>>> GetManagerCandidatesAsync(CancellationToken cancellationToken = default);
        Task<ServiceResult<List<RoleResponseDto>>> GetRolesAsync(bool includeAdminRole = true, CancellationToken cancellationToken = default);
        Task<ServiceResult<EmployeeResponseDto>> CreateEmployeeAsync(EmployeeCreateDto dto, ClaimsPrincipal? user = null, CancellationToken cancellationToken = default);
        Task<ServiceResult<EmployeeResponseDto>> UpdateEmployeeAsync(int id, EmployeeUpdateDto dto, ClaimsPrincipal? user = null, CancellationToken cancellationToken = default);
        Task<ServiceResult<EmployeeResponseDto>> UpdatePersonalDetailsAsync(int id, EmployeePersonalUpdateDto dto, ClaimsPrincipal? user = null, CancellationToken cancellationToken = default);
        Task<ServiceResult<bool>> DeleteEmployeeAsync(int id, ClaimsPrincipal? user = null, CancellationToken cancellationToken = default);
        Task<ServiceResult<EmployeeResponseDto>> GetMyProfileAsync(string userId, CancellationToken cancellationToken = default);
    }
}
