import React from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiClock, FiCalendar, FiUser } from 'react-icons/fi';
import AttendanceStatusBadge from './AttendanceStatusBadge';
import { formatDate, formatTimeSpan, formatWorkHours } from '../../utils/formatters';

const AttendanceTable = ({
  attendances = [],
  isAdminView = false,
  baseDetailsPath = '/attendance',
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {isAdminView && <th className="py-3.5 px-4">Employee</th>}
            <th className="py-3.5 px-4">Date</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Check-In</th>
            <th className="py-3.5 px-4">Check-Out</th>
            <th className="py-3.5 px-4 text-center">Duration</th>
            <th className="py-3.5 px-4">Remarks</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {attendances.map((item, idx) => {
            const rowKey = item.attendanceId && item.attendanceId > 0
              ? item.attendanceId
              : `att-${item.employeeId || 'emp'}-${item.attendanceDate || idx}`;

            const detailLink = item.attendanceId && item.attendanceId > 0
              ? `${baseDetailsPath}/${item.attendanceId}`
              : null;

            return (
              <tr
                key={rowKey}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Employee column for Admin View */}
                {isAdminView && (
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                        <FiUser className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 block truncate">
                          {item.employeeName || 'Unknown Employee'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {item.employeeCode} {item.departmentName ? `• ${item.departmentName}` : ''}
                        </span>
                      </div>
                    </div>
                  </td>
                )}

                {/* Date */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                    <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(item.attendanceDate)}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <AttendanceStatusBadge status={item.status} />
                </td>

                {/* Check In */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-xs">
                  {formatTimeSpan(item.checkInTime)}
                </td>

                {/* Check Out */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-xs">
                  {formatTimeSpan(item.checkOutTime)}
                </td>

                {/* Duration */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  {item.workHours !== null && item.workHours !== undefined ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <FiClock className="w-3 h-3 text-slate-500" />
                      <span>{formatWorkHours(item.workHours)}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">-</span>
                  )}
                </td>

                {/* Remarks */}
                <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate" title={item.remarks || ''}>
                  {item.remarks || '-'}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  {detailLink ? (
                    <Link
                      to={detailLink}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400 italic" title="Virtual record for unpunched date">
                      Generated
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
