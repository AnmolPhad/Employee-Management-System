import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import salaryApi from '../../api/salaryApi';
import employeeApi from '../../api/employeeApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatCurrency } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';
import { FiArrowLeft, FiSave, FiDollarSign, FiInfo } from 'react-icons/fi';

const CreateSalary = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [formData, setFormData] = useState({
    employeeId: '',
    annualCTC: '',
    allowances: '0',
    deductions: '0',
    pfPercentage: '12',
    effectiveFrom: new Date().toISOString().split('T')[0],
  });

  const [submitting, setSubmitting] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Live client-side simulation helper (informational preview only)
  const ctcVal = parseFloat(formData.annualCTC) || 0;
  const allowVal = parseFloat(formData.allowances) || 0;
  const dedVal = parseFloat(formData.deductions) || 0;
  const pfPct = parseFloat(formData.pfPercentage) || 0;

  const previewBasic = ctcVal > 0 ? ctcVal / 12 : 0;
  const previewGross = previewBasic + allowVal;
  const previewPF = previewBasic * (pfPct / 100);
  const previewNet = previewGross - previewPF - dedVal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) {
      setError('Please select an employee.');
      return;
    }
    if (!formData.annualCTC || parseFloat(formData.annualCTC) <= 0) {
      setError('Please provide a valid Annual CTC greater than zero.');
      return;
    }
    if (!formData.effectiveFrom) {
      setError('Please select an effective start date.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        employeeId: parseInt(formData.employeeId, 10),
        annualCTC: parseFloat(formData.annualCTC),
        allowances: parseFloat(formData.allowances) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        pfPercentage: formData.pfPercentage !== '' ? parseFloat(formData.pfPercentage) : null,
        effectiveFrom: formData.effectiveFrom,
      };

      const res = await salaryApi.createSalaryAdmin(payload);
      const created = res.data?.data || res.data;
      navigate(ROUTES.ADMIN_SALARY);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign salary record.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-slate-800">Assign Compensation Structure</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Establish an official salary and CTC agreement for an active employee.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-100">
                Core Salary Parameters
              </h2>

              <div className="space-y-4 pt-4">
                {/* Employee Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Employee <span className="text-rose-500">*</span>
                  </label>
                  {loadingEmployees ? (
                    <div className="py-2">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    <select
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      required
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map((emp) => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode || `ID: ${emp.employeeId}`}) - {emp.departmentName || 'General'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Annual CTC */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Annual CTC (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="annualCTC"
                      step="0.01"
                      placeholder="e.g. 780000"
                      value={formData.annualCTC}
                      onChange={handleChange}
                      required
                      className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Monthly Basic is automatically computed as CTC / 12 by the backend engine.
                  </span>
                </div>

                {/* Allowances & Deductions Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Monthly Allowances (₹)
                    </label>
                    <input
                      type="number"
                      name="allowances"
                      step="0.01"
                      value={formData.allowances}
                      onChange={handleChange}
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Standard Monthly Deductions (₹)
                    </label>
                    <input
                      type="number"
                      name="deductions"
                      step="0.01"
                      value={formData.deductions}
                      onChange={handleChange}
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* PF Percentage & Effective Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PF Percentage (%)
                    </label>
                    <input
                      type="number"
                      name="pfPercentage"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="12.0"
                      value={formData.pfPercentage}
                      onChange={handleChange}
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Default is 12% of Monthly Basic.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Effective Start Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="effectiveFrom"
                      value={formData.effectiveFrom}
                      onChange={handleChange}
                      required
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Live Projection / Preview */}
          <div className="space-y-6">
            <Card className="bg-slate-50/70 border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-200/60 flex items-center gap-1.5">
                <FiInfo className="w-3.5 h-3.5 text-blue-600" />
                Live Preview (Estimated)
              </h3>

              <div className="space-y-3 pt-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/40">
                  <span className="text-slate-500">Monthly Basic (CTC / 12)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(previewBasic)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/40">
                  <span className="text-slate-500">Monthly Gross</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(previewGross)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/40">
                  <span className="text-slate-500">PF Deduction ({pfPct}%)</span>
                  <span className="font-medium text-rose-600">- {formatCurrency(previewPF)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/40">
                  <span className="text-slate-500">Other Deductions</span>
                  <span className="font-medium text-rose-600">- {formatCurrency(dedVal)}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold border-t border-slate-300">
                  <span className="text-slate-800">Estimated Net Pay</span>
                  <span className="text-emerald-600 font-extrabold">{formatCurrency(previewNet)}</span>
                </div>
              </div>

              <div className="mt-4 p-2.5 bg-blue-50/50 rounded-lg text-[11px] text-blue-800 leading-relaxed">
                Note: Preview is provided for guidance. The backend server verifies and computes authoritative values upon submission.
              </div>
            </Card>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-1/2"
                onClick={() => navigate(ROUTES.ADMIN_SALARY)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-1/2"
                isLoading={submitting}
                icon={FiSave}
              >
                Save Record
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateSalary;
