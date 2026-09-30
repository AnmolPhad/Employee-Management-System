import React from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiCalendar,
  FiSun,
  FiHome,
  FiHelpCircle,
} from 'react-icons/fi';

const STATUS_CONFIG = {
  present: {
    label: 'Present',
    icon: FiCheckCircle,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Working duration > 8 hours',
  },
  halfday: {
    label: 'Half Day',
    icon: FiClock,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Working duration between 4 and 8 hours',
  },
  absent: {
    label: 'Absent',
    icon: FiXCircle,
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Working duration < 4 hours or unexcused absence',
  },
  onleave: {
    label: 'On Leave',
    icon: FiCalendar,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Authorized approved leave',
  },
  leave: {
    label: 'On Leave',
    icon: FiCalendar,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Authorized approved leave',
  },
  holiday: {
    label: 'Holiday',
    icon: FiSun,
    className: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'Official organization holiday',
  },
  weekoff: {
    label: 'Weekly Off',
    icon: FiHome,
    className: 'bg-slate-100 text-slate-700 border-slate-300',
    description: 'Scheduled weekly rest day',
  },
};

// Numeric enum fallback mapping from backend SystemEnums
const NUMERIC_STATUS_MAP = {
  1: 'present',
  2: 'absent',
  3: 'halfday',
  4: 'onleave',
  5: 'holiday',
  6: 'weekoff',
};

const AttendanceStatusBadge = ({ status, showDescription = false, className = '' }) => {
  if (status === undefined || status === null) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 ${className}`}>
        <FiHelpCircle className="w-3.5 h-3.5" />
        <span>Unknown</span>
      </span>
    );
  }

  const normalized = typeof status === 'number'
    ? NUMERIC_STATUS_MAP[status] || 'unknown'
    : status.toString().toLowerCase().replace(/\s+/g, '');

  const config = STATUS_CONFIG[normalized] || {
    label: status.toString(),
    icon: FiHelpCircle,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Attendance recorded',
  };

  const Icon = config.icon;

  return (
    <span
      title={showDescription ? undefined : config.description}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

export default AttendanceStatusBadge;
