import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import salaryApi from '../../api/salaryApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { ROUTES } from '../../utils/constants';
import { FiArrowLeft, FiSave, FiSettings, FiCheck, FiInfo } from 'react-icons/fi';

const SalarySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [settings, setSettings] = useState({
    salaryCycleStartDay: 1,
    salaryCycleEndDay: 30,
    unpaidLeaveDivisor: 30,
    pfPercentage: 12.0,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await salaryApi.getSettingsAdmin();
      const data = res.data?.data || res.data;
      if (data) {
        setSettings({
          salaryCycleStartDay: data.salaryCycleStartDay ?? 1,
          salaryCycleEndDay: data.salaryCycleEndDay ?? 30,
          unpaidLeaveDivisor: data.unpaidLeaveDivisor ?? 30,
          pfPercentage: data.pfPercentage ?? 12.0,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load salary calculation settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: name === 'pfPercentage' ? parseFloat(value) || 0 : parseInt(value, 10) || 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const payload = {
        salaryCycleStartDay: parseInt(settings.salaryCycleStartDay, 10),
        salaryCycleEndDay: parseInt(settings.salaryCycleEndDay, 10),
        unpaidLeaveDivisor: parseInt(settings.unpaidLeaveDivisor, 10),
        pfPercentage: parseFloat(settings.pfPercentage),
      };

      await salaryApi.updateSettingsAdmin(payload);
      setSuccessMsg('Salary calculation parameters saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update salary calculation settings.');
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          to={ROUTES.ADMIN_SALARY}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
        >
          <FiArrowLeft className="mr-1 w-3.5 h-3.5" /> Back to Salary Management
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Salary Calculation Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure global payroll cycle dates, unpaid leave divisor, and default PF percentages.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <FiCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="space-y-6">
          <div className="space-y-4">
            {/* Salary Cycle Start Day */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Salary Cycle Start Day (1 - 28)
              </label>
              <input
                type="number"
                name="salaryCycleStartDay"
                min="1"
                max="28"
                value={settings.salaryCycleStartDay}
                onChange={handleChange}
                required
                className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                The calendar day on which each monthly payroll period commences (typically 1).
              </span>
            </div>

            {/* Salary Cycle End Day */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Salary Cycle End Day (1 - 31)
              </label>
              <input
                type="number"
                name="salaryCycleEndDay"
                min="1"
                max="31"
                value={settings.salaryCycleEndDay}
                onChange={handleChange}
                required
                className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                The calendar day on which each monthly payroll period concludes (typically 30 or 31).
              </span>
            </div>

            {/* Unpaid Leave Divisor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unpaid Leave Divisor (Days)
              </label>
              <input
                type="number"
                name="unpaidLeaveDivisor"
                min="1"
                max="31"
                value={settings.unpaidLeaveDivisor}
                onChange={handleChange}
                required
                className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                The day count divisor used to calculate daily salary for unpaid leave deductions:
                <code> (MonthlyBasic / Divisor) &times; UnpaidDays</code>.
              </span>
            </div>

            {/* Default PF Percentage */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Provident Fund (PF) Rate (%)
              </label>
              <input
                type="number"
                name="pfPercentage"
                step="0.1"
                min="0"
                max="100"
                value={settings.pfPercentage}
                onChange={handleChange}
                required
                className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard organizational PF rate applied to monthly basic pay (statutory default: 12.0%).
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link to={ROUTES.ADMIN_SALARY}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              icon={FiSave}
            >
              Save Configuration
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default SalarySettings;
