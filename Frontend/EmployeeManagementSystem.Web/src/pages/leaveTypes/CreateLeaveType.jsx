import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiChevronRight, FiLayers } from 'react-icons/fi';
import leaveTypeApi from '../../api/leaveTypeApi';
import LeaveTypeForm from '../../components/leaveTypes/LeaveTypeForm';
import { ROUTES } from '../../utils/constants';

const CreateLeaveType = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await leaveTypeApi.createLeaveType(payload);
      navigate(ROUTES.LEAVE_TYPES);
    } finally {
      setSubmitting(false);
    }
  };

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
        <span className="text-slate-800 font-semibold">New Category</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create Leave Type</h1>
        <p className="text-sm text-slate-500 mt-1">
          Define an annual leave entitlement category and its salary remuneration rules
        </p>
      </div>

      {/* Form */}
      <LeaveTypeForm
        isEdit={false}
        isLoading={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default CreateLeaveType;
