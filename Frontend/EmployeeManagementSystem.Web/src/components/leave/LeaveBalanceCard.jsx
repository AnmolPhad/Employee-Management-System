import React from 'react';
import { FiCalendar, FiClock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import Badge from '../common/Badge';

const LeaveBalanceCard = ({ balance, isPaid = null }) => {
  const {
    leaveTypeName = 'Leave Type',
    annualEntitlement = 0,
    availableDays = 0,
    pendingDays = 0,
    approvedDays = 0,
  } = balance || {};

  const totalUsed = approvedDays + pendingDays;
  const usedPercentage =
    annualEntitlement > 0
      ? Math.min(100, Math.round((totalUsed / annualEntitlement) * 100))
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-sm truncate" title={leaveTypeName}>
              {leaveTypeName}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Annual Quota: {annualEntitlement} days
            </span>
          </div>

          {isPaid !== null && (
            <Badge
              status={isPaid ? 'Paid' : 'Unpaid'}
              text={isPaid ? 'Paid' : 'Unpaid'}
              className="text-[10px] px-2 shrink-0"
            />
          )}
        </div>

        {/* Big Available Days Number */}
        <div className="flex items-baseline gap-1.5 my-3">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {availableDays}
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Days Available
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              availableDays === 0
                ? 'bg-rose-500'
                : usedPercentage > 75
                ? 'bg-amber-500'
                : 'bg-blue-600'
            }`}
            style={{ width: `${usedPercentage}%` }}
          />
        </div>
      </div>

      {/* Breakdown footer */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <FiClock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Pending: <strong className="text-slate-700">{pendingDays}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <FiCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Used: <strong className="text-slate-700">{approvedDays}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalanceCard;
