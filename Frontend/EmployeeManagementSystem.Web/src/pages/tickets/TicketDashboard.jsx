import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ticketApi from '../../api/ticketApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import TicketTable from '../../components/tickets/TicketTable';
import ApproveTicketModal from '../../components/tickets/ApproveTicketModal';
import RejectTicketModal from '../../components/tickets/RejectTicketModal';
import { ROUTES } from '../../utils/constants';
import {
  FiTag,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiArrowRight,
  FiCalendar,
  FiCheckSquare,
  FiShield,
  FiLayers,
} from 'react-icons/fi';

const TicketDashboard = () => {
  const { user, isAdmin, isHR, isManager } = useAuth();
  const isApprover = isAdmin || isHR || isManager;

  const [myTickets, setMyTickets] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Approval / Rejection modal states
  const [approveTicket, setApproveTicket] = useState(null);
  const [rejectTicket, setRejectTicket] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch personal tickets
      const myRes = await ticketApi.getMyTickets({ page: 1, pageSize: 5 });
      const myData = myRes.data?.data?.items || myRes.data?.items || [];
      setMyTickets(myData);

      // If user has approver privileges, fetch assigned pending approvals
      if (isApprover) {
        try {
          const appRes = await ticketApi.getMyApprovals({
            status: 'Pending',
            page: 1,
            pageSize: 5,
          });
          const appData = appRes.data?.data?.items || appRes.data?.items || [];
          setApprovals(appData);
        } catch (err) {
          console.warn('Failed to load pending approvals:', err);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isApprover]);

  const handleConfirmApprove = async (ticketId) => {
    try {
      setIsProcessing(true);
      await ticketApi.approveTicket(ticketId);
      setApproveTicket(null);
      setActionSuccess('Leave request approved successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve ticket.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async (ticketId, reason) => {
    try {
      setIsProcessing(true);
      await ticketApi.rejectTicket(ticketId, reason);
      setRejectTicket(null);
      setActionSuccess('Leave request rejected and balance restored.');
      setTimeout(() => setActionSuccess(null), 4000);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject ticket.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Metrics from recent loaded data
  const pendingCount = myTickets.filter((t) => t.status === 'Pending').length;
  const approvedCount = myTickets.filter((t) => t.status === 'Approved').length;
  const rejectedCount = myTickets.filter((t) => t.status === 'Rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leave Approval Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and process leave applications through automated multi-tier approval workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to={ROUTES.LEAVE_APPLY}>
            <Button variant="primary" icon={FiCalendar}>
              Apply for Leave
            </Button>
          </Link>
          {isApprover && (
            <Link to={ROUTES.TICKETS_APPROVALS}>
              <Button variant="outline" icon={FiCheckSquare}>
                Approvals Queue ({approvals.length})
              </Button>
            </Link>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                My Total Tickets
              </p>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {myTickets.length}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Submitted leave requests</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <FiTag className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Pending Approval
              </p>
              <div className="text-2xl font-bold text-amber-800 mt-1">
                {pendingCount}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Awaiting manager/HR review</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <FiClock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Approved Leaves
              </p>
              <div className="text-2xl font-bold text-emerald-800 mt-1">
                {approvedCount}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Successfully authorized</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                Rejected Leaves
              </p>
              <div className="text-2xl font-bold text-rose-800 mt-1">
                {rejectedCount}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Balance restored</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
              <FiXCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Approver Queue Preview (if user has pending approvals) */}
      {isApprover && approvals.length > 0 && (
        <Card className="border-l-4 border-l-amber-500 shadow-sm p-0 overflow-hidden">
          <div className="p-4 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500 text-white">
                <FiCheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Action Required: Assigned Leave Approvals ({approvals.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Subordinates or peers have submitted leave tickets routed to your queue.
                </p>
              </div>
            </div>
            <Link
              to={ROUTES.TICKETS_APPROVALS}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1"
            >
              View Full Queue <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <TicketTable
            tickets={approvals}
            mode="approvals"
            onApprove={(t) => setApproveTicket(t)}
            onReject={(t) => setRejectTicket(t)}
          />
        </Card>
      )}

      {/* Recent Personal Submitted Tickets */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">My Recent Leave Tickets</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generated automatically upon submitting leave applications
            </p>
          </div>
          <Link
            to={ROUTES.TICKETS_MY}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
          >
            View All ({myTickets.length}) <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorMessage message={error} onRetry={fetchDashboardData} />
          </div>
        ) : (
          <TicketTable tickets={myTickets} mode="my" />
        )}
      </Card>

      {/* Explanatory Workflow Routing Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <FiShield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-800">Hierarchical Approval Routing:</span>
          <p className="text-slate-600 leading-relaxed">
            Leave approval tickets are routed automatically based on employee organizational rank:
            <strong> Employee &rarr; Reporting Manager</strong>;
            <strong> Manager &rarr; Human Resources (HR)</strong>;
            <strong> HR Specialist &rarr; System Administrator</strong>.
            Tickets and leave records remain synchronized throughout the lifecycle.
          </p>
        </div>
      </div>

      {/* Approve Modal */}
      <ApproveTicketModal
        isOpen={!!approveTicket}
        ticket={approveTicket}
        isLoading={isProcessing}
        onConfirm={handleConfirmApprove}
        onClose={() => setApproveTicket(null)}
      />

      {/* Reject Modal */}
      <RejectTicketModal
        isOpen={!!rejectTicket}
        ticket={rejectTicket}
        isLoading={isProcessing}
        onConfirm={handleConfirmReject}
        onClose={() => setRejectTicket(null)}
      />
    </div>
  );
};

export default TicketDashboard;
