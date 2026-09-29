import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiLayers,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiSave,
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
} from 'react-icons/fi';
import Button from '../common/Button';
import { ROUTES } from '../../utils/constants';

const LeaveTypeForm = ({
  initialData = null,
  onSubmit,
  isEdit = false,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  const [formError, setFormError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    leaveTypeName: '',
    description: '',
    maxDaysPerYear: 15,
    isPaid: true,
    isActive: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        leaveTypeName: initialData.leaveTypeName || '',
        description: initialData.description || '',
        maxDaysPerYear: initialData.maxDaysPerYear ?? 15,
        isPaid: initialData.isPaid ?? true,
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalVal = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: finalVal }));

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
    if (!formData.leaveTypeName.trim()) {
      errors.leaveTypeName = 'Leave type name is required.';
    } else if (formData.leaveTypeName.trim().length > 50) {
      errors.leaveTypeName = 'Leave type name cannot exceed 50 characters.';
    }

    if (formData.description && formData.description.length > 250) {
      errors.description = 'Description cannot exceed 250 characters.';
    }

    const maxDays = Number(formData.maxDaysPerYear);
    if (formData.maxDaysPerYear === '' || isNaN(maxDays)) {
      errors.maxDaysPerYear = 'Max days per year is required.';
    } else if (!Number.isInteger(maxDays) || maxDays < 1 || maxDays > 365) {
      errors.maxDaysPerYear = 'Max days per year must be a whole number between 1 and 365.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) {
      setFormError('Please resolve the highlighted validation errors before saving.');
      return;
    }

    const payload = {
      leaveTypeName: formData.leaveTypeName.trim(),
      description: formData.description.trim() || null,
      maxDaysPerYear: Number(formData.maxDaysPerYear),
      isPaid: Boolean(formData.isPaid),
      isActive: Boolean(formData.isActive),
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setFormError(err.message || 'Failed to save leave type.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="flex items-center gap-2 p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Leave Type Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FiLayers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Leave Type Configuration</h2>
            <p className="text-xs text-slate-500">Classification and annual entitlement quotas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Leave Type Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Leave Type Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="leaveTypeName"
              value={formData.leaveTypeName}
              onChange={handleChange}
              placeholder="e.g. Annual Leave, Sick Leave, Paternity Leave"
              maxLength={50}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.leaveTypeName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {validationErrors.leaveTypeName && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.leaveTypeName}</p>
            )}
          </div>

          {/* Max Days Per Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Annual Entitlement Limit (Days) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FiCalendar className="w-4 h-4" />
              </div>
              <input
                type="number"
                name="maxDaysPerYear"
                min={1}
                max={365}
                value={formData.maxDaysPerYear}
                onChange={handleChange}
                placeholder="15"
                className={`w-full pl-9 pr-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.maxDaysPerYear ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
            </div>
            {validationErrors.maxDaysPerYear ? (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.maxDaysPerYear}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Maximum standard calendar days an employee may take annually for this category.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description & Policy Scope
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Outline eligible scenarios, certification rules, and prerequisites for this leave type..."
              maxLength={250}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>{validationErrors.description && <span className="text-rose-600">{validationErrors.description}</span>}</span>
              <span>{formData.description.length}/250</span>
            </div>
          </div>
        </div>
      </div>

      {/* Remuneration & Payroll Integration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FiDollarSign className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Payroll & Status Policies</h2>
            <p className="text-xs text-slate-500">Determine salary deduction impact and catalog visibility</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Paid Leave Checkbox Card */}
          <div
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              formData.isPaid
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-amber-50/50 border-amber-300'
            }`}
            onClick={() => setFormData((prev) => ({ ...prev, isPaid: !prev.isPaid }))}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="isPaid"
                checked={formData.isPaid}
                onChange={handleChange}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 mt-0.5 cursor-pointer"
              />
              <div className="space-y-1">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>{formData.isPaid ? 'Paid Leave (No Deductions)' : 'Unpaid Leave (Salary Deductions)'}</span>
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {formData.isPaid
                    ? 'Approved requests under this type will NOT generate salary deductions during payroll.'
                    : 'Approved requests under this type WILL trigger proportional deductions during monthly salary calculation.'}
                </p>
              </div>
            </div>
          </div>

          {/* Active Status Checkbox Card */}
          <div
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              formData.isActive
                ? 'bg-blue-50/50 border-blue-300'
                : 'bg-slate-50 border-slate-300'
            }`}
            onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
              />
              <div className="space-y-1">
                <span className="text-sm font-bold text-slate-800">
                  {formData.isActive ? 'Active Leave Category' : 'Inactive (Archived)'}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {formData.isActive
                    ? 'Available in the employee leave application dropdown.'
                    : 'Hidden from new leave submissions while preserving historical application logs.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(ROUTES.LEAVE_TYPES)}
          icon={FiArrowLeft}
          disabled={isLoading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          icon={FiSave}
          isLoading={isLoading}
        >
          {isEdit ? 'Update Leave Type' : 'Create Leave Type'}
        </Button>
      </div>
    </form>
  );
};

export default LeaveTypeForm;
