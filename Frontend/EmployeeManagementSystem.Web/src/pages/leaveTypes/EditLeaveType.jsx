import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiChevronRight, FiLayers } from 'react-icons/fi';
import leaveTypeApi from '../../api/leaveTypeApi';
import LeaveTypeForm from '../../components/leaveTypes/LeaveTypeForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { ROUTES } from '../../utils/constants';

const EditLeaveType = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leaveType, setLeaveType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLeaveType = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await leaveTypeApi.getLeaveType(id);
        if (res && res.data) {
          setLeaveType(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load leave type details for editing.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLeaveType();
    }
  }, [id]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await leaveTypeApi.updateLeaveType(id, payload);
      navigate(`/leave-types/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12">
        <LoadingSpinner message="Loading leave type specifications..." />
      </div>
    );
  }

  if (error || !leaveType) {
    return (
      <div className="space-y-4">
        <ErrorMessage
          message={error || 'Leave type record could not be loaded.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          to={ROUTES.LEAVE_TYPES}
          className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
        >
          <FiLayers className="w-3.5 h-3.5" />
          <span>Leave Types</span>
        </Link>
        <FiChevronRight className="w-3 h-3 text-slate-400" />
        <Link
          to={`/leave-types/${id}`}
          className="hover:text-blue-600 transition-colors"
        >
          {leaveType.leaveTypeName}
        </Link>
        <FiChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">Edit</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Edit Leave Type</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update entitlement limits and remuneration settings for {leaveType.leaveTypeName}
        </p>
      </div>

      {/* Form */}
      <LeaveTypeForm
        initialData={leaveType}
        isEdit={true}
        isLoading={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default EditLeaveType;
