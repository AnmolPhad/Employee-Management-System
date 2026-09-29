import React from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2, FiCalendar, FiClock, FiDollarSign } from 'react-icons/fi';
import Badge from '../common/Badge';

const LeaveTypeTable = ({
  leaveTypes = [],
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <th className="py-3.5 px-4">Leave Type</th>
            <th className="py-3.5 px-4 text-center">Max Days / Year</th>
            <th className="py-3.5 px-4 text-center">Remuneration</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-center">Usage</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {leaveTypes.map((type) => {
            return (
              <tr
                key={type.leaveTypeId}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Leave Type Name & Description */}
                <td className="py-3.5 px-4">
                  <div className="min-w-0 max-w-sm">
                    <Link
                      to={`/leave-types/${type.leaveTypeId}`}
                      className="font-semibold text-slate-800 hover:text-blue-600 transition-colors block truncate"
                    >
                      {type.leaveTypeName}
                    </Link>
                    {type.description ? (
                      <span className="text-xs text-slate-400 block truncate" title={type.description}>
                        {type.description}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic block">No description provided</span>
                    )}
                  </div>
                </td>

                {/* Maximum Days Per Year */}
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <FiCalendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>{type.maxDaysPerYear} days / yr</span>
                  </span>
                </td>

                {/* Paid / Unpaid */}
                <td className="py-3.5 px-4 text-center">
                  <Badge
                    status={type.isPaid ? 'Paid' : 'Unpaid'}
                    text={type.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
                  />
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <Badge
                    status={type.isActive ? 'Active' : 'Inactive'}
                    text={type.isActive ? 'Active' : 'Inactive'}
                  />
                </td>

                {/* Usage Records */}
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-block text-xs font-medium text-slate-600">
                    {type.leaveCount || 0} applications
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="inline-flex items-center gap-1 justify-end">
                    <Link
                      to={`/leave-types/${type.leaveTypeId}`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>

                    {canEdit && (
                      <Link
                        to={`/leave-types/${type.leaveTypeId}/edit`}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Leave Type"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </Link>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete && onDelete(type)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Leave Type"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
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

export default LeaveTypeTable;
