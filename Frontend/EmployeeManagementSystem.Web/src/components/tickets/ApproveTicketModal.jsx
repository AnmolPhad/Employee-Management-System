import React from 'react';
import { FiCheckCircle, FiX, FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatters';

const ApproveTicketModal = ({
  isOpen,
  ticket,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !ticket) return null;

  const leave = ticket.leaveDetails || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Approve Leave Request
              </h3>
              <p className="text-xs text-slate-500">
                Ticket #{ticket.ticketId} &bull; {ticket.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to approve this leave request? This will update the leave status to <strong className="text-emerald-700">Approved</strong> and synchronize attendance and leave balances.
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5 text-xs text-slate-700">
            {ticket.employeeName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5 text-slate-400" /> Employee:
                </span>
                <span className="font-semibold text-slate-800">
                  {ticket.employeeName} ({ticket.employeeCode || `ID: ${ticket.employeeId}`})
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Leave Type:</span>
              <span className="font-semibold text-slate-800">
                {leave.leaveTypeName || 'Leave Application'}
                {leave.isPaid !== undefined && (
                  <span className={`ml-1.5 px-1.5 py-0.2 rounded text-[10px] ${leave.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {leave.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                )}
              </span>
            </div>

            {leave.startDate && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5 text-slate-400" /> Duration:
                </span>
                <span className="font-medium text-slate-800">
                  {formatDate(leave.startDate)} &rarr; {formatDate(leave.endDate)}
                </span>
              </div>
            )}

            {leave.totalDays && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FiClock className="w-3.5 h-3.5 text-slate-400" /> Total Working Days:
                </span>
                <span className="font-bold text-slate-900">
                  {leave.totalDays} day(s)
                </span>
              </div>
            )}

            {leave.reason && (
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block mb-0.5">Application Reason:</span>
                <p className="text-slate-700 italic font-normal">{leave.reason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={isLoading}
            onClick={() => onConfirm(ticket.ticketId)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Confirm Approval
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApproveTicketModal;
