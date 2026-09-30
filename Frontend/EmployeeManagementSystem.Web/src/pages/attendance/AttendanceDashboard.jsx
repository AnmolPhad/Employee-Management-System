import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiClock,
  FiCalendar,
  FiList,
  FiUsers,
  FiArrowRight,
  FiRefreshCw,
  FiCheckCircle,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import attendanceApi from '../../api/attendanceApi';
import { ROUTES } from '../../utils/constants';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import CheckInOutCard from '../../components/attendance/CheckInOutCard';
import AttendanceTable from '../../components/attendance/AttendanceTable';

const AttendanceDashboard = () => {
  const { isAdmin, isHR, isManager } = useAuth();
  const isManagement = isAdmin || isHR || isManager;

  const [todayRecord, setTodayRecord] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Fetch today's record and recent records in parallel
      const [todayData, recentRes] = await Promise.all([
        attendanceApi.getTodayAttendance(),
        attendanceApi.getMyAttendance({ page: 1, pageSize: 5 }),
      ]);

      setTodayRecord(todayData);
      const items = recentRes?.data?.items || recentRes?.data || [];
      setRecentRecords(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load attendance dashboard:', err);
      setError(err?.message || 'Failed to retrieve attendance records. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCheckIn = async (remarks) => {
    setActionLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await attendanceApi.checkIn({ remarks });
      setSuccessMessage(res?.message || 'Check-in recorded successfully!');
      // Authoritatively reload state from backend
      await loadDashboardData();
    } catch (err) {
      console.error('Check-in failed:', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to record check-in. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (remarks) => {
    setActionLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await attendanceApi.checkOut({ remarks });
      setSuccessMessage(res?.message || 'Check-out recorded successfully! Hours calculated.');
      // Authoritatively reload state from backend
      await loadDashboardData();
    } catch (err) {
      console.error('Check-out failed:', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to record check-out. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !todayRecord) {
    return <LoadingSpinner size="lg" message="Loading attendance dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Attendance Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily work hours, record punch times, and review your attendance history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            as={Link}
            to={ROUTES.ATTENDANCE_MY}
            variant="outline"
            icon={FiList}
          >
            My Attendance
          </Button>

          {isManagement && (
            <Button
              as={Link}
              to={ROUTES.ADMIN_ATTENDANCE}
              variant="outline"
              icon={FiUsers}
            >
              Staff Attendance
            </Button>
          )}

          <Button
            as={Link}
            to={ROUTES.LEAVE}
            variant="outline"
            icon={FiCalendar}
          >
            Leave Portal
          </Button>
        </div>
      </div>

      {/* Check In / Check Out Interactive Card */}
      <CheckInOutCard
        todayRecord={todayRecord}
        isLoading={loading}
        isActionLoading={actionLoading}
        error={error}
        successMessage={successMessage}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onRefresh={loadDashboardData}
      />

      {/* Recent Attendance Activity Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Recent Attendance Records
          </h2>
          {recentRecords.length > 0 && (
            <Link
              to={ROUTES.ATTENDANCE_MY}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Full History</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {recentRecords.length === 0 ? (
          <Card>
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiClock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">
                No Attendance Records Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Punch in today to begin recording your daily attendance.
              </p>
            </div>
          </Card>
        ) : (
          <AttendanceTable
            attendances={recentRecords}
            isAdminView={false}
            baseDetailsPath="/attendance"
          />
        )}
      </div>
    </div>
  );
};

export default AttendanceDashboard;
