import React, { useState } from 'react';
import { FiXCircle, FiX, FiCalendar, FiUser } from 'react-icons/fi';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatters';

const RejectTicketModal = ({
  isOpen,
  ticket,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !ticket) return null;

  const leave = ticket.leaveDetails || {};

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Please provide a mandatory rejection reason.');
      return;
    }
    if (trimmed.length > 500) {
      setError('Rejection reason cannot exceed 500 characters.');
      return;
    }
    onConfirm(ticket.ticketId, trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={!isLoading ? handleClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <FiXCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Reject Leave Request
              </h3>
              <p className="text-xs text-slate-500">
                Ticket #{ticket.ticketId} &bull; {ticket.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm}>
          <div className="space-y-4 mb-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Rejecting this request will mark the leave as <strong className="text-rose-700">Rejected</strong> and restore the applicant's leave balance. A justification reason is mandatory.
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-700">
              {ticket.employeeName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-semibold text-slate-800">
                    {ticket.employeeName} ({ticket.employeeCode || `ID: ${ticket.employeeId}`})
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Leave Period:</span>
                <span className="font-medium text-slate-800">
                  {leave.startDate ? `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)} (${leave.totalDays || 1}d)` : '-'}
                </span>
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder="State the rationale for rejection (e.g. Project deliverable deadline conflict, insufficient coverage)..."
                required
                className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 placeholder:text-slate-400"
              />
              <div className="flex justify-between items-center mt-1 text-[11px]">
                {error ? (
                  <span className="text-rose-600 font-medium">{error}</span>
                ) : (
                  <span className="text-slate-400">Min 1 character, max 500 characters.</span>
                )}
                <span className="text-slate-400">{reason.length}/500</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isLoading}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectTicketModal;
