import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiMapPin, FiUser, FiFileText, FiCheckSquare, FiSave, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import Button from '../common/Button';
import employeeApi from '../../api/employeeApi';
import { ROUTES } from '../../utils/constants';

const DepartmentForm = ({
  initialData = null,
  onSubmit,
  isEdit = false,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    departmentName: '',
    description: '',
    location: '',
    departmentHeadId: '',
    isActive: true,
  });

  // Populate data when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        departmentName: initialData.departmentName || '',
        description: initialData.description || '',
        location: initialData.location || '',
        departmentHeadId: initialData.departmentHeadId ? String(initialData.departmentHeadId) : '',
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData]);

  // Load employee directory for Department Head dropdown
  useEffect(() => {
    const loadEmployees = async () => {
      setDropdownLoading(true);
      try {
        const res = await employeeApi.getEmployees({ pageSize: 100 });
        if (res && res.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.items || [];
          setEmployees(list);
        }
      } catch (err) {
        console.error('Failed to load employee list for department head dropdown:', err);
      } finally {
        setDropdownLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));

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
    if (!formData.departmentName.trim()) {
      errors.departmentName = 'Department name is required.';
    } else if (formData.departmentName.trim().length > 100) {
      errors.departmentName = 'Department name cannot exceed 100 characters.';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }

    if (formData.location && formData.location.length > 100) {
      errors.location = 'Location cannot exceed 100 characters.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) {
      setFormError('Please correct the highlighted form errors before proceeding.');
      return;
    }

    const payload = {
      departmentName: formData.departmentName.trim(),
      description: formData.description.trim() || null,
      location: formData.location.trim() || null,
      departmentHeadId: formData.departmentHeadId ? Number(formData.departmentHeadId) : null,
      isActive: Boolean(formData.isActive),
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setFormError(err.message || 'Failed to save department details.');
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

      {/* Main Department Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FiBriefcase className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Department Details</h2>
            <p className="text-xs text-slate-500">Core identification and functional unit metadata</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Department Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="departmentName"
              value={formData.departmentName}
              onChange={handleChange}
              placeholder="e.g. Engineering, Human Resources, Finance"
              maxLength={100}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.departmentName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {validationErrors.departmentName && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.departmentName}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Office / Building Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FiMapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Floor 3, Building B / New York HQ"
                maxLength={100}
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {validationErrors.location && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.location}</p>
            )}
          </div>

          {/* Department Head */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Department Head
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FiUser className="w-4 h-4" />
              </div>
              <select
                name="departmentHeadId"
                value={formData.departmentHeadId}
                onChange={handleChange}
                disabled={dropdownLoading}
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Department Head (Unassigned)</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName || `${emp.firstName} ${emp.lastName}`} ({emp.employeeCode} - {emp.roleName || 'Employee'})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Select an employee who leads or manages this unit, or leave unassigned.
            </p>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Department Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a brief summary of the unit's responsibilities, missions, and objectives..."
              maxLength={500}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>{validationErrors.description && <span className="text-rose-600">{validationErrors.description}</span>}</span>
              <span>{formData.description.length}/500</span>
            </div>
          </div>

          {/* Active Status Checkbox */}
          <div className="md:col-span-2 pt-2">
            <label className="inline-flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-800">
                Department is Active
              </span>
            </label>
            <p className="text-xs text-slate-500 ml-6.5 mt-0.5">
              Inactive departments are hidden from regular operations but preserved for historical reporting.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(ROUTES.DEPARTMENTS)}
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
          {isEdit ? 'Update Department' : 'Create Department'}
        </Button>
      </div>
    </form>
  );
};

export default DepartmentForm;
