import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import attendanceApi from '../../api/attendanceApi';
import { ROUTES } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import AttendanceDetailsCard from '../../components/attendance/AttendanceDetailsCard';

const AdminAttendanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await attendanceApi.getAdminAttendanceById(id);
        const data = res?.data || null;
        if (!data) {
          throw new Error('Attendance record not found.');
        }
        setAttendance(data);
      } catch (err) {
        console.error('Failed to load administrative attendance record:', err);
        setError(err?.message || 'Unable to retrieve attendance details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecord();
    }
  }, [id]);

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading attendance details..." />;
  }

  if (error || !attendance) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-6">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span className="text-sm font-medium">{error || 'Attendance record not found.'}</span>
        </div>
        <Button variant="outline" icon={FiArrowLeft} onClick={() => navigate(ROUTES.ADMIN_ATTENDANCE)}>
          Return to Staff Attendance
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to={ROUTES.ADMIN_ATTENDANCE}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Staff Attendance</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Attendance Details</h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed audit view of employee punch timestamps, working hours, and classification metadata.
        </p>
      </div>

      {/* Details Card */}
      <AttendanceDetailsCard attendance={attendance} />
    </div>
  );
};

export default AdminAttendanceDetails;
