import React from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Badge from '../common/Badge';
import { formatDate, formatEmploymentStatus } from '../../utils/formatters';

const getInitials = (firstName, lastName, fullName) => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return 'EM';
};

const EmployeeTable = ({
  employees = [],
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <th className="py-3.5 px-4">Employee</th>
            <th className="py-3.5 px-4">Code</th>
            <th className="py-3.5 px-4">Department</th>
            <th className="py-3.5 px-4">Role</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Joining Date</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {employees.map((emp) => {
            const initials = getInitials(emp.firstName, emp.lastName, emp.fullName);
            const displayName =
              emp.fullName ||
              `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
              emp.email;

            return (
              <tr
                key={emp.employeeId}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Employee Name & Email */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/employees/${emp.employeeId}`}
                        className="font-semibold text-slate-800 hover:text-blue-600 transition-colors block truncate"
                      >
                        {displayName}
                      </Link>
                      <span className="text-xs text-slate-400 block truncate">
                        {emp.email}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Employee Code */}
                <td className="py-3.5 px-4">
                  <span className="inline-block px-2 py-0.5 text-xs font-mono font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                    {emp.employeeCode}
                  </span>
                </td>

                {/* Department */}
                <td className="py-3.5 px-4 text-slate-600 font-medium">
                  {emp.departmentName || '-'}
                </td>

                {/* Role */}
                <td className="py-3.5 px-4">
                  <Badge status={emp.roleName} text={emp.roleName || '-'} />
                </td>

                {/* Employment Status */}
                <td className="py-3.5 px-4">
                  <Badge
                    status={emp.employmentStatus}
                    text={formatEmploymentStatus(emp.employmentStatus)}
                  />
                </td>

                {/* Date of Joining */}
                <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                  {formatDate(emp.dateOfJoining)}
                </td>

                {/* Action Buttons */}
                <td className="py-3.5 px-4 text-right">
                  <div className="inline-flex items-center gap-1 justify-end">
                    <Link
                      to={`/employees/${emp.employeeId}`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>

                    {canEdit && (
                      <Link
                        to={`/employees/${emp.employeeId}/edit`}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Employee"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </Link>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete && onDelete(emp)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Employee"
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

export default EmployeeTable;
