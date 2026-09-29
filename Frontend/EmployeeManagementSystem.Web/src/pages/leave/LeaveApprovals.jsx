import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCheckSquare,
  FiArrowLeft,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiCheck,
  FiClock,
} from 'react-icons/fi';
import leaveApi from '../../api/leaveApi';
import { ROUTES } from '../../utils/constants';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import LeaveTable from '../../components/leave/LeaveTable';
import LeaveApprovalModal from '../../components/leave/LeaveApprovalModal';

const LeaveApprovals = () => {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal State
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [modalAction, setModalAction] = useState('approve'); // 'approve' | 'reject'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await leaveApi.getPendingApprovals();
      const list = res?.data || [];
      setPendingLeaves(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
      setError(err?.message || 'Failed to retrieve pending approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const handleOpenApprove = (leave) => {
    setSelectedLeave(leave);
    setModalAction('approve');
    setIsModalOpen(true);
  };

  const handleOpenReject = (leave) => {
    setSelectedLeave(leave);
    setModalAction('reject');
    setIsModalOpen(true);
  };

  const handleModalConfirm = async (rejectionReason) => {
    if (!selectedLeave) return;

    setActionLoading(true);
    setError('');

    try {
      if (modalAction === 'approve') {
        await leaveApi.approveLeave(selectedLeave.leaveId);
        setSuccessMessage(
          `Leave application #${selectedLeave.leaveId} for ${selectedLeave.employeeName || 'employee'} has been approved.`
        );
      } else {
        await leaveApi.rejectLeave(selectedLeave.leaveId, rejectionReason);
        setSuccessMessage(
          `Leave application #${selectedLeave.leaveId} for ${selectedLeave.employeeName || 'employee'} has been rejected.`
        );
      }
      setIsModalOpen(false);
      setSelectedLeave(null);
      await fetchPendingApprovals();
    } catch (err) {
      console.error(`Failed to execute ${modalAction}:`, err);
      setError(err?.message || `Failed to ${modalAction} application #${selectedLeave.leaveId}.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={ROUTES.LEAVE}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Leave Dashboard</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Pending Leave Approvals
            </h1>
            {pendingLeaves.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {pendingLeaves.length} pending
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review and adjudicate leave requests assigned to your approval queue.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPendingApprovals}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer disabled:opacity-50"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
          <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Table / Empty state */}
      {loading ? (
        <LoadingSpinner size="lg" message="Checking pending approvals..." />
      ) : pendingLeaves.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              Approval Queue is Empty
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no pending leave requests awaiting your authorization. All incoming requests will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <LeaveTable
            leaves={pendingLeaves}
            isApproverView={true}
            onApprove={handleOpenApprove}
            onReject={handleOpenReject}
          />
        </div>
      )}

      {/* Approval / Rejection Modal */}
      <LeaveApprovalModal
        isOpen={isModalOpen}
        action={modalAction}
        leave={selectedLeave}
        isLoading={actionLoading}
        onConfirm={handleModalConfirm}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLeave(null);
        }}
      />
    </div>
  );
};

export default LeaveApprovals;
