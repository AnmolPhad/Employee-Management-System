import React from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiTrendingUp, FiEdit2, FiTrash2, FiPercent } from 'react-icons/fi';
import SalaryStatusBadge from './SalaryStatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

const SalaryTable = ({ salaries, onDelete, onCalculate }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="py-3.5 px-4">Employee</th>
            <th className="py-3.5 px-4">Department</th>
            <th className="py-3.5 px-4 text-right">Annual CTC</th>
            <th className="py-3.5 px-4 text-right">Monthly Basic</th>
            <th className="py-3.5 px-4 text-right">Monthly Net</th>
            <th className="py-3.5 px-4 text-center">Status</th>
            <th className="py-3.5 px-4">Effective From</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {salaries.map((salary) => (
            <tr
              key={salary.salaryId}
              className="hover:bg-slate-50/60 transition-colors group"
            >
              <td className="py-3.5 px-4">
                <div className="font-semibold text-slate-800">
                  {salary.employeeName || `Employee #${salary.employeeId}`}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {salary.employeeCode || `ID: ${salary.employeeId}`}
                </div>
              </td>
              <td className="py-3.5 px-4 text-slate-600">
                {salary.departmentName || '-'}
              </td>
              <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                {formatCurrency(salary.annualCTC)}
              </td>
              <td className="py-3.5 px-4 text-right text-slate-600">
                {formatCurrency(salary.basicSalary ?? salary.monthlyBasic)}
              </td>
              <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                {formatCurrency(salary.netSalary ?? salary.monthlyNet)}
              </td>
              <td className="py-3.5 px-4 text-center">
                <SalaryStatusBadge status={salary.status} />
                {salary.version > 1 && (
                  <span className="ml-1.5 inline-block text-[10px] font-mono text-slate-400">
                    v{salary.version}
                  </span>
                )}
              </td>
              <td className="py-3.5 px-4 text-slate-500 text-xs">
                {formatDate(salary.effectiveFrom)}
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    to={`/admin/salary/${salary.salaryId}`}
                    title="View Breakdown & History"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FiEye className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/admin/salary/calculate?employeeId=${salary.employeeId}`}
                    title="Calculate Monthly Payroll"
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <FiPercent className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/admin/salary/${salary.salaryId}/increment`}
                    title="Record Salary Increment"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <FiTrendingUp className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/admin/salary/${salary.salaryId}/edit`}
                    title="Edit Salary Record"
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(salary)}
                      title="Delete Salary Record"
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalaryTable;
