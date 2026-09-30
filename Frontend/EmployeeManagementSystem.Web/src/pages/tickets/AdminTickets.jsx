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
  FiArrowLeft,
  FiFilter,
  FiTag,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiShield,
  FiSearch,
} from 'react-icons/fi';

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchEmployee, setSearchEmployee] = useState('');

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

      const res = await ticketApi.getAllTicketsAdmin(params);
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
      setError(err.response?.data?.message || 'Failed to fetch global leave tickets.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleClearFilters = () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setSearchEmployee('');
    setCurrentPage(1);
  };

  // Client search filter on employee name / code / title
  const filteredTickets = tickets.filter((t) => {
    if (!searchEmployee) return true;
    const q = searchEmployee.toLowerCase();
    const nameMatch = t.employeeName?.toLowerCase().includes(q);
    const codeMatch = t.employeeCode?.toLowerCase().includes(q);
    const titleMatch = t.title?.toLowerCase().includes(q);
    return nameMatch || codeMatch || titleMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to={ROUTES.TICKETS}
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <FiArrowLeft className="mr-1 w-3.5 h-3.5" /> Back to Tickets Overview
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-800">Global Leave Approval Tickets</h1>
            <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full font-bold">
              Admin Oversight
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Organization-wide oversight of all leave approval tickets and their resolution lifecycle.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FiFilter className="w-3.5 h-3.5" />
              Filter Organization Tickets
            </span>
            {(statusFilter || startDate || endDate || searchEmployee) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search applicant or code..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
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
              <input
                type="date"
                placeholder="From Date"
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
              <input
                type="date"
                placeholder="Until Date"
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

      {/* Main Table */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchTickets} />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          title="No Leave Tickets Found"
          message="There are no organization leave approval tickets matching the current filters."
          icon={FiTag}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <TicketTable tickets={filteredTickets} mode="admin" />
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

export default AdminTickets;
