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
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import employeeApi from '../../api/employeeApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatDate, formatEmploymentStatus } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';

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
  const { isAdmin, isHR } = useAuth();
  const canManage = isAdmin || isHR;

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
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

    if (id) {
      fetchEmployee();
    }
  }, [id]);

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
          onClick={() => navigate(ROUTES.EMPLOYEES)}
        >
          Back to Directory
        </Button>
        <ErrorMessage
          message={error || 'Employee record could not be found.'}
          onRetry={() => window.location.reload()}
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
          onClick={() => navigate(ROUTES.EMPLOYEES)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-fit"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Employees Directory</span>
        </button>

        {canManage && (
          <div className="flex items-center gap-2">
            <Link to={`/employees/${id}/edit`}>
              <Button variant="outline" size="sm" icon={FiEdit2}>
                Edit Profile
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
              <p className="text-xs text-slate-500">Official company records and hierarchical position</p>
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
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FiUser className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Personal Information</h2>
              <p className="text-xs text-slate-500">Contact details and identity information</p>
            </div>
          </div>

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
