using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Ticket;
using EmployeeManagementSystem.API.Services;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/admin/tickets")]
    [Authorize(Roles = $"{AppRoles.Admin},ADMIN")]
    [Produces("application/json")]
    [Tags("Admin")]
    public class AdminTicketController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public AdminTicketController(ITicketService ticketService)
        {
            _ticketService = ticketService;
        }

        /// <summary>
        /// Retrieves all leave approval tickets with filtering and pagination (Admin only).
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<TicketResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<PagedResponse<TicketResponseDto>>>> GetTickets(
            [FromQuery] TicketQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var result = await _ticketService.GetAllTicketsAdminAsync(queryParameters, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves a single ticket by ID with full details (Admin only).
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<TicketResponseDto>>> GetTicketById(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _ticketService.GetTicketByIdAdminAsync(id, cancellationToken);
            return ToActionResult(result);
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
