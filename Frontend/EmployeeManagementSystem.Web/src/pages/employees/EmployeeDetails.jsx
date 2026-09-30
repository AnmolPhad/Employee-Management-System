import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiBriefcase,
  FiUser,
  FiClock,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiCheck,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import employeeApi from '../../api/employeeApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatDate, formatEmploymentStatus } from '../../utils/formatters';
import { ROUTES, GENDERS } from '../../utils/constants';

const getInitials = (firstName, lastName, fullName) => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return 'EM';
};

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isHR } = useAuth();
  const canManage = isAdmin || isHR;

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Personal Information Edit State
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
  });
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [personalFeedback, setPersonalFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  const fetchEmployee = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeeApi.getEmployeeById(id);
      if (res && res.data) {
        setEmployee(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch employee details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const isSelf = Boolean(
    employee &&
    user &&
    ((user.employeeId && user.employeeId === employee.employeeId) ||
      (user.email && user.email.toLowerCase() === employee.email.toLowerCase()))
  );
  const canEditPersonal = canManage || isSelf;

  const handleStartEditPersonal = () => {
    setPersonalForm({
      phone: employee.phone || '',
      gender: employee.gender || '',
      dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
      address: employee.address || '',
    });
    setPersonalFeedback(null);
    setIsEditingPersonal(true);
  };

  const handleCancelEditPersonal = () => {
    setIsEditingPersonal(false);
    setPersonalFeedback(null);
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setIsSavingPersonal(true);
    setPersonalFeedback(null);

    // Basic date validation
    if (personalForm.dateOfBirth) {
      const dob = new Date(personalForm.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        setPersonalFeedback({ type: 'error', message: 'Date of birth cannot be in the future.' });
        setIsSavingPersonal(false);
        return;
      }
    }

    try {
      const payload = {
        phone: personalForm.phone.trim() || null,
        gender: personalForm.gender || null,
        dateOfBirth: personalForm.dateOfBirth ? `${personalForm.dateOfBirth}T00:00:00` : null,
        address: personalForm.address.trim() || null,
      };

      const res = await employeeApi.updatePersonalDetails(employee.employeeId, payload);
      if (res && res.data) {
        setEmployee(res.data);
        setIsEditingPersonal(false);
        setPersonalFeedback({
          type: 'success',
          message: res.message || 'Personal information updated successfully.',
        });
      }
    } catch (err) {
      setPersonalFeedback({
        type: 'error',
        message: err.message || 'Failed to update personal details. Please try again.',
      });
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await employeeApi.deleteEmployee(id);
      navigate(ROUTES.EMPLOYEES);
    } catch (err) {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      const conflictMsg =
        err.status === 409
          ? `Cannot delete employee: ${err.message}`
          : err.message || 'Failed to delete employee.';
      setDeleteError(conflictMsg);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12">
        <LoadingSpinner message="Loading employee profile..." />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          icon={FiArrowLeft}
          onClick={() => navigate(canManage ? ROUTES.EMPLOYEES : ROUTES.DASHBOARD)}
        >
          {canManage ? 'Back to Directory' : 'Back to Dashboard'}
        </Button>
        <ErrorMessage
          message={error || 'Employee record could not be found.'}
          onRetry={fetchEmployee}
        />
      </div>
    );
  }

  const initials = getInitials(employee.firstName, employee.lastName, employee.fullName);
  const displayName =
    employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(canManage ? ROUTES.EMPLOYEES : ROUTES.DASHBOARD)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-fit"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>{canManage ? 'Back to Employees Directory' : 'Back to Dashboard'}</span>
        </button>

        {canManage && (
          <div className="flex items-center gap-2">
            <Link to={`/employees/${id}/edit`}>
              <Button variant="outline" size="sm" icon={FiEdit2}>
                Edit Full Record
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              icon={FiTrash2}
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {deleteError && (
        <div className="flex items-start gap-2 p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Operation Failed</p>
            <p>{deleteError}</p>
          </div>
        </div>
      )}

      {/* Profile Overview Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
            {initials}
          </div>

          {/* Core Info */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight truncate">
                {displayName}
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                {employee.employeeCode}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge status={employee.roleName} text={employee.roleName || 'Unassigned'} />
              <Badge
                status={employee.employmentStatus}
                text={formatEmploymentStatus(employee.employmentStatus)}
              />
              <span className="text-xs text-slate-400 font-medium">
                Department: <strong className="text-slate-700 font-semibold">{employee.departmentName || 'None'}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employment Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FiBriefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Employment Details</h2>
              <p className="text-xs text-slate-500">Official company records and organizational designation</p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm divide-y divide-slate-50">
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Employee Code</span>
              <span className="font-mono font-semibold text-slate-800">{employee.employeeCode}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-semibold text-slate-800">{employee.departmentName || '-'}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Designation / Role</span>
              <span className="font-semibold text-slate-800">{employee.roleName || '-'}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Reporting Manager</span>
              <span className="font-semibold text-slate-800">
                {employee.managerName || 'None (Top-Level)'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Employment Status</span>
              <Badge
                status={employee.employmentStatus}
                text={formatEmploymentStatus(employee.employmentStatus)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Date of Joining</span>
              <span className="font-semibold text-slate-800">{formatDate(employee.dateOfJoining)}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Record Created</span>
              <span className="text-xs text-slate-600">{formatDate(employee.createdAt)}</span>
            </div>

            {employee.updatedAt && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 font-medium">Last Modified</span>
                <span className="text-xs text-slate-600">{formatDate(employee.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FiUser className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Personal Information</h2>
                <p className="text-xs text-slate-500">Contact details and biographical identity</p>
              </div>
            </div>

            {canEditPersonal && !isEditingPersonal && (
              <Button
                variant="outline"
                size="sm"
                icon={FiEdit2}
                onClick={handleStartEditPersonal}
              >
                Edit
              </Button>
            )}
          </div>

          {/* Feedback banner */}
          {personalFeedback && (
            <div
              className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold ${
                personalFeedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {personalFeedback.type === 'success' ? (
                <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              )}
              <span>{personalFeedback.message}</span>
            </div>
          )}

          {isEditingPersonal ? (
            /* Editable Form View */
            <form onSubmit={handleSavePersonal} className="space-y-4 pt-1">
              <div>
                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider mb-1">
                  Full Legal Name
                </span>
                <p className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl">
                  {displayName}
                </p>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Name modifications require administrative review.
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider mb-1">
                  Email Address
                </span>
                <p className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl">
                  {employee.email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FiPhone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={personalForm.phone}
                    onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                    placeholder="e.g. +1 555-0199"
                    maxLength={20}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Gender
                  </label>
                  <select
                    value={personalForm.gender}
                    onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={personalForm.dateOfBirth}
                    onChange={(e) => setPersonalForm({ ...personalForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Residential Address
                </label>
                <textarea
                  rows={3}
                  value={personalForm.address}
                  onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                  placeholder="Enter full residential address..."
                  maxLength={250}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isSavingPersonal}
                  onClick={handleCancelEditPersonal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingPersonal}
                  icon={FiCheck}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            /* Read-Only Details View */
            <div className="space-y-3.5 text-sm divide-y divide-slate-50">
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 font-medium">Full Legal Name</span>
                <span className="font-semibold text-slate-800">{displayName}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 font-medium">Email Address</span>
                <a
                  href={`mailto:${employee.email}`}
                  className="font-medium text-blue-600 hover:underline flex items-center gap-1.5"
                >
                  <FiMail className="w-3.5 h-3.5" />
                  <span>{employee.email}</span>
                </a>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 font-medium">Phone Number</span>
                {employee.phone ? (
                  <a
                    href={`tel:${employee.phone}`}
                    className="font-medium text-slate-800 flex items-center gap-1.5 hover:text-blue-600"
                  >
                    <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{employee.phone}</span>
                  </a>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 font-medium">Gender</span>
                <span className="font-semibold text-slate-800">{employee.gender || '-'}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 font-medium">Date of Birth</span>
                <span className="font-semibold text-slate-800">{formatDate(employee.dateOfBirth)}</span>
              </div>

              <div className="pt-2">
                <span className="text-slate-500 font-medium block mb-1">Residential Address</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs leading-relaxed">
                  {employee.address || 'No address registered on file.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Employee"
        message={`Are you sure you want to permanently delete "${displayName}" (${employee.employeeCode})? This action cannot be undone.`}
        confirmText="Delete Employee"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default EmployeeDetails;
