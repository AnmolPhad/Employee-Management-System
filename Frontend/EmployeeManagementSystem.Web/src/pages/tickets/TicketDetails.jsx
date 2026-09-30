import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ticketApi from '../../api/ticketApi';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import ApproveTicketModal from '../../components/tickets/ApproveTicketModal';
import RejectTicketModal from '../../components/tickets/RejectTicketModal';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatDate } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiUser,
  FiTag,
  FiClock,
  FiInfo,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiLayers,
} from 'react-icons/fi';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isForbidden, setIsForbidden] = useState(false);

  // Modals
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsForbidden(false);

      const res = await ticketApi.getTicketById(id);
      const data = res.data?.data || res.data;
      setTicket(data);
    } catch (err) {
      if (err.response?.status === 403) {
        setIsForbidden(true);
        setError('You are not authorized to view this ticket. Access is restricted to the applicant, assigned approver, or system administrator.');
      } else {
        setError(err.response?.data?.message || 'Failed to load ticket details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleConfirmApprove = async () => {
    try {
      setIsProcessing(true);
      await ticketApi.approveTicket(id);
      setApproveOpen(false);
      setActionSuccess('Leave request approved successfully. Leave and ticket status synchronized.');
      setTimeout(() => setActionSuccess(null), 4000);
      fetchTicket();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve ticket.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async (ticketId, reason) => {
    try {
      setIsProcessing(true);
      await ticketApi.rejectTicket(id, reason);
      setRejectOpen(false);
      setActionSuccess('Leave request rejected and balance restored.');
      setTimeout(() => setActionSuccess(null), 4000);
      fetchTicket();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject ticket.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          to={ROUTES.TICKETS}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <FiArrowLeft className="mr-1 w-3.5 h-3.5" /> Back to Tickets
        </Link>
        <ErrorMessage message={error || 'Ticket not found'} onRetry={!isForbidden ? fetchTicket : undefined} />
      </div>
    );
  }

  const leave = ticket.leaveDetails || {};
  const isPending = ticket.status === 'Pending' || ticket.status === 1;

  // Determine if current user can approve/reject:
  // User must match assignedToId (or have approver role if assigned)
  // Backend strictly enforces AssignedToId == currentUser.EmployeeId
  const canActOnTicket = isPending && ticket.assignedToId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to={ROUTES.TICKETS}
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <FiArrowLeft className="mr-1 w-3.5 h-3.5" /> Back to Tickets
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">
              Leave Approval Ticket #{ticket.ticketId}
            </h1>
            <TicketStatusBadge status={ticket.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Submitted on {formatDate(ticket.createdAt)} &bull; Reference Code:{' '}
            <span className="font-mono text-slate-700">TCK-{ticket.ticketId}</span>
          </p>
        </div>

        {canActOnTicket && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              icon={FiX}
              onClick={() => setRejectOpen(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Reject Request
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={FiCheck}
              onClick={() => setApproveOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Approve Request
            </Button>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Rejection Alert Banner (if rejected) */}
      {(ticket.status === 'Rejected' || ticket.status === 3) && ticket.rejectionReason && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 flex items-start gap-3">
          <FiAlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-rose-800">Application Rejected:</span>
            <p className="text-rose-700 leading-relaxed font-normal">
              "{ticket.rejectionReason}"
            </p>
            {ticket.rejectedAt && (
              <span className="text-[11px] text-rose-500 block">
                Rejected on: {formatDate(ticket.rejectedAt)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: Ticket Information */}
      <Card>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <FiTag className="w-4 h-4 text-blue-600" />
            Ticket Information
          </h2>
          <span className="text-xs text-slate-400">Category: {ticket.category || 'Leave'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Subject / Title</span>
            <span className="font-semibold text-slate-800">{ticket.title}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Workflow Category</span>
            <span className="font-medium text-slate-700">{ticket.category || 'Leave Approval'}</span>
          </div>

          <div className="md:col-span-2">
            <span className="text-xs text-slate-400 block mb-0.5">System Description</span>
            <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs leading-relaxed font-mono">
              {ticket.description}
            </p>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Created Date</span>
            <span className="text-slate-700 text-xs">{formatDate(ticket.createdAt)}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Last Status Update</span>
            <span className="text-slate-700 text-xs">
              {ticket.approvedAt
                ? `Approved: ${formatDate(ticket.approvedAt)}`
                : ticket.rejectedAt
                ? `Rejected: ${formatDate(ticket.rejectedAt)}`
                : ticket.updatedAt
                ? formatDate(ticket.updatedAt)
                : 'Pending Adjudication'}
            </span>
          </div>
        </div>
      </Card>

      {/* SECTION 2: Related Leave Information */}
      <Card>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-emerald-600" />
            Attached Leave Application
          </h2>
          {ticket.leaveId && (
            <Link
              to={`/leave/${ticket.leaveId}`}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              View Leave Record #{ticket.leaveId} &rarr;
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Leave Type</span>
            <span className="font-semibold text-slate-800">
              {leave.leaveTypeName || 'Leave Application'}
            </span>
            {leave.isPaid !== undefined && (
              <span
                className={`ml-2 inline-block text-[10px] px-1.5 py-0.2 rounded font-medium ${
                  leave.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {leave.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
              </span>
            )}
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Date Range</span>
            <span className="font-medium text-slate-700">
              {leave.startDate ? (
                <>
                  {formatDate(leave.startDate)} &rarr; {formatDate(leave.endDate)}
                </>
              ) : (
                '-'
              )}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Total Duration</span>
            <span className="font-bold text-slate-900">
              {leave.totalDays ? `${leave.totalDays} day(s)` : '-'}
            </span>
          </div>

          {leave.reason && (
            <div className="sm:col-span-2 md:col-span-3">
              <span className="text-xs text-slate-400 block mb-0.5">Applicant Stated Reason</span>
              <p className="text-slate-700 text-xs italic bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                "{leave.reason}"
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* SECTION 3: Approval & Routing Information */}
      <Card>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
          <FiUser className="w-4 h-4 text-purple-600" />
          Approval Workflow & Routing
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Applicant (Creator)</span>
            <span className="font-semibold text-slate-800">
              {ticket.employeeName || `Employee #${ticket.employeeId}`}
            </span>
            {ticket.employeeCode && (
              <span className="text-xs text-slate-400 font-mono block mt-0.5">
                {ticket.employeeCode}
              </span>
            )}
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Assigned Approver</span>
            <span className="font-semibold text-slate-800">
              {ticket.assignedToName || 'Unassigned'}
            </span>
            {ticket.assignedToId && (
              <span className="text-xs text-slate-400 font-mono block mt-0.5">
                Approver ID: #{ticket.assignedToId}
              </span>
            )}
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Workflow Resolution</span>
            <span className="font-medium text-slate-800">
              {ticket.status === 'Approved'
                ? `Approved on ${formatDate(ticket.approvedAt)}`
                : ticket.status === 'Rejected'
                ? `Rejected on ${formatDate(ticket.rejectedAt)}`
                : 'Awaiting Approver Action'}
            </span>
          </div>
        </div>
      </Card>

      {/* Approve Modal */}
      <ApproveTicketModal
        isOpen={approveOpen}
        ticket={ticket}
        isLoading={isProcessing}
        onConfirm={handleConfirmApprove}
        onClose={() => setApproveOpen(false)}
      />

      {/* Reject Modal */}
      <RejectTicketModal
        isOpen={rejectOpen}
        ticket={ticket}
        isLoading={isProcessing}
        onConfirm={handleConfirmReject}
        onClose={() => setRejectOpen(false)}
      />
    </div>
  );
};

export default TicketDetails;
