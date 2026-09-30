import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCalendar,
  FiFileText,
  FiSend,
  FiArrowLeft,
  FiAlertCircle,
  FiInfo,
  FiDollarSign,
  FiCheckCircle,
} from 'react-icons/fi';
import Button from '../common/Button';
import Badge from '../common/Badge';
import leaveApi from '../../api/leaveApi';
import { ROUTES } from '../../utils/constants';

const LeaveApplicationForm = ({ onSubmit, isLoading = false }) => {
  const navigate = useNavigate();

  const [activeLeaveTypes, setActiveLeaveTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Load active leave categories and employee balances
  useEffect(() => {
    const fetchLeaveData = async () => {
      setTypesLoading(true);
      try {
        const [typesRes, balancesRes] = await Promise.all([
          leaveApi.getActiveLeaveTypes(),
          leaveApi.getMyLeaveBalance(),
        ]);

        const typesList = Array.isArray(typesRes?.data) ? typesRes.data : [];
        const balancesList = Array.isArray(balancesRes?.data) ? balancesRes.data : [];

        // Build balance map by leaveTypeId
        const balanceMap = {};
        balancesList.forEach((b) => {
          balanceMap[b.leaveTypeId] = b;
        });

        // Merge types with real balances
        const mergedList = typesList.map((t) => {
          const bal = balanceMap[t.leaveTypeId];
          return {
            ...t,
            availableDays: bal ? bal.availableDays : t.maxDaysPerYear,
            annualEntitlement: bal ? bal.annualEntitlement : t.maxDaysPerYear,
            pendingDays: bal ? bal.pendingDays : 0,
            approvedDays: bal ? bal.approvedDays : 0,
            financialYear: bal ? bal.financialYear : '',
          };
        });

        setActiveLeaveTypes(mergedList);
        if (mergedList.length > 0) {
          const firstAvailable = mergedList.find((m) => m.availableDays > 0) || mergedList[0];
          setFormData((prev) => ({ ...prev, leaveTypeId: String(firstAvailable.leaveTypeId) }));
        }
      } catch (err) {
        console.error('Failed to load active leave categories and balances:', err);
        setFormError('Unable to load leave categories. Please try again later.');
      } finally {
        setTypesLoading(false);
      }
    };

    fetchLeaveData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const selectedCategory = activeLeaveTypes.find(
    (t) => String(t.leaveTypeId) === String(formData.leaveTypeId)
  );

  // Compute estimated calendar days for convenience
  let estimatedDays = 0;
  if (formData.startDate && formData.endDate) {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
      const diffTime = Math.abs(end - start);
      estimatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const validate = () => {
    const errors = {};

    if (!formData.leaveTypeId) {
      errors.leaveTypeId = 'Please select a leave category.';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required.';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required.';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      errors.endDate = 'End date cannot be prior to start date.';
    }

    // Check financial year boundary (April 1 to March 31)
    if (formData.startDate && formData.endDate) {
      const sDate = new Date(formData.startDate);
      const eDate = new Date(formData.endDate);
      if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime()) && eDate >= sDate) {
        const getFyStartYear = (d) => (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1);
        if (getFyStartYear(sDate) !== getFyStartYear(eDate)) {
          errors.endDate = 'Leave application cannot span multiple financial years (April 1 - March 31). Please submit separate applications for each financial year.';
        }
      }
    }

    // Check available balance
    if (selectedCategory && selectedCategory.availableDays !== undefined && estimatedDays > selectedCategory.availableDays) {
      errors.endDate = `Requested duration (${estimatedDays} day${estimatedDays === 1 ? '' : 's'}) exceeds available balance (${selectedCategory.availableDays} day${selectedCategory.availableDays === 1 ? '' : 's'}).`;
    }

    if (!formData.reason.trim()) {
      errors.reason = 'Please provide a clear reason for your leave application.';
    } else if (formData.reason.trim().length > 500) {
      errors.reason = 'Reason cannot exceed 500 characters.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) {
      setFormError('Please resolve the highlighted validation errors.');
      return;
    }

    // Preserve exact YYYY-MM-DD format as required by backend date parser
    const payload = {
      leaveTypeId: Number(formData.leaveTypeId),
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason.trim(),
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setFormError(err.message || 'Failed to submit leave application.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="flex items-center gap-2.5 p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Request Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FiCalendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Application Parameters</h2>
            <p className="text-xs text-slate-500">
              Specify your requested leave category and scheduled duration
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Leave Type Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Leave Category <span className="text-rose-500">*</span>
            </label>
            <select
              name="leaveTypeId"
              value={formData.leaveTypeId}
              onChange={handleChange}
              disabled={typesLoading}
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.leaveTypeId
                  ? 'border-rose-400 bg-rose-50/20'
                  : 'border-slate-300'
              }`}
            >
              {typesLoading ? (
                <option value="">Loading leave categories...</option>
              ) : activeLeaveTypes.length === 0 ? (
                <option value="">No active leave types available</option>
              ) : (
                activeLeaveTypes.map((type) => (
                  <option
                    key={type.leaveTypeId}
                    value={type.leaveTypeId}
                    disabled={type.availableDays <= 0}
                  >
                    {type.availableDays > 0
                      ? `${type.leaveTypeName} (${type.availableDays} day${type.availableDays === 1 ? '' : 's'} available - ${type.isPaid ? 'Paid' : 'Unpaid'})`
                      : `${type.leaveTypeName} — 0 days available (${type.isPaid ? 'Paid' : 'Unpaid'})`}
                  </option>
                ))
              )}
            </select>
            {validationErrors.leaveTypeId && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.leaveTypeId}</p>
            )}

            {/* Selected Category Details Note */}
            {selectedCategory && (
              <div
                className={`mt-2.5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  selectedCategory.isPaid
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/60 border-amber-200 text-amber-900'
                }`}
              >
                <FiInfo className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm">{selectedCategory.leaveTypeName}</span>
                    <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-white/80 border border-slate-200">
                      {selectedCategory.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
                    </span>
                    {selectedCategory.financialYear && (
                      <span className="px-2 py-0.5 rounded-md font-medium text-[11px] bg-white/80 border border-slate-200">
                        FY {selectedCategory.financialYear}
                      </span>
                    )}
                  </div>
                  <div>
                    Annual Quota: <strong>{selectedCategory.annualEntitlement} days</strong> &bull; Current Available Balance:{' '}
                    <strong className="text-emerald-700">{selectedCategory.availableDays} days</strong>{' '}
                    (Used: {selectedCategory.approvedDays} days, Pending: {selectedCategory.pendingDays} days).
                  </div>
                  <div className="text-[11px] opacity-90">
                    {selectedCategory.isPaid ? (
                      <span>This is a <strong>Paid Leave</strong> category and will not incur salary deductions upon approval.</span>
                    ) : (
                      <span>This is an <strong>Unpaid Leave</strong> category and will trigger proportional salary deductions during monthly payroll.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.startDate
                    ? 'border-rose-400 bg-rose-50/20'
                    : 'border-slate-300'
                }`}
              />
              {validationErrors.startDate && (
                <p className="text-xs text-rose-600 mt-1">{validationErrors.startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                min={formData.startDate || undefined}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.endDate
                    ? 'border-rose-400 bg-rose-50/20'
                    : 'border-slate-300'
                }`}
              />
              {validationErrors.endDate && (
                <p className="text-xs text-rose-600 mt-1">{validationErrors.endDate}</p>
              )}
            </div>
          </div>

          {/* Estimated duration feedback */}
          {estimatedDays > 0 && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <span className="font-medium">Estimated Duration:</span>
              <span className="font-bold text-sm bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 text-blue-700">
                {estimatedDays} calendar {estimatedDays === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Leave <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="reason"
              rows={3}
              value={formData.reason}
              onChange={handleChange}
              placeholder="State the purpose of your absence clearly for your reporting manager..."
              maxLength={500}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.reason
                  ? 'border-rose-400 bg-rose-50/20'
                  : 'border-slate-300'
              }`}
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>{validationErrors.reason && <span className="text-rose-600">{validationErrors.reason}</span>}</span>
              <span>{formData.reason.length}/500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(ROUTES.LEAVE)}
          icon={FiArrowLeft}
          disabled={isLoading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          icon={FiSend}
          isLoading={isLoading}
          disabled={typesLoading}
        >
          Submit Application
        </Button>
      </div>
    </form>
  );
};

export default LeaveApplicationForm;
