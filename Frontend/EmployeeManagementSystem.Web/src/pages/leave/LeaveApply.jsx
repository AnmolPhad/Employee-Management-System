import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import LeaveApplicationForm from '../../components/leave/LeaveApplicationForm';
import leaveApi from '../../api/leaveApi';
import { ROUTES } from '../../utils/constants';

const LeaveApply = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleApply = async (payload) => {
    setSubmitting(true);
    try {
      const response = await leaveApi.createLeave(payload);
      setSuccessMessage('Leave application submitted successfully! Your approval ticket has been created.');
      setTimeout(() => {
        navigate(ROUTES.LEAVE);
      }, 1500);
      return response;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Back link */}
      <div>
        <Link
          to={ROUTES.LEAVE}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Leave Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Apply for Leave</h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit a time-off request. The system will automatically generate an approval ticket and route it to your reporting manager.
        </p>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-xs animate-in fade-in duration-200">
          <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Leave Application Form */}
      <LeaveApplicationForm onSubmit={handleApply} isLoading={submitting} />
    </div>
  );
};

export default LeaveApply;
