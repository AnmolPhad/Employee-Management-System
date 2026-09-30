import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiClock, FiAlertCircle } from 'react-icons/fi';
import attendanceApi from '../../api/attendanceApi';
import { ROUTES } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import AttendanceFilters from '../../components/attendance/AttendanceFilters';

const AdminAttendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    employeeId: '',
  });

  const fetchAdminAttendance = async () => {
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
      if (filters.employeeId) {
        params.employeeId = Number(filters.employeeId);
      }

      const res = await attendanceApi.getAdminAttendance(params);
      const data = res?.data || {};
      const items = data?.items || (Array.isArray(data) ? data : []);

      setAttendances(items);
      setTotalPages(data?.totalPages || 1);
      setTotalCount(data?.totalCount || items.length);
    } catch (err) {
      console.error('Failed to load admin attendance records:', err);
      setError(err?.message || 'Unable to retrieve department attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminAttendance();
  }, [page, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      employeeId: '',
    });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Staff Attendance Management
            </h1>
            {totalCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {totalCount} records
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Audit employee daily attendance, review check-in/out timestamps, and monitor hour compliance.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <AttendanceFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        onRefresh={fetchAdminAttendance}
        isLoading={loading}
        showEmployeeFilter={true}
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
        <LoadingSpinner size="lg" message="Loading staff attendance records..." />
      ) : attendances.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiUsers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              No Attendance Records Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {filters.status || filters.startDate || filters.endDate || filters.employeeId
                ? 'No employee records match your selected filter parameters.'
                : 'No staff attendance records are logged in the system.'}
            </p>
            {(filters.status || filters.startDate || filters.endDate || filters.employeeId) && (
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
            isAdminView={true}
            baseDetailsPath="/admin/attendance"
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

export default AdminAttendance;
