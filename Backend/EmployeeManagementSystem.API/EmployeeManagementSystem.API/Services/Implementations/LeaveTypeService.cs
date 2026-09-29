using EmployeeManagementSystem.API.Data;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.LeaveType;
using EmployeeManagementSystem.API.Models;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.API.Services.Implementations
{
    public class LeaveTypeService : ILeaveTypeService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LeaveTypeService> _logger;

        public LeaveTypeService(ApplicationDbContext context, ILogger<LeaveTypeService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ServiceResult<PagedResponse<LeaveTypeResponseDto>>> GetLeaveTypesAsync(
            LeaveTypeQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            var query = _context.LeaveTypes.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(queryParameters.Search))
            {
                var search = queryParameters.Search.Trim();
                query = query.Where(lt =>
                    lt.LeaveTypeName.Contains(search) ||
                    (lt.Description != null && lt.Description.Contains(search)));
            }

            if (queryParameters.IsActive.HasValue)
            {
                query = query.Where(lt => lt.IsActive == queryParameters.IsActive.Value);
            }

            if (queryParameters.IsPaid.HasValue)
            {
                query = query.Where(lt => lt.IsPaid == queryParameters.IsPaid.Value);
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var leaveTypes = await query
                .OrderBy(lt => lt.LeaveTypeName)
                .Skip((queryParameters.Page - 1) * queryParameters.PageSize)
                .Take(queryParameters.PageSize)
                .Select(lt => new LeaveTypeResponseDto
                {
                    LeaveTypeId = lt.LeaveTypeId,
                    LeaveTypeName = lt.LeaveTypeName,
                    Description = lt.Description,
                    MaxDaysPerYear = lt.MaxDaysPerYear,
                    IsPaid = lt.IsPaid,
                    IsActive = lt.IsActive,
                    LeaveCount = lt.Leaves.Count()
                })
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<LeaveTypeResponseDto>
            {
                Items = leaveTypes,
                Page = queryParameters.Page,
                PageSize = queryParameters.PageSize,
                TotalCount = totalCount,
                TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)queryParameters.PageSize)
            };

            return ServiceResult<PagedResponse<LeaveTypeResponseDto>>.Success(response, "Leave types retrieved successfully.");
        }

        public async Task<ServiceResult<LeaveTypeResponseDto>> GetLeaveTypeByIdAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            var leaveType = await _context.LeaveTypes
                .AsNoTracking()
                .Where(lt => lt.LeaveTypeId == id)
                .Select(lt => new LeaveTypeResponseDto
                {
                    LeaveTypeId = lt.LeaveTypeId,
                    LeaveTypeName = lt.LeaveTypeName,
                    Description = lt.Description,
                    MaxDaysPerYear = lt.MaxDaysPerYear,
                    IsPaid = lt.IsPaid,
                    IsActive = lt.IsActive,
                    LeaveCount = lt.Leaves.Count()
                })
                .FirstOrDefaultAsync(cancellationToken);

            return leaveType is null
                ? ServiceResult<LeaveTypeResponseDto>.NotFound("Leave type was not found.")
                : ServiceResult<LeaveTypeResponseDto>.Success(leaveType, "Leave type retrieved successfully.");
        }

        public async Task<ServiceResult<LeaveTypeResponseDto>> CreateLeaveTypeAsync(
            LeaveTypeCreateDto dto,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(dto.LeaveTypeName))
            {
                return ServiceResult<LeaveTypeResponseDto>.BadRequest("Leave type name is required.");
            }

            var normalizedName = dto.LeaveTypeName.Trim();
            var duplicateExists = await _context.LeaveTypes
                .AnyAsync(lt => lt.LeaveTypeName == normalizedName, cancellationToken);

            if (duplicateExists)
            {
                return ServiceResult<LeaveTypeResponseDto>.Conflict("A leave type with this name already exists.");
            }

            var leaveType = new LeaveType
            {
                LeaveTypeName = normalizedName,
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                MaxDaysPerYear = dto.MaxDaysPerYear,
                IsPaid = dto.IsPaid,
                IsActive = dto.IsActive
            };

            _context.LeaveTypes.Add(leaveType);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Leave type {LeaveTypeName} (ID: {LeaveTypeId}) created successfully.", leaveType.LeaveTypeName, leaveType.LeaveTypeId);

            var created = await GetLeaveTypeByIdAsync(leaveType.LeaveTypeId, cancellationToken);
            return ServiceResult<LeaveTypeResponseDto>.Success(created.Data!, "Leave type created successfully.");
        }

        public async Task<ServiceResult<LeaveTypeResponseDto>> UpdateLeaveTypeAsync(
            int id,
            LeaveTypeUpdateDto dto,
            CancellationToken cancellationToken = default)
        {
            var leaveType = await _context.LeaveTypes
                .FirstOrDefaultAsync(lt => lt.LeaveTypeId == id, cancellationToken);

            if (leaveType is null)
            {
                return ServiceResult<LeaveTypeResponseDto>.NotFound("Leave type was not found.");
            }

            if (string.IsNullOrWhiteSpace(dto.LeaveTypeName))
            {
                return ServiceResult<LeaveTypeResponseDto>.BadRequest("Leave type name is required.");
            }

            var normalizedName = dto.LeaveTypeName.Trim();
            var duplicateExists = await _context.LeaveTypes
                .AnyAsync(lt => lt.LeaveTypeName == normalizedName && lt.LeaveTypeId != id, cancellationToken);

            if (duplicateExists)
            {
                return ServiceResult<LeaveTypeResponseDto>.Conflict("A leave type with this name already exists.");
            }

            leaveType.LeaveTypeName = normalizedName;
            leaveType.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            leaveType.MaxDaysPerYear = dto.MaxDaysPerYear;
            leaveType.IsPaid = dto.IsPaid;
            leaveType.IsActive = dto.IsActive;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Leave type ID {LeaveTypeId} updated successfully.", id);

            var updated = await GetLeaveTypeByIdAsync(id, cancellationToken);
            return ServiceResult<LeaveTypeResponseDto>.Success(updated.Data!, "Leave type updated successfully.");
        }

        public async Task<ServiceResult<bool>> DeleteLeaveTypeAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            var leaveType = await _context.LeaveTypes
                .FirstOrDefaultAsync(lt => lt.LeaveTypeId == id, cancellationToken);

            if (leaveType is null)
            {
                return ServiceResult<bool>.NotFound("Leave type was not found.");
            }

            var hasLeaves = await _context.Leaves
                .AnyAsync(l => l.LeaveTypeId == id, cancellationToken);

            if (hasLeaves)
            {
                return ServiceResult<bool>.Conflict("This leave type cannot be deleted because it is currently used by existing leave records.");
            }

            _context.LeaveTypes.Remove(leaveType);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Leave type ID {LeaveTypeId} deleted successfully.", id);

            return ServiceResult<bool>.Success(true, "Leave type deleted successfully.");
        }
    }
}
