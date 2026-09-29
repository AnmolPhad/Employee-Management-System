import React from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiCheck, FiX, FiCalendar, FiUser } from 'react-icons/fi';
import LeaveStatusBadge from './LeaveStatusBadge';
import { formatDate } from '../../utils/formatters';

const LeaveTable = ({
  leaves = [],
  isApproverView = false,
  onApprove,
  onReject,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {isApproverView && <th className="py-3.5 px-4">Applicant</th>}
            <th className="py-3.5 px-4">Leave Category</th>
            <th className="py-3.5 px-4">Schedule</th>
            <th className="py-3.5 px-4 text-center">Duration</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Applied On</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {leaves.map((leave) => {
            const isPending =
              leave.status === 1 ||
              (typeof leave.status === 'string' &&
                leave.status.toLowerCase() === 'pending');

            return (
              <tr
                key={leave.leaveId}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Applicant Info (Only in Approver View) */}
                {isApproverView && (
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                        <FiUser className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 block truncate">
                          {leave.employeeName || 'Unknown Employee'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {leave.employeeCode} {leave.departmentName ? `• ${leave.departmentName}` : ''}
                        </span>
                      </div>
                    </div>
                  </td>
                )}

                {/* Leave Category */}
                <td className="py-3.5 px-4">
                  <div className="min-w-0 max-w-xs">
                    <Link
                      to={`/leave/${leave.leaveId}`}
                      className="font-semibold text-slate-800 hover:text-blue-600 transition-colors block truncate"
                    >
                      {leave.leaveTypeName || 'Leave Request'}
                    </Link>
                    {leave.reason ? (
                      <span className="text-xs text-slate-400 block truncate" title={leave.reason}>
                        {leave.reason}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic block">No reason specified</span>
                    )}
                  </div>
                </td>

                {/* Schedule (Start -> End) */}
                <td className="py-3.5 px-4 text-xs whitespace-nowrap text-slate-700">
                  <span className="font-medium">{formatDate(leave.startDate)}</span>
                  <span className="text-slate-400 mx-1.5">&rarr;</span>
                  <span className="font-medium">{formatDate(leave.endDate)}</span>
                </td>

                {/* Duration */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <FiCalendar className="w-3 h-3 text-slate-500" />
                    <span>{leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}</span>
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <LeaveStatusBadge status={leave.status} />
                </td>

                {/* Applied Date */}
                <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(leave.appliedDate)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <Link
                      to={`/leave/${leave.leaveId}`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>

                    {isApproverView && isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => onApprove && onApprove(leave)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Approve Leave"
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onReject && onReject(leave)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Reject Leave"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveTable;
