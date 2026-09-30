import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import salaryApi from '../../api/salaryApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatCurrency } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';
import { FiArrowLeft, FiSave, FiInfo } from 'react-icons/fi';

const EditSalary = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);

  const [formData, setFormData] = useState({
    annualCTC: '',
    allowances: '0',
    deductions: '0',
    pfPercentage: '12',
    effectiveFrom: '',
  });

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await salaryApi.getSalaryByIdAdmin(id);
        const data = res.data?.data || res.data;

        setEmployeeInfo({
          employeeName: data.employeeName,
          employeeCode: data.employeeCode,
          employeeId: data.employeeId,
          departmentName: data.departmentName,
          version: data.version,
        });

        setFormData({
          annualCTC: data.annualCTC?.toString() || '',
          allowances: data.allowances?.toString() || '0',
          deductions: data.deductions?.toString() || '0',
          pfPercentage: data.pfPercentage?.toString() || '12',
          effectiveFrom: data.effectiveFrom ? data.effectiveFrom.split('T')[0] : '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load salary record for editing.');
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
        annualCTC: parseFloat(formData.annualCTC),
        allowances: parseFloat(formData.allowances) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        pfPercentage: formData.pfPercentage !== '' ? parseFloat(formData.pfPercentage) : null,
        effectiveFrom: formData.effectiveFrom,
      };

      await salaryApi.updateSalaryAdmin(id, payload);
      navigate(`/admin/salary/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update salary record.');
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
      <div>
        <Link
          to={`/admin/salary/${id}`}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
        >
          <FiArrowLeft className="mr-1 w-3.5 h-3.5" /> Back to Salary Details
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">
          Edit Compensation Structure
        </h1>
        {employeeInfo && (
          <p className="text-sm text-slate-500 mt-0.5">
            Updating active compensation for{' '}
            <span className="font-semibold text-slate-700">
              {employeeInfo.employeeName} ({employeeInfo.employeeCode})
            </span>
          </p>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-100">
                Modify Parameters
              </h2>

              <div className="space-y-4 pt-4">
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
                      value={formData.annualCTC}
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
                      value={formData.pfPercentage}
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
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-50/70 border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-200/60 flex items-center gap-1.5">
                <FiInfo className="w-3.5 h-3.5 text-blue-600" />
                Live Preview (Estimated)
              </h3>

              <div className="space-y-3 pt-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/40">
                  <span className="text-slate-500">Monthly Basic</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(previewBasic)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/40">
                  <span className="text-slate-500">Monthly Gross</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(previewGross)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/40">
                  <span className="text-slate-500">PF ({pfPct}%)</span>
                  <span className="font-medium text-rose-600">- {formatCurrency(previewPF)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/40">
                  <span className="text-slate-500">Deductions</span>
                  <span className="font-medium text-rose-600">- {formatCurrency(dedVal)}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold border-t border-slate-300">
                  <span className="text-slate-800">Estimated Net Pay</span>
                  <span className="text-emerald-600 font-extrabold">{formatCurrency(previewNet)}</span>
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
                icon={FiSave}
              >
                Update Record
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditSalary;
