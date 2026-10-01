import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiBriefcase, FiLock, FiSave, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import Button from '../common/Button';
import departmentApi from '../../api/departmentApi';
import employeeApi from '../../api/employeeApi';
import { useAuth } from '../../context/AuthContext';
import { SYSTEM_ROLES, EMPLOYMENT_STATUSES, GENDERS, ROUTES } from '../../utils/constants';

const formatInputDate = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const EmployeeForm = ({
  initialData = null,
  onSubmit,
  isEdit = false,
  isLoading = false,
  currentEmployeeId = null,
}) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    departmentId: '',
    roleId: '',
    managerId: '',
    employmentStatus: 'FullTime',
    password: '',
  });

  // Populate data when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        employeeCode: initialData.employeeCode || '',
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        dateOfBirth: formatInputDate(initialData.dateOfBirth),
        gender: initialData.gender || '',
        address: initialData.address || '',
        dateOfJoining: formatInputDate(initialData.dateOfJoining) || new Date().toISOString().split('T')[0],
        departmentId: initialData.departmentId ? String(initialData.departmentId) : '',
        roleId: initialData.roleId ? String(initialData.roleId) : '',
        managerId: initialData.managerId ? String(initialData.managerId) : '',
        employmentStatus: initialData.employmentStatus || 'FullTime',
        password: '',
      });
    }
  }, [initialData]);

  // Load departments, valid candidate managers, and business roles
  useEffect(() => {
    const loadDropdownData = async () => {
      setDropdownLoading(true);
      try {
        const [deptRes, mgrRes, roleRes] = await Promise.all([
          departmentApi.getDepartments({ pageSize: 100 }).catch(() => null),
          employeeApi.getManagerCandidates().catch(() => null),
          employeeApi.getRoles().catch(() => null),
        ]);

        if (deptRes && deptRes.data) {
          const deptList = Array.isArray(deptRes.data)
            ? deptRes.data
            : deptRes.data.items || [];
          setDepartments(deptList);
        }

        if (mgrRes && mgrRes.data) {
          const mgrList = Array.isArray(mgrRes.data)
            ? mgrRes.data
            : mgrRes.data.items || mgrRes.data || [];
          setManagers(mgrList);
        } else {
          // Fallback manager query using isManager filter
          try {
            const fallbackRes = await employeeApi.getEmployees({ isManager: true, pageSize: 100 });
            const fallbackList = Array.isArray(fallbackRes?.data)
              ? fallbackRes.data
              : fallbackRes?.data?.items || [];
            setManagers(fallbackList);
          } catch (e) {
            console.warn('Fallback manager fetch failed:', e);
          }
        }

        if (roleRes && roleRes.data) {
          const roleList = Array.isArray(roleRes.data)
            ? roleRes.data
            : roleRes.data.items || roleRes.data || [];
          setRoles(roleList);
        }
      } catch (err) {
        console.error('Failed to load dropdown data:', err);
      } finally {
        setDropdownLoading(false);
      }
    };

    loadDropdownData();
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

  const validate = () => {
    const errors = {};
    if (!formData.employeeCode.trim()) {
      errors.employeeCode = 'Employee code is required.';
    }
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required.';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required.';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!formData.dateOfJoining) {
      errors.dateOfJoining = 'Joining date is required.';
    }
    if (!formData.departmentId) {
      errors.departmentId = 'Department is required.';
    }
    if (!formData.roleId) {
      errors.roleId = 'Role is required.';
    }
    if (!formData.employmentStatus) {
      errors.employmentStatus = 'Employment status is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) {
      setFormError('Please correct the highlighted errors before saving.');
      return;
    }

    // Prepare payload
    const payload = {
      employeeCode: formData.employeeCode.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
      gender: formData.gender || null,
      address: formData.address.trim() || null,
      dateOfJoining: new Date(formData.dateOfJoining).toISOString(),
      departmentId: Number(formData.departmentId),
      roleId: Number(formData.roleId),
      managerId: formData.managerId ? Number(formData.managerId) : null,
      employmentStatus: formData.employmentStatus,
    };

    if (!isEdit && formData.password.trim()) {
      payload.password = formData.password.trim();
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save employee record.');
    }
  };

  // Determine available business roles/designations based on logged-in user permissions
  const rawRoles = roles.length > 0 ? roles : SYSTEM_ROLES;
  const availableRoles = rawRoles.filter((r) => {
    const roleName = r.roleName || r.name || '';
    // HR is prohibited from selecting System Administrator
    if (!isAdmin && roleName.toLowerCase() === 'system administrator') {
      return false;
    }
    return true;
  });

  // Filter manager options (cannot report to oneself)
  const availableManagers = managers.filter(
    (m) => !currentEmployeeId || m.employeeId !== Number(currentEmployeeId)
  );

  // Check if existing manager is not in the valid manager candidates list
  const isExistingManagerInvalid =
    Boolean(formData.managerId) &&
    !availableManagers.some((m) => String(m.employeeId) === String(formData.managerId));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="flex items-center gap-2 p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{formError}</span>
        </div>
      )}

      {/* Section 1: Employment Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FiBriefcase className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Employment Details</h2>
            <p className="text-xs text-slate-500">Official organizational assignment and positioning</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Employee Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="employeeCode"
              value={formData.employeeCode}
              onChange={handleChange}
              placeholder="e.g. EMP009"
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.employeeCode ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {validationErrors.employeeCode && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.employeeCode}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              disabled={dropdownLoading}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.departmentId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentName} ({dept.departmentCode || `ID: ${dept.departmentId}`})
                </option>
              ))}
            </select>
            {validationErrors.departmentId && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.departmentId}</p>
            )}
          </div>

          {/* Role / Designation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Role / Designation <span className="text-rose-500">*</span>
            </label>
            <select
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              disabled={dropdownLoading}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.roleId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            >
              <option value="">Select Role</option>
              {availableRoles.map((role) => (
                <option key={role.roleId || role.id} value={role.roleId || role.id}>
                  {role.roleName || role.name}
                </option>
              ))}
            </select>
            {validationErrors.roleId && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.roleId}</p>
            )}
          </div>

          {/* Reporting Manager */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reporting Manager
            </label>
            <select
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              disabled={dropdownLoading}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                isExistingManagerInvalid ? 'border-amber-400 bg-amber-50/20' : 'border-slate-300'
              }`}
            >
              <option value="">None (Top-Level)</option>
              {isExistingManagerInvalid && (
                <option value={formData.managerId} disabled className="text-amber-700 font-medium">
                  {initialData?.managerName || `Manager ID: ${formData.managerId}`} (Invalid Assignment — Please Reassign)
                </option>
              )}
              {availableManagers.map((mgr) => (
                <option key={mgr.employeeId} value={mgr.employeeId}>
                  {mgr.fullName || `${mgr.firstName} ${mgr.lastName}`}{mgr.roleName ? ` — ${mgr.roleName}` : ''}
                </option>
              ))}
            </select>
            {isExistingManagerInvalid && (
              <p className="text-xs text-amber-600 mt-1">
                Current reporting manager does not qualify as a manager. Please reassign to a valid Project Manager.
              </p>
            )}
          </div>

          {/* Employment Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Employment Status <span className="text-rose-500">*</span>
            </label>
            <select
              name="employmentStatus"
              value={formData.employmentStatus}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {EMPLOYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {validationErrors.employmentStatus && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.employmentStatus}</p>
            )}
          </div>

          {/* Date of Joining */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Date of Joining <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="dateOfJoining"
              value={formData.dateOfJoining}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.dateOfJoining ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {validationErrors.dateOfJoining && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.dateOfJoining}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Personal Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FiUser className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Personal Information</h2>
            <p className="text-xs text-slate-500">Contact details and identity information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* First Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="e.g. John"
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.firstName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {validationErrors.firstName && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="e.g. Doe"
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.lastName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {validationErrors.lastName && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@company.com"
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                validationErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {validationErrors.email && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +1 555-0199"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Gender</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Residential Address
            </label>
            <textarea
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address, City, State, ZIP..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Credentials (Only on Create) */}
      {!isEdit && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <FiLock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Account Access (Optional)</h2>
              <p className="text-xs text-slate-500">Initial login password for user account</p>
            </div>
          </div>

          <div className="max-w-md">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Custom Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave empty for default: Employee@123"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Default password <code className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">Employee@123</code> is assigned automatically if left blank.
            </p>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(ROUTES.EMPLOYEES)}
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
          {isEdit ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;
