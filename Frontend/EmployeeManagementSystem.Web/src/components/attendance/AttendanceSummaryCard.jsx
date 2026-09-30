import React from 'react';

const AttendanceSummaryCard = ({
  title,
  value,
  subvalue,
  icon: Icon,
  iconBg = 'bg-blue-50',
  iconColor = 'text-blue-600',
  trend,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-start justify-between ${className}`}>
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="text-2xl font-bold text-slate-800 tracking-tight">
          {value || '-'}
        </div>
        {subvalue && (
          <p className="text-xs text-slate-500 font-medium">{subvalue}</p>
        )}
        {trend && (
          <div className="pt-1">{trend}</div>
        )}
      </div>

      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default AttendanceSummaryCard;
