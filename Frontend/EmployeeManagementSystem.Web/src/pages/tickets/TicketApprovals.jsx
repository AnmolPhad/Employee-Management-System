import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ticketApi from '../../api/ticketApi';
import TicketTable from '../../components/tickets/TicketTable';
import ApproveTicketModal from '../../components/tickets/ApproveTicketModal';
import RejectTicketModal from '../../components/tickets/RejectTicketModal';
import ApproveAllModal from '../../components/tickets/ApproveAllModal';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { ROUTES } from '../../utils/constants';
import {
  FiArrowLeft,
  FiFilter,
  FiCheckSquare,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiSearch,
} from 'react-icons/fi';

const TicketApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [approveTicket, setApproveTicket] = useState(null);
  const [rejectTicket, setRejectTicket] = useState(null);
  const [isApproveAllOpen, setIsApproveAllOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        pageSize: pageSize,
      };

      if (statusFilter) params.status = statusFilter;

      const res = await ticketApi.getMyApprovals(params);
      const data = res.data?.data || res.data;

      if (data && data.items) {
        setApprovals(data.items);
        setTotalCount(data.totalCount || data.items.length);
        setTotalPages(data.totalPages || Math.ceil((data.totalCount || data.items.length) / pageSize));
      } else if (Array.isArray(data)) {
        setApprovals(data);
        setTotalCount(data.length);
        setTotalPages(Math.ceil(data.length / pageSize));
      } else {
        setApprovals([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assigned approvals queue.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleConfirmApprove = async (ticketId) => {
    try {
      setIsProcessing(true);
      await ticketApi.approveTicket(ticketId);
      setApproveTicket(null);
      setActionSuccess('Leave request approved successfully. Leave status synchronized.');
      setTimeout(() => setActionSuccess(null), 4000);
      fetchApprovals();
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
      setActionSuccess('Leave request rejected. Leave balance restored.');
      setTimeout(() => setActionSuccess(null), 4000);
      fetchApprovals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject ticket.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmApproveAll = async () => {
    try {
      setIsProcessing(true);
      const res = await ticketApi.approveAllMyPendingTickets();
      const approvedCount = res.data?.data?.approvedCount ?? totalCount;
      setIsApproveAllOpen(false);
      setActionSuccess(`Successfully approved ${approvedCount} leave ticket${approvedCount === 1 ? '' : 's'}.`);
      setTimeout(() => setActionSuccess(null), 5000);
      fetchApprovals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to bulk-approve tickets.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Client search filter on applicant name / code
  const filteredApprovals = approvals.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = item.employeeName?.toLowerCase().includes(q);
    const codeMatch = item.employeeCode?.toLowerCase().includes(q);
    const titleMatch = item.title?.toLowerCase().includes(q);
    return nameMatch || codeMatch || titleMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assigned Approvals Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review and adjudicate subordinate leave approval tickets routed to you.
          </p>
        </div>

        {statusFilter === 'Pending' && totalCount > 0 && (
          <div>
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              icon={FiCheckCircle}
              onClick={() => setIsApproveAllOpen(true)}
            >
              Approve All ({totalCount})
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

      {/* Tabs / Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Quick status tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
            {[
              { id: 'Pending', label: 'Pending Review', icon: FiClock },
              { id: 'Approved', label: 'Approved', icon: FiCheckCircle },
              { id: 'Rejected', label: 'Rejected', icon: FiXCircle },
              { id: '', label: 'All History', icon: FiCheckSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employee or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Main Table */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchApprovals} />
      ) : filteredApprovals.length === 0 ? (
        <EmptyState
          title={statusFilter === 'Pending' ? 'No Pending Approvals' : 'No Tickets Found'}
          message={
            statusFilter === 'Pending'
              ? 'Your queue is all caught up! You have no leave approval tickets awaiting your review.'
              : 'There are no approval records matching your criteria.'
          }
          icon={FiCheckCircle}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <TicketTable
            tickets={filteredApprovals}
            mode="approvals"
            onApprove={(t) => setApproveTicket(t)}
            onReject={(t) => setRejectTicket(t)}
          />
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </Card>
      )}

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

      {/* Approve All Modal */}
      <ApproveAllModal
        isOpen={isApproveAllOpen}
        count={totalCount}
        isLoading={isProcessing}
        onConfirm={handleConfirmApproveAll}
        onClose={() => setIsApproveAllOpen(false)}
      />
    </div>
  );
};

export default TicketApprovals;
