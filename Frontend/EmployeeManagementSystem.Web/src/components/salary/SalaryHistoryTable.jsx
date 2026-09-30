import React from 'react';
import SalaryStatusBadge from './SalaryStatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

const SalaryHistoryTable = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No increment or revision history recorded for this employee.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="py-3 px-4">Ver</th>
            <th className="py-3 px-4 text-right">Annual CTC</th>
            <th className="py-3 px-4 text-right">Monthly Basic</th>
            <th className="py-3 px-4 text-right">Gross</th>
            <th className="py-3 px-4 text-right">Net</th>
            <th className="py-3 px-4">Effective Period</th>
            <th className="py-3 px-4">Reason / Notes</th>
            <th className="py-3 px-4 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {history.map((record) => (
            <tr
              key={record.salaryId}
              className={`hover:bg-slate-50/60 transition-colors ${
                record.status === 1 || record.status === 'Active'
                  ? 'bg-blue-50/30 font-medium'
                  : ''
              }`}
            >
              <td className="py-3 px-4 font-mono text-xs text-slate-500">
                v{record.version || 1}
              </td>
              <td className="py-3 px-4 text-right font-semibold text-slate-800">
                {formatCurrency(record.annualCTC)}
              </td>
              <td className="py-3 px-4 text-right text-slate-600">
                {formatCurrency(record.basicSalary ?? record.monthlyBasic)}
              </td>
              <td className="py-3 px-4 text-right text-slate-600">
                {formatCurrency(record.monthlyGrossSalary ?? record.monthlyGross ?? ((record.basicSalary ?? record.monthlyBasic ?? 0) + (record.allowances ?? 0)))}
              </td>
              <td className="py-3 px-4 text-right font-medium text-emerald-600">
                {formatCurrency(record.netSalary ?? record.monthlyNet)}
              </td>
              <td className="py-3 px-4 text-xs text-slate-500">
                {formatDate(record.effectiveFrom)} &rarr;{' '}
                {record.effectiveTo ? formatDate(record.effectiveTo) : 'Present'}
              </td>
              <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                {record.incrementReason || '-'}
              </td>
              <td className="py-3 px-4 text-center">
                <SalaryStatusBadge status={record.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalaryHistoryTable;
