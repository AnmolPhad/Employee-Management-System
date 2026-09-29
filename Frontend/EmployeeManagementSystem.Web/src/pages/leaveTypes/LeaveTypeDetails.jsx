import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiLayers,
  FiCalendar,
  FiDollarSign,
  FiCheckCircle,
  FiFileText,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import leaveTypeApi from '../../api/leaveTypeApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { ROUTES } from '../../utils/constants';

const LeaveTypeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isHR } = useAuth();
  const canManage = isAdmin || isHR;

  const [leaveType, setLeaveType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    const fetchLeaveType = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await leaveTypeApi.getLeaveType(id);
        if (res && res.data) {
          setLeaveType(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load leave type details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLeaveType();
    }
  }, [id]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await leaveTypeApi.deleteLeaveType(id);
      navigate(ROUTES.LEAVE_TYPES);
    } catch (err) {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      const conflictMsg =
        err.status === 409
          ? 'This leave type cannot be deleted because it is currently used by existing leave records.'
          : err.message || 'Failed to delete leave type.';
      setDeleteError(conflictMsg);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12">
        <LoadingSpinner message="Loading leave category specifications..." />
      </div>
    );
  }

  if (error || !leaveType) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          icon={FiArrowLeft}
          onClick={() => navigate(ROUTES.LEAVE_TYPES)}
        >
          Back to Leave Types
        </Button>
        <ErrorMessage
          message={error || 'Leave type record could not be found.'}
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
          onClick={() => navigate(ROUTES.LEAVE_TYPES)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-fit"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Leave Types Catalog</span>
        </button>

        {canManage && (
          <div className="flex items-center gap-2">
            <Link to={`/leave-types/${id}/edit`}>
              <Button variant="outline" size="sm" icon={FiEdit2}>
                Edit Leave Type
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

      {/* Header Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
            <FiLayers className="w-8 h-8" />
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight truncate">
                {leaveType.leaveTypeName}
              </h1>
              <Badge
                status={leaveType.isPaid ? 'Paid' : 'Unpaid'}
                text={leaveType.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
              />
              <Badge
                status={leaveType.isActive ? 'Active' : 'Inactive'}
                text={leaveType.isActive ? 'Active' : 'Inactive'}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                <FiCalendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Annual Limit: {leaveType.maxDaysPerYear} days</span>
              </span>

              <span>&bull;</span>

              <span>{leaveType.leaveCount || 0} active/historical records attached</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entitlement & Quota Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FiCalendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Entitlement Rules</h2>
              <p className="text-xs text-slate-500">Allowable calendar days and quota restrictions</p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm divide-y divide-slate-50">
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Max Days Per Year</span>
              <span className="font-bold text-slate-800">{leaveType.maxDaysPerYear} days</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Leave Classification</span>
              <Badge
                status={leaveType.isPaid ? 'Paid' : 'Unpaid'}
                text={leaveType.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Availability Status</span>
              <Badge
                status={leaveType.isActive ? 'Active' : 'Inactive'}
                text={leaveType.isActive ? 'Active' : 'Inactive'}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Associated Applications</span>
              <span className="font-semibold text-slate-800">{leaveType.leaveCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Payroll & Remuneration Impact */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FiDollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Payroll Integration Impact</h2>
              <p className="text-xs text-slate-500">How this leave category affects monthly salary</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div
              className={`p-3.5 rounded-xl border ${
                leaveType.isPaid
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/60 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <FiInfo className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold mb-1">
                    {leaveType.isPaid ? 'Fully Paid Leave' : 'Unpaid Leave (Salary Deductions)'}
                  </p>
                  <p>
                    {leaveType.isPaid
                      ? 'Approved leave records under this category do not trigger salary reductions. Employees receive full pay for these days.'
                      : 'Approved leave records under this category trigger daily salary deductions calculated against monthly gross salary.'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Note: The salary calculation engine evaluates <code>IsPaid</code> dynamically based on this category setting when generating monthly pay slips.
            </p>
          </div>
        </div>

        {/* Description Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FiFileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Category Description & Policy Guidelines
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {leaveType.description || 'No description or policy guidelines provided for this category.'}
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Leave Type"
        message={`Are you sure you want to permanently delete "${leaveType.leaveTypeName}"? If any employee leave applications reference this category, the deletion will be prevented by the system.`}
        confirmText="Delete Leave Type"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default LeaveTypeDetails;
