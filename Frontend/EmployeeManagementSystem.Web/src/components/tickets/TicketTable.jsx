import React from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiCheck, FiX, FiCalendar, FiClock } from 'react-icons/fi';
import TicketStatusBadge from './TicketStatusBadge';
import { formatDate } from '../../utils/formatters';

const TicketTable = ({
  tickets = [],
  mode = 'my', // 'my' | 'approvals' | 'admin'
  onApprove,
  onReject,
}) => {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        No leave approval tickets found.
      </div>
    );
  }

  const showApplicant = mode === 'approvals' || mode === 'admin';
  const isApproverMode = mode === 'approvals';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="py-3.5 px-4">Ticket</th>
            {showApplicant && <th className="py-3.5 px-4">Applicant</th>}
            <th className="py-3.5 px-4">Leave Type</th>
            <th className="py-3.5 px-4">Dates & Duration</th>
            <th className="py-3.5 px-4 text-center">Status</th>
            <th className="py-3.5 px-4">Assigned Approver</th>
            <th className="py-3.5 px-4">Submitted</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {tickets.map((ticket) => {
            const leave = ticket.leaveDetails || {};
            const isPending = ticket.status === 'Pending' || ticket.status === 1;

            return (
              <tr
                key={ticket.ticketId}
                className="hover:bg-slate-50/60 transition-colors group"
              >
                {/* Ticket ID & Title */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-800">
                    <Link
                      to={`/tickets/${ticket.ticketId}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      #{ticket.ticketId}
                    </Link>
                  </div>
                  <div className="text-xs text-slate-500 max-w-xs truncate" title={ticket.title}>
                    {ticket.title}
                  </div>
                </td>

                {/* Applicant (Approvals & Admin mode) */}
                {showApplicant && (
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">
                      {ticket.employeeName || `Employee #${ticket.employeeId}`}
                    </div>
                    {ticket.employeeCode && (
                      <div className="text-xs text-slate-400 font-mono">
                        {ticket.employeeCode}
                      </div>
                    )}
                  </td>
                )}

                {/* Leave Type */}
                <td className="py-3.5 px-4">
                  <span className="font-medium text-slate-800">
                    {leave.leaveTypeName || 'Leave Application'}
                  </span>
                  {leave.isPaid !== undefined && (
                    <span
                      className={`ml-1.5 inline-block text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        leave.isPaid
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {leave.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  )}
                </td>

                {/* Dates & Duration */}
                <td className="py-3.5 px-4">
                  <div className="text-xs font-medium text-slate-700">
                    {leave.startDate ? (
                      <>
                        {formatDate(leave.startDate)} &rarr; {formatDate(leave.endDate)}
                      </>
                    ) : (
                      '-'
                    )}
                  </div>
                  {leave.totalDays && (
                    <div className="text-xs text-slate-400">
                      {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
                    </div>
                  )}
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 text-center">
                  <TicketStatusBadge status={ticket.status} />
                </td>

                {/* Assigned Approver */}
                <td className="py-3.5 px-4 text-slate-600 text-xs">
                  {ticket.assignedToName || 'Not Assigned'}
                </td>

                {/* Submitted / Created Date */}
                <td className="py-3.5 px-4 text-slate-500 text-xs">
                  {formatDate(ticket.createdAt)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      to={`/tickets/${ticket.ticketId}`}
                      title="View Ticket Details"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>

                    {isApproverMode && isPending && (
                      <>
                        {onApprove && (
                          <button
                            type="button"
                            onClick={() => onApprove(ticket)}
                            title="Approve Leave Ticket"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                        {onReject && (
                          <button
                            type="button"
                            onClick={() => onReject(ticket)}
                            title="Reject Leave Ticket"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TicketTable;
