using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Department;

namespace EmployeeManagementSystem.API.Services.Interfaces
{
    public interface IDepartmentService
    {
        Task<ServiceResult<PagedResponse<DepartmentResponseDto>>> GetDepartmentsAsync(DepartmentQueryParameters queryParameters, CancellationToken cancellationToken = default);
        Task<ServiceResult<DepartmentResponseDto>> GetDepartmentByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<ServiceResult<DepartmentResponseDto>> CreateDepartmentAsync(DepartmentCreateDto dto, CancellationToken cancellationToken = default);
        Task<ServiceResult<DepartmentResponseDto>> UpdateDepartmentAsync(int id, DepartmentUpdateDto dto, CancellationToken cancellationToken = default);
        Task<ServiceResult<bool>> DeleteDepartmentAsync(int id, CancellationToken cancellationToken = default);
    }
}
