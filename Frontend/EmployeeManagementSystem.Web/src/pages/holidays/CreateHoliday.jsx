import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCalendar,
  FiFileText,
  FiCheck,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';
import holidayApi from '../../api/holidayApi';
import { ROUTES } from '../../utils/constants';
import Button from '../../components/common/Button';

const CreateHoliday = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    holidayName: '',
    holidayDate: '',
    description: '',
    isActive: true,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.holidayName.trim()) {
      errors.holidayName = 'Holiday Name is required.';
    } else if (formData.holidayName.trim().length > 100) {
      errors.holidayName = 'Holiday Name cannot exceed 100 characters.';
    }

    if (!formData.holidayDate) {
      errors.holidayDate = 'Holiday Date is required.';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      setError('Please resolve the highlighted validation errors.');
      return;
    }

    setLoading(true);

    try {
      // Send date-only string directly to prevent timezone distortion
      const payload = {
        holidayName: formData.holidayName.trim(),
        holidayDate: formData.holidayDate,
        description: formData.description.trim() || null,
        isActive: formData.isActive,
      };

      await holidayApi.createHoliday(payload);
      navigate(ROUTES.HOLIDAYS);
    } catch (err) {
      console.error('Failed to create holiday:', err);
      // Clean duplicate handling
      if (err?.response?.status === 409) {
        setError('A holiday for this date already exists. Each date can only be configured once.');
      } else {
        setError(err?.message || 'Unable to create holiday. Please verify input and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to={ROUTES.HOLIDAYS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Holidays</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create Holiday</h1>
        <p className="text-sm text-slate-500 mt-1">
          Add an official organizational holiday. Employees will automatically be marked 'Holiday' on this date.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <FiCalendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Holiday Details</h2>
            <p className="text-xs text-slate-500">Configure holiday name and observed calendar date</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Holiday Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Holiday Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="holidayName"
              placeholder="e.g. New Year's Day, Independence Day"
              value={formData.holidayName}
              onChange={handleChange}
              maxLength={100}
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.holidayName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {validationErrors.holidayName && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.holidayName}</p>
            )}
          </div>

          {/* Holiday Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Holiday Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="holidayDate"
              value={formData.holidayDate}
              onChange={handleChange}
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.holidayDate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {validationErrors.holidayDate && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.holidayDate}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="e.g. National holiday observed across all office branches..."
              value={formData.description}
              onChange={handleChange}
              maxLength={500}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.description ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>{validationErrors.description && <span className="text-rose-600">{validationErrors.description}</span>}</span>
              <span>{formData.description.length}/500</span>
            </div>
          </div>

          {/* Is Active Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800 block">Active Status</span>
                <span className="text-xs text-slate-500">
                  When active, attendance calculations automatically mark this date as an official Holiday.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.HOLIDAYS)}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            icon={FiCheck}
            isLoading={loading}
          >
            Create Holiday
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateHoliday;
