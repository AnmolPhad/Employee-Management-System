import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import salaryApi from '../../api/salaryApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import SalaryStatusBadge from '../../components/salary/SalaryStatusBadge';
import SalarySummaryCard from '../../components/salary/SalarySummaryCard';
import SalaryHistoryTable from '../../components/salary/SalaryHistoryTable';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';
import {
  FiArrowLeft,
  FiTrendingUp,
  FiEdit2,
  FiPercent,
  FiCalendar,
  FiUser,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiFileText,
} from 'react-icons/fi';

const SalaryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [salary, setSalary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await salaryApi.getSalaryByIdAdmin(id);
      const salaryData = res.data?.data || res.data;
      setSalary(salaryData);

      if (salaryData?.employeeId) {
        fetchHistory(salaryData.employeeId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load salary details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (empId) => {
    try {
      setHistoryLoading(true);
      const res = await salaryApi.getSalaryHistoryAdmin(empId);
      const histData = res.data?.data || res.data;
      setHistory(Array.isArray(histData) ? histData : []);
    } catch (err) {
      console.warn('Failed to load salary history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !salary) {
    return (
      <div className="space-y-4">
        <Link to={ROUTES.ADMIN_SALARY} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800">
          <FiArrowLeft className="mr-1.5 w-4 h-4" /> Back to Salary List
        </Link>
        <ErrorMessage message={error || 'Salary record not found'} onRetry={fetchSalaryData} />
      </div>
    );
  }

  const basic = salary.basicSalary ?? salary.monthlyBasic ?? 0;
  const allowances = salary.allowances ?? 0;
  const gross = salary.monthlyGrossSalary ?? salary.monthlyGross ?? (basic + allowances);
  const net = salary.netSalary ?? salary.monthlyNet ?? 0;
  const pfAmount = salary.pfAmount ?? 0;
  const deductions = salary.deductions ?? salary.standardDeductions ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            to={ROUTES.ADMIN_SALARY}
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <FiArrowLeft className="mr-1 w-3.5 h-3.5" /> Back to Salary Management
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">
              {salary.employeeName || `Employee #${salary.employeeId}`}
            </h1>
            <SalaryStatusBadge status={salary.status} />
            {salary.version > 1 && (
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                Revision #{salary.version}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Employee Code: <span className="font-mono font-medium text-slate-700">{salary.employeeCode || salary.employeeId}</span> &bull; Department: <span className="font-medium text-slate-700">{salary.departmentName || 'General'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to={`/admin/salary/calculate?employeeId=${salary.employeeId}`}>
            <Button variant="secondary" icon={FiPercent}>
              Run Monthly Calculation
            </Button>
          </Link>
          <Link to={`/admin/salary/${salary.salaryId}/increment`}>
            <Button variant="primary" icon={FiTrendingUp}>
              Record Increment
            </Button>
          </Link>
          <Link to={`/admin/salary/${salary.salaryId}/edit`}>
            <Button variant="outline" icon={FiEdit2}>
              Edit Structure
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SalarySummaryCard
          title="Annual CTC"
          amount={salary.annualCTC}
          subtitle="Total Cost to Company"
          icon={FiDollarSign}
          iconBgColor="bg-blue-50 text-blue-600"
        />
        <SalarySummaryCard
          title="Monthly Basic"
          amount={basic}
          subtitle="Fixed base pay (CTC / 12)"
          icon={FiCheckCircle}
          iconBgColor="bg-indigo-50 text-indigo-600"
        />
        <SalarySummaryCard
          title="Gross Monthly"
          amount={gross}
          subtitle="Basic + monthly allowances"
          icon={FiTrendingUp}
          iconBgColor="bg-purple-50 text-purple-600"
        />
        <SalarySummaryCard
          title="Estimated Net Take-Home"
          amount={net}
          subtitle="Gross - PF - standard deductions"
          icon={FiDollarSign}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Detailed Structure Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings & Deductions Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Compensation Breakdown Details</span>
              <span className="text-xs font-normal text-slate-400">
                Effective: {formatDate(salary.effectiveFrom)} &rarr; {salary.effectiveTo ? formatDate(salary.effectiveTo) : 'Present'}
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Earnings Column */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Monthly Earnings
                </div>
                <div className="bg-slate-50/70 p-4 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Basic Pay</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(basic)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Monthly Allowances</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(allowances)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-bold text-slate-900 border-t border-slate-200">
                    <span>Monthly Gross</span>
                    <span>{formatCurrency(gross)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Monthly Deductions
                </div>
                <div className="bg-slate-50/70 p-4 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Provident Fund ({salary.pfPercentage}%)</span>
                    <span className="font-medium text-rose-600">- {formatCurrency(pfAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Standard Deductions</span>
                    <span className="font-medium text-rose-600">- {formatCurrency(deductions)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-bold text-rose-700 border-t border-slate-200">
                    <span>Total Deductions</span>
                    <span>- {formatCurrency(pfAmount + deductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {salary.incrementReason && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                <span className="font-bold text-slate-800">Version Increment Note:</span> {salary.incrementReason}
              </div>
            )}
          </Card>

          {/* Revision & Increment History */}
          <Card className="p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Increment & Version History</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological record of all past compensation adjustments for this employee
                </p>
              </div>
              {historyLoading && <LoadingSpinner size="sm" />}
            </div>
            <SalaryHistoryTable history={history} />
          </Card>
        </div>

        {/* Sidebar Info Card */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-blue-600" />
              Administrative Information
            </h3>

            <div className="space-y-3.5 pt-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Salary Record ID</span>
                <span className="font-mono text-slate-700 font-semibold">#{salary.salaryId}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Employee ID</span>
                <span className="font-mono text-slate-700 font-semibold">{salary.employeeId}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Current Version</span>
                <span className="font-semibold text-slate-800">Revision {salary.version || 1}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Effective Date</span>
                <span className="font-medium text-slate-700">{formatDate(salary.effectiveFrom)}</span>
              </div>

              {salary.effectiveTo && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Superseded / Closed On</span>
                  <span className="font-medium text-slate-700">{formatDate(salary.effectiveTo)}</span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block mb-0.5">Created On</span>
                <span className="text-slate-600">{formatDate(salary.createdAt)}</span>
              </div>

              {salary.updatedAt && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Last Modified</span>
                  <span className="text-slate-600">{formatDate(salary.updatedAt)}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-slate-50/50 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <FiPercent className="w-4 h-4 text-emerald-600" />
              Payroll Calculation Note
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              To preview actual monthly payout including approved unpaid leave deductions for any specific cycle month, run the monthly simulation tool.
            </p>
            <Link to={`/admin/salary/calculate?employeeId=${salary.employeeId}`}>
              <Button variant="secondary" size="sm" className="w-full">
                Simulate Payout
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalaryDetails;
