import React from 'react';
import { FiFilter, FiRefreshCw, FiX } from 'react-icons/fi';
import Button from '../common/Button';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Present', value: '1' },
  { label: 'Absent', value: '2' },
  { label: 'Half Day', value: '3' },
  { label: 'On Leave', value: '4' },
  { label: 'Holiday', value: '5' },
  { label: 'Weekly Off', value: '6' },
];

const AttendanceFilters = ({
  filters,
  onChange,
  onReset,
  onRefresh,
  isLoading = false,
  showEmployeeFilter = false,
}) => {
  const handleInputChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  const hasActiveFilters = Boolean(
    filters.status ||
    filters.startDate ||
    filters.endDate ||
    (showEmployeeFilter && filters.employeeId)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <FiFilter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] text-slate-400 font-semibold uppercase">From:</span>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] text-slate-400 font-semibold uppercase">To:</span>
            <input
              type="date"
              value={filters.endDate || ''}
              min={filters.startDate || undefined}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Employee ID filter for admin */}
          {showEmployeeFilter && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Emp ID:</span>
              <input
                type="number"
                placeholder="e.g. 8"
                value={filters.employeeId || ''}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                className="w-20 px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <FiX className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Refresh Action */}
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={FiRefreshCw}
            isLoading={isLoading}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceFilters;
