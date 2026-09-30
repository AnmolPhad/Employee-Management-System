import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiClock,
  FiUser,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
} from 'react-icons/fi';
import holidayApi from '../../api/holidayApi';
import { ROUTES } from '../../utils/constants';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatDate } from '../../utils/formatters';

const HolidayDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [holiday, setHoliday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchHoliday = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await holidayApi.getHolidayById(id);
        const data = res?.data;
        if (!data) {
          throw new Error('Holiday not found.');
        }
        setHoliday(data);
      } catch (err) {
        console.error('Failed to load holiday details:', err);
        setError(err?.message || 'Unable to retrieve holiday details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHoliday();
    }
  }, [id]);

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    setError('');

    try {
      await holidayApi.deleteHoliday(id);
      setDeleteModalOpen(false);
      navigate(ROUTES.HOLIDAYS);
    } catch (err) {
      console.error('Failed to delete holiday:', err);
      setError(
        err?.message ||
        'Unable to delete holiday. It may be referenced by existing attendance records.'
      );
      setDeleteModalOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading holiday details..." />;
  }

  if (error && !holiday) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-6">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span className="text-sm font-medium">{error || 'Holiday not found.'}</span>
        </div>
        <Button variant="outline" icon={FiArrowLeft} onClick={() => navigate(ROUTES.HOLIDAYS)}>
          Return to Holidays
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link & Top Header */}
      <div>
        <Link
          to={ROUTES.HOLIDAYS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Holidays List</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {holiday.holidayName}
              </h1>
              <Badge
                status={holiday.isActive ? 'active' : 'inactive'}
                text={holiday.isActive ? 'Active' : 'Inactive'}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Holiday ID #{holiday.holidayId} &bull; Observed on {formatDate(holiday.holidayDate)}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              as={Link}
              to={`/holidays/${id}/edit`}
              variant="outline"
              icon={FiEdit2}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-rose-600 hover:bg-rose-50 border-rose-200"
              icon={FiTrash2}
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {/* Section 1: Overview */}
        <div className="p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Holiday Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="text-xs text-slate-400 block font-medium mb-1">Observed Calendar Date</span>
              <div className="flex items-center gap-2 text-base font-bold text-slate-800">
                <FiCalendar className="w-5 h-5 text-sky-600" />
                <span>{formatDate(holiday.holidayDate)}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-medium mb-1">Status</span>
              <span className="text-sm font-semibold text-slate-700">
                {holiday.isActive ? 'Active (In Effect)' : 'Inactive (Archived)'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Description */}
        <div className="p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Description
          </h2>
          <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl text-sm text-slate-700 leading-relaxed">
            {holiday.description ? (
              <p className="whitespace-pre-line">{holiday.description}</p>
            ) : (
              <span className="italic text-slate-400">No additional description recorded.</span>
            )}
          </div>
        </div>

        {/* Section 3: Attendance Integration Banner */}
        <div className="p-6 bg-sky-50/50">
          <div className="flex items-start gap-3 text-xs text-sky-900 leading-relaxed">
            <FiInfo className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm text-sky-950 mb-0.5">Attendance Classification Rule</strong>
              When set to <strong>Active</strong>, the backend Attendance module classifies all employee daily records for{' '}
              <strong>{formatDate(holiday.holidayDate)}</strong> as <code>AttendanceStatus.Holiday</code> without requiring check-in/out punches.
            </div>
          </div>
        </div>

        {/* Section 4: Audit Metadata */}
        <div className="p-6 bg-slate-50/40">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Audit Trail
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div>
              <span className="font-medium text-slate-400 block">Configured By:</span>
              <span className="font-semibold text-slate-800">{holiday.createdBy || 'System'}</span>
            </div>

            <div>
              <span className="font-medium text-slate-400 block">Created Timestamp:</span>
              <span className="font-semibold text-slate-800">{formatDate(holiday.createdAt)}</span>
            </div>

            <div>
              <span className="font-medium text-slate-400 block">Last Modified:</span>
              <span className="font-semibold text-slate-800">
                {holiday.updatedAt ? formatDate(holiday.updatedAt) : 'Never updated'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Holiday"
        message={`Are you sure you want to delete "${holiday.holidayName}" (${formatDate(
          holiday.holidayDate
        )})? This action cannot be undone.`}
        confirmText="Confirm Delete"
        confirmVariant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default HolidayDetails;
