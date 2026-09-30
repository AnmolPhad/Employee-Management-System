import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ticketApi from '../../api/ticketApi';
import TicketTable from '../../components/tickets/TicketTable';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { ROUTES } from '../../utils/constants';
import {
  FiFilter,
  FiTag,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiPlus,
} from 'react-icons/fi';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Summary Metrics for currently logged-in user's submitted tickets
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch KPI stats for user's submitted tickets
  const fetchStats = useCallback(async () => {
    try {
      const res = await ticketApi.getMyTickets({ pageSize: 100 });
      const data = res.data?.data || res.data;
      const items = data?.items || (Array.isArray(data) ? data : []);
      const total = data?.totalCount ?? items.length;
      const pending = items.filter((t) => t.status === 'Pending').length;
      const approved = items.filter((t) => t.status === 'Approved').length;
      const rejected = items.filter((t) => t.status === 'Rejected').length;
      setStats({ total, pending, approved, rejected });
    } catch (err) {
      console.warn('Failed to load personal ticket summary stats:', err);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        pageSize: pageSize,
      };

      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await ticketApi.getMyTickets(params);
      const data = res.data?.data || res.data;

      if (data && data.items) {
        setTickets(data.items);
        setTotalCount(data.totalCount || data.items.length);
        setTotalPages(data.totalPages || Math.ceil((data.totalCount || data.items.length) / pageSize));
      } else if (Array.isArray(data)) {
        setTickets(data);
        setTotalCount(data.length);
        setTotalPages(Math.ceil(data.length / pageSize));
      } else {
        setTickets([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch personal leave tickets.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleClearFilters = () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Leave Approval Tickets</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Full chronological archive of your submitted leave requests and their approver routing status.
          </p>
        </div>

        <div>
          <Link to={ROUTES.LEAVE_APPLY}>
            <Button variant="primary" icon={FiPlus}>
              Apply for Leave
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                My Total Tickets
              </p>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {stats.total}
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
                {stats.pending}
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
                {stats.approved}
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
                {stats.rejected}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Application rejected</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
              <FiXCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Card */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FiFilter className="w-3.5 h-3.5" />
              Filter Tickets
            </span>
            {(statusFilter || startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Ticket Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Submitted From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Submitted Until
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchTickets} />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No Leave Tickets Found"
          message="You have not submitted any leave applications matching the selected criteria."
          icon={FiTag}
          actionLabel="Apply for Leave"
          onAction={() => window.location.assign(ROUTES.LEAVE_APPLY)}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <TicketTable tickets={tickets} mode="my" />
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
    </div>
  );
};

export default MyTickets;
