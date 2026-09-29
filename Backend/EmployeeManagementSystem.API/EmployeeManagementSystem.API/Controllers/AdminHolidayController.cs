using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Holiday;
using EmployeeManagementSystem.API.Services;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/admin/holidays")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.HR},ADMIN,HR")]
    [Produces("application/json")]
    [Tags("Admin")]
    public class AdminHolidayController : ControllerBase
    {
        private readonly IHolidayService _holidayService;

        public AdminHolidayController(IHolidayService holidayService)
        {
            _holidayService = holidayService;
        }

        /// <summary>
        /// Retrieves the list of organizational holidays with filtering and pagination.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<HolidayResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<PagedResponse<HolidayResponseDto>>>> GetHolidays(
            [FromQuery] HolidayQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var result = await _holidayService.GetHolidaysAsync(queryParameters, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves a single holiday by ID.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<HolidayResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<HolidayResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<HolidayResponseDto>>> GetHolidayById(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _holidayService.GetHolidayByIdAsync(id, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Creates a new organizational holiday (Admin &amp; HR only).
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<HolidayResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<HolidayResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<HolidayResponseDto>), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<HolidayResponseDto>>> CreateHoliday(
            [FromBody] HolidayCreateDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _holidayService.CreateHolidayAsync(User, dto, cancellationToken);
            if (result.Succeeded)
            {
                return CreatedAtAction(nameof(GetHolidayById), new { id = result.Data!.HolidayId }, ApiResponse<HolidayResponseDto>.Ok(result.Data, result.Message));
            }

            return ToActionResult(result);
        }

        /// <summary>
        /// Updates an existing holiday (Admin &amp; HR only).
        /// </summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<HolidayResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<HolidayResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<HolidayResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<HolidayResponseDto>), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<HolidayResponseDto>>> UpdateHoliday(
            int id,
            [FromBody] HolidayUpdateDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _holidayService.UpdateHolidayAsync(id, User, dto, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Deletes an existing holiday (Admin &amp; HR only).
        /// </summary>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DeleteHoliday(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _holidayService.DeleteHolidayAsync(id, cancellationToken);
            if (result.Succeeded)
            {
                return NoContent();
            }

            var response = ApiResponse<bool>.Fail(result.Message);
            return result.Status switch
            {
                ServiceResultStatus.NotFound => NotFound(response),
                ServiceResultStatus.BadRequest => BadRequest(response),
                ServiceResultStatus.Conflict => Conflict(response),
                ServiceResultStatus.Forbidden => StatusCode(StatusCodes.Status403Forbidden, response),
                _ => StatusCode(StatusCodes.Status500InternalServerError, response)
            };
        }

        private ActionResult<ApiResponse<T>> ToActionResult<T>(ServiceResult<T> result)
        {
            if (result.Succeeded)
            {
                return Ok(ApiResponse<T>.Ok(result.Data!, result.Message));
            }

            var response = ApiResponse<T>.Fail(result.Message);
            return result.Status switch
            {
                ServiceResultStatus.NotFound => NotFound(response),
                ServiceResultStatus.BadRequest => BadRequest(response),
                ServiceResultStatus.Conflict => Conflict(response),
                ServiceResultStatus.Forbidden => StatusCode(StatusCodes.Status403Forbidden, response),
                ServiceResultStatus.Unauthorized => Unauthorized(response),
                _ => StatusCode(StatusCodes.Status500InternalServerError, response)
            };
        }
    }
}
