import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiChevronRight, FiBriefcase } from 'react-icons/fi';
import departmentApi from '../../api/departmentApi';
import DepartmentForm from '../../components/departments/DepartmentForm';
import { ROUTES } from '../../utils/constants';

const CreateDepartment = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await departmentApi.createDepartment(payload);
      navigate(ROUTES.DEPARTMENTS);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          to={ROUTES.DEPARTMENTS}
          className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
        >
          <FiBriefcase className="w-3.5 h-3.5" />
          <span>Departments</span>
        </Link>
        <FiChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">New Department</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create Department</h1>
        <p className="text-sm text-slate-500 mt-1">
          Establish an organizational unit, define leadership, and set office location
        </p>
      </div>

      {/* Form */}
      <DepartmentForm
        isEdit={false}
        isLoading={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default CreateDepartment;
