import React, { useState } from 'react';
import {
  FiClock,
  FiLogIn,
  FiLogOut,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';
import Button from '../common/Button';
import AttendanceStatusBadge from './AttendanceStatusBadge';
import { formatDate, formatTimeSpan, formatWorkHours } from '../../utils/formatters';

const CheckInOutCard = ({
  todayRecord,
  isLoading = false,
  isActionLoading = false,
  error = '',
  successMessage = '',
  onCheckIn,
  onCheckOut,
  onRefresh,
}) => {
  const [remarks, setRemarks] = useState('');
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const hasCheckedIn = Boolean(todayRecord && todayRecord.checkInTime);
  const hasCheckedOut = Boolean(todayRecord && todayRecord.checkOutTime);

  const handleAction = async (actionType) => {
    if (isActionLoading || pendingAction) return;
    setPendingAction(actionType);
    try {
      if (actionType === 'in') {
        await onCheckIn(remarks.trim() || undefined);
      } else {
        await onCheckOut(remarks.trim() || undefined);
      }
      setRemarks('');
      setShowRemarksInput(false);
    } finally {
      setPendingAction(null);
    }
  };

  const todayFormatted = formatDate(new Date().toISOString());

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Today's Attendance Punch
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${hasCheckedOut ? 'bg-emerald-500' : hasCheckedIn ? 'bg-amber-500 animate-ping' : 'bg-blue-500 animate-ping'}`} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">
            {todayFormatted}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {hasCheckedIn && todayRecord?.status && (
            <AttendanceStatusBadge status={todayRecord.status} />
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
          <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Today's Punch Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Check-In */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <FiLogIn className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">First Check-In</span>
            <span className="text-base font-bold text-slate-800">
              {todayRecord?.checkInTime ? formatTimeSpan(todayRecord.checkInTime) : '--:-- --'}
            </span>
          </div>
        </div>

        {/* Check-Out */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <FiLogOut className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Last Check-Out</span>
            <span className="text-base font-bold text-slate-800">
              {todayRecord?.checkOutTime ? formatTimeSpan(todayRecord.checkOutTime) : '--:-- --'}
            </span>
          </div>
        </div>

        {/* Worked Duration */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <FiClock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Official Duration</span>
            <span className="text-base font-bold text-slate-800">
              {todayRecord?.workHours !== null && todayRecord?.workHours !== undefined
                ? formatWorkHours(todayRecord.workHours)
                : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Backend Remarks / Notes */}
      {todayRecord?.remarks && (
        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200/60 flex items-start gap-2">
          <FiInfo className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Punch Note:</strong> {todayRecord.remarks}
          </span>
        </div>
      )}

      {/* Optional Remarks input toggle before punch */}
      <div className="space-y-2">
        {!showRemarksInput ? (
          <button
            type="button"
            onClick={() => setShowRemarksInput(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            + Add punch remark (optional)
          </button>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Optional Punch Note
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Work from client location, doctor visit..."
              maxLength={200}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Action Punch Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Attendance classification is authoritatively calculated by the backend upon checkout.
        </p>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {!hasCheckedIn ? (
            /* STATE 1: Before Punch In - Show [ Punch In ] (enabled). No Punch Out button. */
            <Button
              type="button"
              variant="primary"
              size="lg"
              icon={FiLogIn}
              isLoading={isActionLoading && pendingAction === 'in'}
              loadingText="Punching In..."
              disabled={isLoading || isActionLoading}
              onClick={() => handleAction('in')}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm"
            >
              Punch In
            </Button>
          ) : (
            /* STATES 2, 3, 4: Punched In - Show [ Punch In — Completed ] (disabled) & [ Punch Out ] (enabled) */
            <>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                icon={FiCheckCircle}
                disabled={true}
                className="w-full sm:w-auto bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed opacity-75"
              >
                Punch In — Completed
              </Button>
              <Button
                type="button"
                variant="primary"
                size="lg"
                icon={FiLogOut}
                isLoading={isActionLoading && pendingAction === 'out'}
                loadingText="Punching Out..."
                disabled={isLoading || isActionLoading}
                onClick={() => handleAction('out')}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 shadow-sm"
              >
                Punch Out
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInOutCard;
