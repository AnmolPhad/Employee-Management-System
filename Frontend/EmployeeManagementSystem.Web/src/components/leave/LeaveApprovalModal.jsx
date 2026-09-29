import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiX, FiAlertTriangle } from 'react-icons/fi';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatters';

const LeaveApprovalModal = ({
  isOpen,
  action = 'approve', // 'approve' | 'reject'
  leave,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRejectionReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !leave) return null;

  const isReject = action === 'reject';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isReject && !rejectionReason.trim()) {
      setError('A rejection reason is strictly mandatory.');
      return;
    }
    onConfirm(rejectionReason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Box */}
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isReject
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {isReject ? (
                <FiXCircle className="w-5 h-5" />
              ) : (
                <FiCheckCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isReject ? 'Reject Leave Application' : 'Approve Leave Application'}
              </h3>
              <p className="text-xs text-slate-500">
                Application #{leave.leaveId} &bull; {leave.employeeName || 'Employee'}
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

        {/* Application Summary Box */}
        <div className="bg-slate-50 rounded-xl p-3.5 mb-4 text-xs space-y-1.5 border border-slate-100">
          <div className="flex justify-between text-slate-600">
            <span className="font-medium">Leave Category:</span>
            <span className="font-bold text-slate-800">{leave.leaveTypeName}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span className="font-medium">Date Range:</span>
            <span className="font-semibold text-slate-800">
              {formatDate(leave.startDate)} &rarr; {formatDate(leave.endDate)} ({leave.totalDays} days)
            </span>
          </div>
          {leave.reason && (
            <div className="pt-1 border-t border-slate-200/60 text-slate-600">
              <span className="font-medium block mb-0.5">Applicant Note:</span>
              <p className="text-slate-700 italic">"{leave.reason}"</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isReject ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mandatory Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder="State clearly why this leave request is being denied..."
                maxLength={500}
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 ${
                  error
                    ? 'border-rose-400 ring-rose-400'
                    : 'border-slate-300 focus:ring-rose-500 focus:border-rose-500'
                }`}
              />
              {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-600 leading-relaxed">
              Confirming this application will deduct <strong className="text-slate-800">{leave.totalDays} day(s)</strong> from the applicant's official leave balance and update the associated approval ticket.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isReject ? 'danger' : 'primary'}
              isLoading={isLoading}
            >
              {isReject ? 'Confirm Rejection' : 'Confirm Approval'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveApprovalModal;
