using System.Security.Claims;
using EmployeeManagementSystem.API.Data;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Holiday;
using EmployeeManagementSystem.API.Models;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.API.Services.Implementations
{
    public class HolidayService : IHolidayService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<HolidayService> _logger;

        public HolidayService(ApplicationDbContext context, ILogger<HolidayService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ServiceResult<PagedResponse<HolidayResponseDto>>> GetHolidaysAsync(
            HolidayQueryParameters queryParameters,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Holidays.AsNoTracking().AsQueryable();

            if (queryParameters.Year.HasValue)
            {
                var year = queryParameters.Year.Value;
                var startOfYear = new DateTime(year, 1, 1);
                var endOfYear = new DateTime(year, 12, 31);
                query = query.Where(h => h.HolidayDate >= startOfYear && h.HolidayDate <= endOfYear);
            }

            if (queryParameters.IsActive.HasValue)
            {
                query = query.Where(h => h.IsActive == queryParameters.IsActive.Value);
            }

            if (!string.IsNullOrWhiteSpace(queryParameters.Search))
            {
                var search = queryParameters.Search.Trim();
                query = query.Where(h => h.HolidayName.Contains(search) || (h.Description != null && h.Description.Contains(search)));
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderBy(h => h.HolidayDate)
                .Skip((queryParameters.Page - 1) * queryParameters.PageSize)
                .Take(queryParameters.PageSize)
                .Select(h => new HolidayResponseDto
                {
                    HolidayId = h.HolidayId,
                    HolidayName = h.HolidayName,
                    HolidayDate = h.HolidayDate,
                    Description = h.Description,
                    IsActive = h.IsActive,
                    CreatedBy = h.CreatedBy,
                    CreatedAt = h.CreatedAt,
                    UpdatedAt = h.UpdatedAt
                })
                .ToListAsync(cancellationToken);

            var response = new PagedResponse<HolidayResponseDto>
            {
                Items = items,
                Page = queryParameters.Page,
                PageSize = queryParameters.PageSize,
                TotalCount = totalCount,
                TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)queryParameters.PageSize)
            };

            return ServiceResult<PagedResponse<HolidayResponseDto>>.Success(response, "Holidays retrieved successfully.");
        }

        public async Task<ServiceResult<HolidayResponseDto>> GetHolidayByIdAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            var holiday = await _context.Holidays
                .AsNoTracking()
                .Where(h => h.HolidayId == id)
                .Select(h => new HolidayResponseDto
                {
                    HolidayId = h.HolidayId,
                    HolidayName = h.HolidayName,
                    HolidayDate = h.HolidayDate,
                    Description = h.Description,
                    IsActive = h.IsActive,
                    CreatedBy = h.CreatedBy,
                    CreatedAt = h.CreatedAt,
                    UpdatedAt = h.UpdatedAt
                })
                .FirstOrDefaultAsync(cancellationToken);

            return holiday is null
                ? ServiceResult<HolidayResponseDto>.NotFound("Holiday was not found.")
                : ServiceResult<HolidayResponseDto>.Success(holiday, "Holiday retrieved successfully.");
        }

        public async Task<ServiceResult<HolidayResponseDto>> CreateHolidayAsync(
            ClaimsPrincipal userPrincipal,
            HolidayCreateDto dto,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(dto.HolidayName))
            {
                return ServiceResult<HolidayResponseDto>.BadRequest("Holiday Name is required.");
            }

            var holidayDate = dto.HolidayDate.Date;

            var duplicateExists = await _context.Holidays
                .AnyAsync(h => h.HolidayDate == holidayDate, cancellationToken);

            if (duplicateExists)
            {
                return ServiceResult<HolidayResponseDto>.Conflict("A holiday for this date already exists.");
            }

            var createdBy = userPrincipal.FindFirstValue(ClaimTypes.Email) ??
                            userPrincipal.FindFirstValue(ClaimTypes.Name) ??
                            userPrincipal.Identity?.Name ?? "System";

            var holiday = new Holiday
            {
                HolidayName = dto.HolidayName.Trim(),
                HolidayDate = holidayDate,
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                IsActive = dto.IsActive,
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow
            };

            _context.Holidays.Add(holiday);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Holiday '{HolidayName}' on {HolidayDate:yyyy-MM-dd} created successfully by {CreatedBy} (ID: {HolidayId}).",
                holiday.HolidayName, holiday.HolidayDate, holiday.CreatedBy, holiday.HolidayId);

            var responseDto = new HolidayResponseDto
            {
                HolidayId = holiday.HolidayId,
                HolidayName = holiday.HolidayName,
                HolidayDate = holiday.HolidayDate,
                Description = holiday.Description,
                IsActive = holiday.IsActive,
                CreatedBy = holiday.CreatedBy,
                CreatedAt = holiday.CreatedAt,
                UpdatedAt = holiday.UpdatedAt
            };

            return ServiceResult<HolidayResponseDto>.Success(responseDto, "Holiday created successfully.");
        }

        public async Task<ServiceResult<HolidayResponseDto>> UpdateHolidayAsync(
            int id,
            ClaimsPrincipal userPrincipal,
            HolidayUpdateDto dto,
            CancellationToken cancellationToken = default)
        {
            var holiday = await _context.Holidays
                .FirstOrDefaultAsync(h => h.HolidayId == id, cancellationToken);

            if (holiday is null)
            {
                return ServiceResult<HolidayResponseDto>.NotFound("Holiday was not found.");
            }

            if (string.IsNullOrWhiteSpace(dto.HolidayName))
            {
                return ServiceResult<HolidayResponseDto>.BadRequest("Holiday Name is required.");
            }

            var holidayDate = dto.HolidayDate.Date;

            var duplicateExists = await _context.Holidays
                .AnyAsync(h => h.HolidayDate == holidayDate && h.HolidayId != id, cancellationToken);

            if (duplicateExists)
            {
                return ServiceResult<HolidayResponseDto>.Conflict("A holiday for this date already exists.");
            }

            holiday.HolidayName = dto.HolidayName.Trim();
            holiday.HolidayDate = holidayDate;
            holiday.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            holiday.IsActive = dto.IsActive;
            holiday.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Holiday ID {HolidayId} updated successfully to '{HolidayName}' on {HolidayDate:yyyy-MM-dd}.",
                holiday.HolidayId, holiday.HolidayName, holiday.HolidayDate);

            var responseDto = new HolidayResponseDto
            {
                HolidayId = holiday.HolidayId,
                HolidayName = holiday.HolidayName,
                HolidayDate = holiday.HolidayDate,
                Description = holiday.Description,
                IsActive = holiday.IsActive,
                CreatedBy = holiday.CreatedBy,
                CreatedAt = holiday.CreatedAt,
                UpdatedAt = holiday.UpdatedAt
            };

            return ServiceResult<HolidayResponseDto>.Success(responseDto, "Holiday updated successfully.");
        }

        public async Task<ServiceResult<bool>> DeleteHolidayAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            var holiday = await _context.Holidays
                .FirstOrDefaultAsync(h => h.HolidayId == id, cancellationToken);

            if (holiday is null)
            {
                return ServiceResult<bool>.NotFound("Holiday was not found.");
            }

            _context.Holidays.Remove(holiday);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Holiday ID {HolidayId} ('{HolidayName}', {HolidayDate:yyyy-MM-dd}) deleted successfully.",
                id, holiday.HolidayName, holiday.HolidayDate);

            return ServiceResult<bool>.Success(true, "Holiday deleted successfully.");
        }
    }
}
