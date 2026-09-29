import React from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2, FiMapPin, FiUsers, FiUser } from 'react-icons/fi';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/formatters';

const DepartmentTable = ({
  departments = [],
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <th className="py-3.5 px-4">Department</th>
            <th className="py-3.5 px-4">Location</th>
            <th className="py-3.5 px-4">Department Head</th>
            <th className="py-3.5 px-4 text-center">Workforce</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Created Date</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {departments.map((dept) => {
            return (
              <tr
                key={dept.departmentId}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Department Name & Description */}
                <td className="py-3.5 px-4">
                  <div className="min-w-0 max-w-xs">
                    <Link
                      to={`/departments/${dept.departmentId}`}
                      className="font-semibold text-slate-800 hover:text-blue-600 transition-colors block truncate"
                    >
                      {dept.departmentName}
                    </Link>
                    {dept.description && (
                      <span className="text-xs text-slate-400 block truncate" title={dept.description}>
                        {dept.description}
                      </span>
                    )}
                  </div>
                </td>

                {/* Location */}
                <td className="py-3.5 px-4 text-slate-600 font-medium">
                  {dept.location ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{dept.location}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs italic">Unspecified</span>
                  )}
                </td>

                {/* Department Head */}
                <td className="py-3.5 px-4">
                  {dept.departmentHeadName ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-200">
                        <FiUser className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-800 block truncate">
                          {dept.departmentHeadName}
                        </span>
                        {dept.departmentHeadEmail && (
                          <span className="text-[11px] text-slate-400 block truncate">
                            {dept.departmentHeadEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-normal italic">
                      No Department Head
                    </span>
                  )}
                </td>

                {/* Workforce Count */}
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <FiUsers className="w-3 h-3 text-slate-500" />
                    <span>{dept.employeeCount || 0}</span>
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <Badge
                    status={dept.isActive ? 'Active' : 'Inactive'}
                    text={dept.isActive ? 'Active' : 'Inactive'}
                  />
                </td>

                {/* Created Date */}
                <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">
                  {formatDate(dept.createdAt)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="inline-flex items-center gap-1 justify-end">
                    <Link
                      to={`/departments/${dept.departmentId}`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>

                    {canEdit && (
                      <Link
                        to={`/departments/${dept.departmentId}/edit`}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Department"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </Link>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete && onDelete(dept)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Department"
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

export default DepartmentTable;
