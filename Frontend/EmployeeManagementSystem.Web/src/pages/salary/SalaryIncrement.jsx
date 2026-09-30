import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import salaryApi from '../../api/salaryApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';
import { FiArrowLeft, FiTrendingUp, FiCheckCircle, FiInfo } from 'react-icons/fi';

const SalaryIncrement = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentSalary, setCurrentSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    newAnnualCTC: '',
    newAllowances: '',
    newDeductions: '',
    newPFPercentage: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    reason: '',
  });

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await salaryApi.getSalaryByIdAdmin(id);
        const data = res.data?.data || res.data;
        setCurrentSalary(data);

        setFormData({
          newAnnualCTC: '',
          newAllowances: data.allowances?.toString() || '0',
          newDeductions: data.deductions?.toString() || '0',
          newPFPercentage: data.pfPercentage?.toString() || '12',
          effectiveFrom: new Date().toISOString().split('T')[0],
          reason: '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load existing salary details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSalary();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Deltas and metrics
  const oldCTC = currentSalary?.annualCTC || 0;
  const newCTC = parseFloat(formData.newAnnualCTC) || 0;
  const ctcDiff = newCTC - oldCTC;
  const pctDiff = oldCTC > 0 && newCTC > 0 ? ((ctcDiff / oldCTC) * 100).toFixed(2) : 0;

  const newAllow = parseFloat(formData.newAllowances) || 0;
  const newDed = parseFloat(formData.newDeductions) || 0;
  const newPF = parseFloat(formData.newPFPercentage) || 0;

  const newBasic = newCTC > 0 ? newCTC / 12 : 0;
  const newGross = newBasic + newAllow;
  const newPFAmt = newBasic * (newPF / 100);
  const newNet = newGross - newPFAmt - newDed;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.newAnnualCTC || parseFloat(formData.newAnnualCTC) <= 0) {
      setError('Please provide a valid new Annual CTC.');
      return;
    }
    if (!formData.effectiveFrom) {
      setError('Please provide the increment effective start date.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        newAnnualCTC: parseFloat(formData.newAnnualCTC),
        newAllowances: formData.newAllowances !== '' ? parseFloat(formData.newAllowances) : null,
        newDeductions: formData.newDeductions !== '' ? parseFloat(formData.newDeductions) : null,
        newPFPercentage: formData.newPFPercentage !== '' ? parseFloat(formData.newPFPercentage) : null,
        effectiveFrom: formData.effectiveFrom,
        reason: formData.reason || null,
      };

      await salaryApi.incrementSalaryAdmin(id, payload);
      navigate(`/admin/salary/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record salary increment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/admin/salary/${id}`}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
        >
          <FiArrowLeft className="mr-1 w-3.5 h-3.5" /> Back to Salary Details
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Record Salary Increment / Revision</h1>
        {currentSalary && (
          <p className="text-sm text-slate-500 mt-0.5">
            Upgrading compensation structure for{' '}
            <span className="font-semibold text-slate-700">
              {currentSalary.employeeName} ({currentSalary.employeeCode})
            </span>
          </p>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Current vs Proposed Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-50 border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Current Annual CTC
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            {formatCurrency(oldCTC)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Basic: {formatCurrency(currentSalary?.monthlyBasic)}/mo
          </div>
        </Card>

        <Card className="bg-blue-50/50 border-blue-200">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Proposed Annual CTC
          </div>
          <div className="text-xl font-bold text-blue-800 mt-1">
            {newCTC > 0 ? formatCurrency(newCTC) : '—'}
          </div>
          <div className="text-xs text-blue-600/70 mt-0.5">
            New Basic: {newCTC > 0 ? formatCurrency(newBasic) : '—'}/mo
          </div>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            CTC Adjustment Delta
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-1">
            {ctcDiff !== 0 ? (
              <span>
                {ctcDiff > 0 ? '+' : ''}
                {formatCurrency(ctcDiff)}
              </span>
            ) : (
              '0.00'
            )}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-0.5">
            {pctDiff !== 0 ? `${pctDiff > 0 ? '+' : ''}${pctDiff}% change` : 'No change'}
          </div>
        </Card>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-100">
                New Structure Details
              </h2>

              <div className="space-y-4 pt-4">
                {/* New Annual CTC */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Annual CTC (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="newAnnualCTC"
                      step="0.01"
                      placeholder="e.g. 900000"
                      value={formData.newAnnualCTC}
                      onChange={handleChange}
                      required
                      className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Allowances & Deductions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Monthly Allowances (₹)
                    </label>
                    <input
                      type="number"
                      name="newAllowances"
                      step="0.01"
                      value={formData.newAllowances}
                      onChange={handleChange}
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Standard Deductions (₹)
                    </label>
                    <input
                      type="number"
                      name="newDeductions"
                      step="0.01"
                      value={formData.newDeductions}
                      onChange={handleChange}
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* PF % & Effective Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New PF Percentage (%)
                    </label>
                    <input
                      type="number"
                      name="newPFPercentage"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.newPFPercentage}
                      onChange={handleChange}
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
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

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Increment / Revision Reason
                  </label>
                  <input
                    type="text"
                    name="reason"
                    maxLength="200"
                    placeholder="e.g. Annual Merit Appraisal 2026, Promotion to Lead"
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Recorded permanently into employee revision history for audit compliance.
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Comparison Preview */}
          <div className="space-y-6">
            <Card className="bg-slate-50/70 border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-200/60 flex items-center gap-1.5">
                <FiInfo className="w-3.5 h-3.5 text-blue-600" />
                New Net Simulation
              </h3>

              <div className="space-y-3 pt-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/40">
                  <span className="text-slate-500">New Monthly Basic</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(newBasic)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/40">
                  <span className="text-slate-500">New Monthly Gross</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(newGross)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/40">
                  <span className="text-slate-500">New PF ({newPF}%)</span>
                  <span className="font-medium text-rose-600">- {formatCurrency(newPFAmt)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/40">
                  <span className="text-slate-500">New Deductions</span>
                  <span className="font-medium text-rose-600">- {formatCurrency(newDed)}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold border-t border-slate-300">
                  <span className="text-slate-800">Projected Net</span>
                  <span className="text-emerald-600 font-extrabold">{formatCurrency(newNet)}</span>
                </div>
              </div>
            </Card>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-1/2"
                onClick={() => navigate(`/admin/salary/${id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-1/2"
                isLoading={submitting}
                icon={FiTrendingUp}
              >
                Apply Increment
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SalaryIncrement;
