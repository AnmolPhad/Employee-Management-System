using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Ticket;
using EmployeeManagementSystem.API.Services;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/tickets")]
    [Authorize]
    [Produces("application/json")]
    [Tags("Ticket")]
    public class TicketController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public TicketController(ITicketService ticketService)
        {
            _ticketService = ticketService;
        }

        /// <summary>
        /// Retrieves the current authenticated employee's submitted leave tickets.
        /// </summary>
        [HttpGet("me")]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<TicketMeResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<PagedResponse<TicketMeResponseDto>>>> GetMyTickets(
            [FromQuery] TicketQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var result = await _ticketService.GetMyTicketsAsync(User, queryParameters, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves a specific leave ticket submitted by the current authenticated employee.
        /// </summary>
        [HttpGet("me/{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<TicketMeResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<TicketMeResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<TicketMeResponseDto>>> GetMyTicketById(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _ticketService.GetMyTicketByIdAsync(User, id, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves leave tickets assigned to the current authenticated employee for approval.
        /// </summary>
        [HttpGet("my-approvals")]
        [ProducesResponseType(typeof(ApiResponse<PagedResponse<TicketResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<PagedResponse<TicketResponseDto>>>> GetMyApprovals(
            [FromQuery] TicketQueryParameters queryParameters,
            CancellationToken cancellationToken)
        {
            var result = await _ticketService.GetMyApprovalsAsync(User, queryParameters, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Retrieves a single ticket by ID. Accessible by assigned approver, creator, or admin.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<TicketResponseDto>>> GetTicketById(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _ticketService.GetTicketByIdAsync(User, id, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Approves a pending ticket. Only the assigned approver can approve it.
        /// </summary>
        [HttpPut("{id:int}/approve")]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<TicketResponseDto>>> ApproveTicket(
            int id,
            CancellationToken cancellationToken)
        {
            var result = await _ticketService.ApproveTicketAsync(User, id, cancellationToken);
            return ToActionResult(result);
        }

        /// <summary>
        /// Rejects a pending ticket with a mandatory rejection reason. Only the assigned approver can reject it.
        /// </summary>
        [HttpPut("{id:int}/reject")]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<TicketResponseDto>), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ApiResponse<TicketResponseDto>>> RejectTicket(
            int id,
            [FromBody] TicketRejectDto dto,
            CancellationToken cancellationToken)
        {
            var result = await _ticketService.RejectTicketAsync(User, id, dto, cancellationToken);
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
