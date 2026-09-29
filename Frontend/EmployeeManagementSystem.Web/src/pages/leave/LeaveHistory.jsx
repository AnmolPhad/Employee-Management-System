import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiPlus,
  FiFilter,
  FiArrowLeft,
  FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi';
import leaveApi from '../../api/leaveApi';
import { ROUTES } from '../../utils/constants';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import LeaveTable from '../../components/leave/LeaveTable';
import Pagination from '../../components/common/Pagination';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: '1' },
  { label: 'Approved', value: '2' },
  { label: 'Rejected', value: '3' },
  { label: 'Cancelled', value: '4' },
];

const LeaveHistory = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination & filter state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLeaveHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        pageSize,
      };
      if (status) {
        params.status = Number(status);
      }

      const res = await leaveApi.getMyLeaves(params);

      // Backend returns PagedResponse<LeaveResponseDto> or ApiResponse<PagedResponse<LeaveResponseDto>>
      const data = res?.data || {};
      const items = data?.items || (Array.isArray(data) ? data : []);

      setLeaves(items);
      setTotalPages(data?.totalPages || 1);
      setTotalCount(data?.totalCount || items.length);
    } catch (err) {
      console.error('Failed to load leave history:', err);
      setError(err?.message || 'Failed to load leave history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveHistory();
  }, [page, status]);

  const handleStatusFilterChange = (e) => {
    setStatus(e.target.value);
    setPage(1); // Reset to page 1 on filter change
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={ROUTES.LEAVE}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Leave Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Leave History</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review the status and details of all your submitted leave applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            as={Link}
            to={ROUTES.LEAVE_APPLY}
            variant="primary"
            icon={FiPlus}
          >
            Apply for Leave
          </Button>
        </div>
      </div>

      {/* Filter and controls bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <FiFilter className="w-4 h-4 text-slate-400" />
            <span>Filter:</span>
          </div>
          <select
            value={status}
            onChange={handleStatusFilterChange}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={fetchLeaveHistory}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer disabled:opacity-50"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Content Table / Loading / Empty */}
      {loading ? (
        <LoadingSpinner size="lg" message="Loading leave history..." />
      ) : leaves.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiCalendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              No Leave Records Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {status
                ? 'No leave applications match the selected status filter.'
                : "You haven't submitted any leave applications yet."}
            </p>
            {status ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus('');
                  setPage(1);
                }}
              >
                Clear Status Filter
              </Button>
            ) : (
              <Button
                as={Link}
                to={ROUTES.LEAVE_APPLY}
                variant="primary"
                size="sm"
                icon={FiPlus}
              >
                Apply for Leave
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <LeaveTable leaves={leaves} isApproverView={false} />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      )}
    </div>
  );
};

export default LeaveHistory;
