import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import salaryApi from '../../api/salaryApi';
import employeeApi from '../../api/employeeApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import SalaryCalculationCard from '../../components/salary/SalaryCalculationCard';
import { ROUTES } from '../../utils/constants';
import { FiArrowLeft, FiPercent, FiCalendar, FiUser, FiInfo } from 'react-icons/fi';

const SalaryCalculation = () => {
  const [searchParams] = useSearchParams();
  const preselectedEmpId = searchParams.get('employeeId');

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Default to current year-month (e.g. "2026-09" or "2026-10")
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(preselectedEmpId || '');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [calculation, setCalculation] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await employeeApi.getEmployees({ pageSize: 200 });
        const data = res.data?.data?.items || res.data?.items || res.data || [];
        setEmployees(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn('Failed to load employee list:', err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleRunCalculation = async (e) => {
    if (e) e.preventDefault();
    if (!selectedEmployeeId) {
      setError('Please choose an employee to calculate salary.');
      return;
    }
    if (!selectedMonth) {
      setError('Please choose a valid calculation cycle month.');
      return;
    }

    try {
      setCalculating(true);
      setError(null);
      setCalculation(null);

      const res = await salaryApi.calculateMonthlySalaryAdmin(
        selectedEmployeeId,
        selectedMonth
      );
      const data = res.data?.data || res.data;
      setCalculation(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to calculate monthly salary. Ensure the employee has an active salary record assigned for this period.'
      );
    } finally {
      setCalculating(false);
    }
  };

  // If preselectedEmpId was provided on mount, auto-trigger calculation when ready
  useEffect(() => {
    if (preselectedEmpId && !calculation && !calculating) {
      setSelectedEmployeeId(preselectedEmpId);
      handleRunCalculation();
    }
  }, [preselectedEmpId]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to={ROUTES.ADMIN_SALARY}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
        >
          <FiArrowLeft className="mr-1 w-3.5 h-3.5" /> Back to Salary Management
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Monthly Payroll Calculator</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Execute real-time payroll calculation accounting for approved unpaid leaves, PF schedules, and standard deductions.
        </p>
      </div>

      {/* Control Card */}
      <Card>
        <form onSubmit={handleRunCalculation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FiUser className="w-3.5 h-3.5 text-blue-600" />
                Select Employee <span className="text-rose-500">*</span>
              </label>
              {loadingEmployees ? (
                <div className="py-2">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || `ID: ${emp.employeeId}`})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Cycle Month Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5 text-blue-600" />
                Calculation Month <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                required
                className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={calculating}
                icon={FiPercent}
              >
                Calculate Payroll
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Error state */}
      {error && <ErrorMessage message={error} />}

      {/* Loading state */}
      {calculating && (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <LoadingSpinner />
          <p className="text-xs text-slate-400">Computing authoritative payroll figures...</p>
        </div>
      )}

      {/* Calculation Results */}
      {calculation && !calculating && (
        <SalaryCalculationCard calculation={calculation} />
      )}

      {/* Explanatory Policy Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <FiInfo className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-800">Unpaid Leave & Payroll Policy:</span>
          <p className="text-slate-600 leading-relaxed">
            Approved unpaid leaves (where <code>LeaveType.IsPaid = false</code>) are queried for the specified calendar month.
            The daily deduction rate is calculated as: <code>MonthlyBasic / UnpaidLeaveDivisor</code> (standard divisor: 30 days).
            Paid leaves and rejected leave requests do not cause any salary deduction.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalaryCalculation;
