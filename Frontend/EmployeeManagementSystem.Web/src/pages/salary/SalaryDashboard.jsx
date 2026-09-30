import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import salaryApi from '../../api/salaryApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import SalaryStatusBadge from '../../components/salary/SalaryStatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';
import {
  FiDollarSign,
  FiCalendar,
  FiShield,
  FiArrowRight,
  FiSettings,
  FiUsers,
  FiTrendingUp,
  FiPercent,
} from 'react-icons/fi';

const SalaryDashboard = () => {
  const { user, isAdmin, isHR } = useAuth();
  const isPrivileged = isAdmin || isHR;

  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMySalary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await salaryApi.getMySalary();
      // Handle ApiResponse envelope or direct object
      const data = res.data?.data || res.data;
      setSalary(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setSalary(null);
      } else {
        setError(err.response?.data?.message || 'Failed to load your salary details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySalary();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isPrivileged ? 'Salary & Compensation Hub' : 'My Compensation'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isPrivileged
              ? 'Oversee organization payroll structures, increments, settings, and personal CTC'
              : 'Confidential Cost to Company (CTC) overview and official effective dates'}
          </p>
        </div>

        {isPrivileged && (
          <div className="flex items-center gap-2">
            <Link to={ROUTES.ADMIN_SALARY}>
              <Button variant="primary" icon={FiUsers}>
                Salary Management
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Privileged Quick Navigation Cards */}
      {isPrivileged && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to={ROUTES.ADMIN_SALARY}
            className="group block p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FiUsers className="w-5 h-5" />
              </div>
              <FiArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-transform" />
            </div>
            <div className="mt-3">
              <h3 className="font-semibold text-slate-800 text-sm">All Salaries</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse and edit employee compensation
              </p>
            </div>
          </Link>

          <Link
            to={ROUTES.ADMIN_SALARY_CREATE}
            className="group block p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <FiDollarSign className="w-5 h-5" />
              </div>
              <FiArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-transform" />
            </div>
            <div className="mt-3">
              <h3 className="font-semibold text-slate-800 text-sm">Assign Salary</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Create new compensation package
              </p>
            </div>
          </Link>

          <Link
            to={ROUTES.ADMIN_SALARY_CALCULATE}
            className="group block p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <FiPercent className="w-5 h-5" />
              </div>
              <FiArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-purple-600 transition-transform" />
            </div>
            <div className="mt-3">
              <h3 className="font-semibold text-slate-800 text-sm">Monthly Payroll</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate with unpaid leave deductions
              </p>
            </div>
          </Link>

          <Link
            to={ROUTES.ADMIN_SALARY_SETTINGS}
            className="group block p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <FiSettings className="w-5 h-5" />
              </div>
              <FiArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-600 transition-transform" />
            </div>
            <div className="mt-3">
              <h3 className="font-semibold text-slate-800 text-sm">Payroll Settings</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cycle days, PF rate & unpaid divisor
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Personal Salary Overview Card */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchMySalary} />
      ) : salary ? (
        <Card className="overflow-hidden border border-slate-200 shadow-xs">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 -m-6 p-6 mb-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white mb-2">
                  <FiShield className="w-3.5 h-3.5" />
                  Confidential Compensation Record
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Annual Cost to Company (CTC)
                </h2>
                <p className="text-blue-100 text-xs mt-1">
                  Active compensation agreement for {user?.name || user?.email}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {formatCurrency(salary.annualCTC)}
                </div>
                <div className="mt-1">
                  <SalaryStatusBadge
                    status={salary.status}
                    className="bg-white/90 text-slate-800 border-none font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-blue-100/60 text-blue-700">
                <FiCalendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Effective From</div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">
                  {formatDate(salary.effectiveFrom)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-indigo-100/60 text-indigo-700">
                <FiCalendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Effective Until</div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">
                  {salary.effectiveTo ? formatDate(salary.effectiveTo) : 'Current / Ongoing'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-emerald-100/60 text-emerald-700">
                <FiDollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Monthly CTC Base</div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">
                  {formatCurrency((salary.annualCTC || 0) / 12)} / month
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>{salary.salaryId ? `Record Reference #${salary.salaryId}` : 'Active Agreement'}</span>
            <span>{salary.createdAt ? `Recorded on: ${formatDate(salary.createdAt)}` : ''}</span>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No Salary Record Assigned"
          message="Your personal compensation structure has not been recorded yet. Please reach out to HR or Administration for assistance."
          icon={FiDollarSign}
        />
      )}

      {/* Privacy Notice */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <FiShield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold">Confidentiality Statement:</span>
          <p className="text-amber-800 leading-relaxed">
            Compensation figures are strictly confidential. In accordance with organizational policy,
            employees have visibility into their total Cost to Company (CTC) overview. Individual payroll
            disbursements, PF schedules, and monthly payslip breakdowns are computed and maintained
            by Finance and Human Resources.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalaryDashboard;
