import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiBriefcase,
  FiMapPin,
  FiUser,
  FiUsers,
  FiFileText,
  FiClock,
  FiAlertCircle,
  FiMail,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import departmentApi from '../../api/departmentApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatDate } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';

const DepartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isHR } = useAuth();
  const canManage = isAdmin || isHR;

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await departmentApi.getDepartment(id);
        if (res && res.data) {
          setDepartment(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load department details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDepartment();
    }
  }, [id]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await departmentApi.deleteDepartment(id);
      navigate(ROUTES.DEPARTMENTS);
    } catch (err) {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      const conflictMsg =
        err.status === 409
          ? 'This department cannot be deleted because employees are currently assigned to it.'
          : err.message || 'Failed to delete department.';
      setDeleteError(conflictMsg);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12">
        <LoadingSpinner message="Loading department profile..." />
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          icon={FiArrowLeft}
          onClick={() => navigate(ROUTES.DEPARTMENTS)}
        >
          Back to Departments
        </Button>
        <ErrorMessage
          message={error || 'Department record could not be found.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(ROUTES.DEPARTMENTS)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-fit"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Departments Directory</span>
        </button>

        {canManage && (
          <div className="flex items-center gap-2">
            <Link to={`/departments/${id}/edit`}>
              <Button variant="outline" size="sm" icon={FiEdit2}>
                Edit Department
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
            <p className="font-semibold">Operation Conflict</p>
            <p>{deleteError}</p>
          </div>
        </div>
      )}

      {/* Department Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar Icon */}
          <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
            <FiBriefcase className="w-8 h-8" />
          </div>

          {/* Core Info */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight truncate">
                {department.departmentName}
              </h1>
              <Badge
                status={department.isActive ? 'Active' : 'Inactive'}
                text={department.isActive ? 'Active' : 'Inactive'}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <FiMapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{department.location || 'Location Unspecified'}</span>
              </span>

              <span>&bull;</span>

              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                <FiUsers className="w-3.5 h-3.5 text-slate-500" />
                <span>{department.employeeCount || 0} Assigned Workforce</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leadership & Personnel Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FiUser className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Unit Leadership</h2>
              <p className="text-xs text-slate-500">Management and headcount oversight</p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm divide-y divide-slate-50">
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Department Head</span>
              <span className="font-semibold text-slate-800">
                {department.departmentHeadName || 'No Department Head'}
              </span>
            </div>

            {department.departmentHeadEmail && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 font-medium">Head Email</span>
                <a
                  href={`mailto:${department.departmentHeadEmail}`}
                  className="font-medium text-blue-600 hover:underline flex items-center gap-1.5"
                >
                  <FiMail className="w-3.5 h-3.5" />
                  <span>{department.departmentHeadEmail}</span>
                </a>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Workforce Allocation</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <FiUsers className="w-3 h-3 text-slate-500" />
                <span>{department.employeeCount || 0} employees</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Status</span>
              <Badge
                status={department.isActive ? 'Active' : 'Inactive'}
                text={department.isActive ? 'Active' : 'Inactive'}
              />
            </div>
          </div>
        </div>

        {/* Operational & Audit Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FiClock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Operational Records</h2>
              <p className="text-xs text-slate-500">Location and system audit timestamps</p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm divide-y divide-slate-50">
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Location</span>
              <span className="font-semibold text-slate-800">
                {department.location || 'Unspecified'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Created Date</span>
              <span className="text-xs text-slate-600">{formatDate(department.createdAt)}</span>
            </div>

            {department.updatedAt && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 font-medium">Last Modified</span>
                <span className="text-xs text-slate-600">{formatDate(department.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FiFileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Department Description & Scope
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {department.description || 'No description provided for this department.'}
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Department"
        message={`Are you sure you want to permanently delete "${department.departmentName}"? If any employees are assigned to this department, deletion will be blocked by system rules.`}
        confirmText="Delete Department"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default DepartmentDetails;
