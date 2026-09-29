using System.Security.Claims;
using EmployeeManagementSystem.API.DTOs;
using EmployeeManagementSystem.API.DTOs.Ticket;
using EmployeeManagementSystem.API.Models;

namespace EmployeeManagementSystem.API.Services.Interfaces
{
    public interface ITicketService
    {
        /// <summary>
        /// Automatically creates and routes a ticket for a newly submitted leave application.
        /// Admin applicants do not create tickets (returns null).
        /// Runs within the caller's database transaction.
        /// </summary>
        Task<Ticket?> CreateTicketForLeaveAsync(
            Leave leave,
            Employee applicant,
            LeaveType leaveType,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves the current authenticated employee's submitted leave tickets.
        /// </summary>
        Task<ServiceResult<PagedResponse<TicketMeResponseDto>>> GetMyTicketsAsync(
            ClaimsPrincipal userPrincipal,
            TicketQueryParameters queryParameters,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves a specific leave ticket submitted by the current authenticated employee.
        /// </summary>
        Task<ServiceResult<TicketMeResponseDto>> GetMyTicketByIdAsync(
            ClaimsPrincipal userPrincipal,
            int ticketId,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves leave tickets assigned to the current authenticated employee for approval.
        /// </summary>
        Task<ServiceResult<PagedResponse<TicketResponseDto>>> GetMyApprovalsAsync(
            ClaimsPrincipal userPrincipal,
            TicketQueryParameters queryParameters,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves a single ticket by ID. Accessible by assigned approver, creator, or admin.
        /// </summary>
        Task<ServiceResult<TicketResponseDto>> GetTicketByIdAsync(
            ClaimsPrincipal userPrincipal,
            int ticketId,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Approves a pending ticket. Only the assigned approver can approve it.
        /// Synchronizes the corresponding Leave entity within a database transaction.
        /// </summary>
        Task<ServiceResult<TicketResponseDto>> ApproveTicketAsync(
            ClaimsPrincipal userPrincipal,
            int ticketId,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Rejects a pending ticket with a mandatory rejection reason. Only the assigned approver can reject it.
        /// Synchronizes the corresponding Leave entity within a database transaction.
        /// </summary>
        Task<ServiceResult<TicketResponseDto>> RejectTicketAsync(
            ClaimsPrincipal userPrincipal,
            int ticketId,
            TicketRejectDto dto,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all leave tickets with filtering and pagination (Admin only).
        /// </summary>
        Task<ServiceResult<PagedResponse<TicketResponseDto>>> GetAllTicketsAdminAsync(
            TicketQueryParameters queryParameters,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves a single ticket by ID (Admin only).
        /// </summary>
        Task<ServiceResult<TicketResponseDto>> GetTicketByIdAdminAsync(
            int ticketId,
            CancellationToken cancellationToken = default);
    }
}
