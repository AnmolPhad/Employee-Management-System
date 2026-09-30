import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { FiDollarSign, FiCalendar, FiUser, FiInfo, FiAlertCircle } from 'react-icons/fi';

const SalaryCalculationCard = ({ calculation }) => {
  if (!calculation) return null;

  const basic = calculation.monthlyBasicSalary ?? calculation.monthlyBasic ?? 0;
  const allowances = calculation.allowances ?? 0;
  const gross = calculation.monthlyGrossSalary ?? calculation.grossSalary ?? (basic + allowances);
  const pfAmount = calculation.pfAmount ?? 0;
  const deductions = calculation.deductions ?? calculation.standardDeductions ?? 0;
  const unpaidDays = calculation.totalUnpaidLeaveDays ?? calculation.unpaidLeaveDays ?? 0;
  const unpaidDeduction = calculation.unpaidLeaveDeduction ?? 0;
  const net = calculation.netSalary ?? (gross - pfAmount - deductions - unpaidDeduction);
  const divisor = calculation.unpaidLeaveDivisor ?? 30;
  const dailyRate = calculation.dailySalary ?? (basic / divisor);

  return (
    <Card className="border-t-4 border-t-blue-600 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              Payroll Calculation Sheet
            </span>
            {calculation.isPayrollProcessed ? (
              <Badge status="active" text="Payroll Processed" />
            ) : (
              <Badge status="pending" text="Simulation / Projected" />
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">
            {calculation.employeeName} ({calculation.employeeCode})
          </h2>
          <p className="text-xs text-slate-500">
            {calculation.departmentName || 'General'} &bull; Cycle Month:{' '}
            <span className="font-semibold text-slate-700">{calculation.month}</span>
          </p>
        </div>

        <div className="text-left md:text-right bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Computed Net Take-Home
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
            {formatCurrency(net)}
          </div>
          <div className="text-[11px] text-slate-400">
            Annual CTC: {formatCurrency(calculation.annualCTC)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-6">
        {/* Earnings Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Earnings & Base Pay
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Monthly Basic (CTC / 12)</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(basic)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Allowances</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(allowances)}
              </span>
            </div>
            <div className="flex justify-between pt-2 text-base font-bold border-t border-slate-200">
              <span className="text-slate-800">Gross Monthly Earnings</span>
              <span className="text-slate-900">{formatCurrency(gross)}</span>
            </div>
          </div>
        </div>

        {/* Deductions Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Deductions & Statutory Reductions
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">
                Provident Fund ({calculation.pfPercentage || 12}%)
              </span>
              <span className="font-medium text-rose-600">
                - {formatCurrency(pfAmount)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Standard Deductions</span>
              <span className="font-medium text-rose-600">
                - {formatCurrency(deductions)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <div>
                <span className="text-slate-600">Unpaid Leave Days</span>
                <span className="ml-1.5 inline-block text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono font-medium">
                  {unpaidDays} day(s)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Rate: {formatCurrency(dailyRate)}/day (Divisor: {divisor})
                </span>
              </div>
              <span className="font-medium text-rose-600">
                - {formatCurrency(unpaidDeduction)}
              </span>
            </div>
            <div className="flex justify-between pt-2 text-base font-bold border-t border-slate-200">
              <span className="text-slate-800">Total Deductions</span>
              <span className="text-rose-700">
                - {formatCurrency(pfAmount + deductions + unpaidDeduction)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes / Remarks */}
      {calculation.calculationNotes && (
        <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
          <FiInfo className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold">Calculation Notes:</span>
            <p className="text-blue-800 leading-relaxed">{calculation.calculationNotes}</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SalaryCalculationCard;
