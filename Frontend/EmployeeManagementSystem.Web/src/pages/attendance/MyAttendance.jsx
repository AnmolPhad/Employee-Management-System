import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiAlertCircle } from 'react-icons/fi';
import attendanceApi from '../../api/attendanceApi';
import { ROUTES } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import AttendanceFilters from '../../components/attendance/AttendanceFilters';

const MyAttendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        pageSize,
      };

      if (filters.status) {
        params.status = Number(filters.status);
      }
      if (filters.startDate) {
        params.startDate = filters.startDate;
      }
      if (filters.endDate) {
        params.endDate = filters.endDate;
      }

      const res = await attendanceApi.getMyAttendance(params);
      const data = res?.data || {};
      const items = data?.items || (Array.isArray(data) ? data : []);

      setAttendances(items);
      setTotalPages(data?.totalPages || 1);
      setTotalCount(data?.totalCount || items.length);
    } catch (err) {
      console.error('Failed to load my attendance:', err);
      setError(err?.message || 'Unable to retrieve your attendance history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, [page, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to page 1 on filter change
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to={ROUTES.ATTENDANCE}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Attendance Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Attendance History</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your personal daily punch times, working hours, and official attendance classifications.
        </p>
      </div>

      {/* Filters Bar */}
      <AttendanceFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        onRefresh={fetchAttendanceRecords}
        isLoading={loading}
        showEmployeeFilter={false}
      />

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Table & Pagination */}
      {loading ? (
        <LoadingSpinner size="lg" message="Loading attendance records..." />
      ) : attendances.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiClock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              No Attendance Records Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {filters.status || filters.startDate || filters.endDate
                ? 'No records match your selected filter criteria.'
                : 'No attendance records are registered in the system yet.'}
            </p>
            {(filters.status || filters.startDate || filters.endDate) && (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <AttendanceTable
            attendances={attendances}
            isAdminView={false}
            baseDetailsPath="/attendance"
          />

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

export default MyAttendance;
