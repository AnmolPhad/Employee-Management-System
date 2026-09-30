import React from 'react';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiBriefcase,
  FiLogIn,
  FiLogOut,
  FiInfo,
  FiCheckCircle,
} from 'react-icons/fi';
import AttendanceStatusBadge from './AttendanceStatusBadge';
import { formatDate, formatTimeSpan, formatWorkHours } from '../../utils/formatters';

const AttendanceDetailsCard = ({ attendance }) => {
  if (!attendance) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
      {/* Top Banner / Status Overview */}
      <div className="p-6 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Attendance Record #{attendance.attendanceId || 'N/A'}
          </span>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FiCalendar className="w-5 h-5 text-blue-600" />
            <span>{formatDate(attendance.attendanceDate)}</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <AttendanceStatusBadge status={attendance.status} showDescription={true} className="text-sm px-3.5 py-1.5" />
        </div>
      </div>

      {/* Employee Information */}
      <div className="p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Employee Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
              <FiUser className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Employee Name</span>
              <span className="text-sm font-bold text-slate-800">
                {attendance.employeeName || 'Authenticated Employee'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-medium mb-1">Employee Code</span>
            <span className="text-sm font-semibold text-slate-800 font-mono">
              {attendance.employeeCode || `EMP#${attendance.employeeId || 'N/A'}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
              <FiBriefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Department</span>
              <span className="text-sm font-semibold text-slate-800">
                {attendance.departmentName || 'General Staff'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Punch Times & Duration */}
      <div className="p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Punch Details & Duration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Check-In */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <FiLogIn className="w-4 h-4 text-emerald-600" />
              <span>Recorded Check-In</span>
            </div>
            <span className="text-lg font-bold text-slate-800 font-mono">
              {attendance.checkInTime ? formatTimeSpan(attendance.checkInTime) : '--:-- --'}
            </span>
          </div>

          {/* Check-Out */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <FiLogOut className="w-4 h-4 text-amber-600" />
              <span>Recorded Check-Out</span>
            </div>
            <span className="text-lg font-bold text-slate-800 font-mono">
              {attendance.checkOutTime ? formatTimeSpan(attendance.checkOutTime) : '--:-- --'}
            </span>
          </div>

          {/* Duration */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <FiClock className="w-4 h-4 text-blue-600" />
              <span>Total Worked Hours</span>
            </div>
            <span className="text-lg font-bold text-slate-800">
              {attendance.workHours !== null && attendance.workHours !== undefined
                ? formatWorkHours(attendance.workHours)
                : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Backend Policy / Classification Explanation */}
      <div className="p-6 bg-slate-50/40">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Classification Summary
        </h3>
        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-start gap-2">
            <FiInfo className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-800">Status Rule:</strong> Working duration exceeding 8 hours is marked <strong>Present</strong>; between 4 and 8 hours is <strong>Half Day</strong>; under 4 hours is marked <strong>Absent</strong>. Official holidays, approved leaves, and weekly offs take precedence according to organization settings.
            </div>
          </div>
          {attendance.remarks && (
            <div className="pt-2 border-t border-slate-100 text-slate-700">
              <span className="font-semibold text-slate-800">Remarks:</span> {attendance.remarks}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetailsCard;
