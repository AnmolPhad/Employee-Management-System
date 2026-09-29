import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiMail,
  FiBriefcase,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiFileText,
  FiCheck,
  FiX,
  FiShield,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import leaveApi from '../../api/leaveApi';
import { ROUTES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import LeaveStatusBadge from '../../components/leave/LeaveStatusBadge';
import LeaveApprovalModal from '../../components/leave/LeaveApprovalModal';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LeaveDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isHR, isManager } = useAuth();
  const isApproverRole = isAdmin || isHR || isManager;

  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState('approve'); // 'approve' | 'reject'
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeave = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await leaveApi.getLeaveById(id);
      const data = res?.data || null;
      if (!data) {
        throw new Error('Leave application details not found.');
      }
      setLeave(data);
    } catch (err) {
      console.error('Failed to load leave application:', err);
      setError(err?.message || 'Unable to retrieve leave application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLeave();
    }
  }, [id]);

  const handleOpenApproveModal = () => {
    setModalAction('approve');
    setModalOpen(true);
  };

  const handleOpenRejectModal = () => {
    setModalAction('reject');
    setModalOpen(true);
  };

  const handleModalConfirm = async (rejectionReason) => {
    setActionLoading(true);
    setError('');

    try {
      if (modalAction === 'approve') {
        await leaveApi.approveLeave(leave.leaveId);
        setActionSuccess('Leave application successfully approved.');
      } else {
        await leaveApi.rejectLeave(leave.leaveId, rejectionReason);
        setActionSuccess('Leave application successfully rejected.');
      }
      setModalOpen(false);
      await fetchLeave();
    } catch (err) {
      console.error(`Failed to ${modalAction} leave:`, err);
      setError(err?.message || `Failed to ${modalAction} leave application.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading application details..." />;
  }

  if (error && !leave) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-6">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <Button variant="outline" icon={FiArrowLeft} onClick={() => navigate(ROUTES.LEAVE)}>
          Return to Leave Dashboard
        </Button>
      </div>
    );
  }

  const isPending =
    leave?.status === 1 ||
    (typeof leave?.status === 'string' && leave?.status.toLowerCase() === 'pending');
  const isApproved =
    leave?.status === 2 ||
    (typeof leave?.status === 'string' && leave?.status.toLowerCase() === 'approved');
  const isRejected =
    leave?.status === 3 ||
    (typeof leave?.status === 'string' && leave?.status.toLowerCase() === 'rejected');

  // Check if current user is not the applicant themselves (approver should not self-approve)
  const isApplicant = user?.id === leave?.employeeId || user?.employeeId === leave?.employeeId;
  const canApprove = isApproverRole && isPending && !isApplicant;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link & Top Header */}
      <div>
        <Link
          to={ROUTES.LEAVE}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Leave Dashboard</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Leave Application #{leave.leaveId}
              </h1>
              <LeaveStatusBadge status={leave.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Submitted on {formatDate(leave.appliedDate)}
            </p>
          </div>

          {/* Quick Approver Actions */}
          {canApprove && (
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                className="text-rose-600 hover:bg-rose-50 border-rose-200"
                icon={FiX}
                onClick={handleOpenRejectModal}
              >
                Reject Request
              </Button>
              <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700"
                icon={FiCheck}
                onClick={handleOpenApproveModal}
              >
                Approve Request
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-xs">
          <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
          <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Rejection Alert Banner if Rejected */}
      {isRejected && (
        <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <FiXCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Application Rejected</span>
          </div>
          <p className="text-xs text-rose-700">
            <strong>Reason for Rejection:</strong>{' '}
            <span className="italic">
              "{leave.rejectionReason || 'No rejection rationale provided.'}"
            </span>
          </p>
          {leave.approvedByName && (
            <p className="text-[11px] text-rose-600">
              Reviewed by {leave.approvedByName} on {formatDate(leave.approvedDate)}
            </p>
          )}
        </div>
      )}

      {/* Approval Banner if Approved */}
      {isApproved && (
        <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center gap-3">
          <FiCheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-emerald-900">Application Approved</h4>
            <p className="text-xs text-emerald-700">
              Authorized by {leave.approvedByName || 'Authorized Approver'}{' '}
              {leave.approvedDate && `on ${formatDate(leave.approvedDate)}`}. Leave quotas have been deducted.
            </p>
          </div>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {/* Section 1: Leave Overview */}
        <div className="p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Leave Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-xs text-slate-500 block mb-1">Leave Category</span>
              <span className="text-base font-bold text-slate-800">
                {leave.leaveTypeName || 'Time Off'}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 block mb-1">Scheduled Date Range</span>
              <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <span>{formatDate(leave.startDate)}</span>
                <span className="text-slate-400">&rarr;</span>
                <span>{formatDate(leave.endDate)}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 block mb-1">Duration</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <FiCalendar className="w-3.5 h-3.5" />
                <span>{leave.totalDays} {leave.totalDays === 1 ? 'Calendar Day' : 'Calendar Days'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Applicant Information */}
        <div className="p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Applicant Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                <FiUser className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Employee Name</span>
                <span className="text-sm font-bold text-slate-800">
                  {leave.employeeName || 'Unknown'}
                </span>
                <span className="text-xs text-slate-400 block">{leave.employeeCode}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                <FiMail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-slate-500 block">Email Address</span>
                <span className="text-sm font-semibold text-slate-800 truncate block">
                  {leave.employeeEmail || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                <FiBriefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Department</span>
                <span className="text-sm font-semibold text-slate-800">
                  {leave.departmentName || 'General Staff'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Reason Statement */}
        <div className="p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Statement of Reason
          </h2>
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 text-sm leading-relaxed">
            {leave.reason ? (
              <p className="whitespace-pre-line">{leave.reason}</p>
            ) : (
              <span className="italic text-slate-400">No explanation provided.</span>
            )}
          </div>
        </div>

        {/* Section 4: Workflow Review Status */}
        <div className="p-6 bg-slate-50/50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Workflow Audit
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div>
              <span className="font-medium text-slate-500">Submission Timestamp:</span>{' '}
              <span className="font-semibold text-slate-800">{formatDate(leave.appliedDate)}</span>
            </div>

            <div>
              <span className="font-medium text-slate-500">Reviewed By:</span>{' '}
              <span className="font-semibold text-slate-800">
                {leave.approvedByName || 'Pending Review'}
              </span>
            </div>

            {leave.approvedDate && (
              <div>
                <span className="font-medium text-slate-500">Decision Timestamp:</span>{' '}
                <span className="font-semibold text-slate-800">{formatDate(leave.approvedDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Approver */}
      <LeaveApprovalModal
        isOpen={modalOpen}
        action={modalAction}
        leave={leave}
        isLoading={actionLoading}
        onConfirm={handleModalConfirm}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default LeaveDetails;
