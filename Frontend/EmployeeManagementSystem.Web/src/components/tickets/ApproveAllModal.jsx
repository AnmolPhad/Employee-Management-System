import React from 'react';
import { FiCheckCircle, FiX, FiAlertTriangle } from 'react-icons/fi';
import Button from '../common/Button';

const ApproveAllModal = ({
  isOpen,
  count = 0,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Approve All Pending Tickets?
              </h3>
              <p className="text-xs text-slate-500">
                Bulk Leave Approval Action
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
            Are you sure you want to approve all <strong className="text-emerald-700 font-bold">{count}</strong> pending leave tickets assigned to you?
          </p>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>This action cannot be undone. All corresponding leave requests will be authorized and balances updated immediately.</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Approve All ({count})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApproveAllModal;
