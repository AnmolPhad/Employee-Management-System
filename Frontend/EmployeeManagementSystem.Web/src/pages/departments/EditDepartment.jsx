import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiChevronRight, FiBriefcase } from 'react-icons/fi';
import departmentApi from '../../api/departmentApi';
import DepartmentForm from '../../components/departments/DepartmentForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { ROUTES } from '../../utils/constants';

const EditDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDepartment = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await departmentApi.getDepartment(id);
        if (res && res.data) {
          setDepartment(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load department details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDepartment();
    }
  }, [id]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await departmentApi.updateDepartment(id, payload);
      navigate(`/departments/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12">
        <LoadingSpinner message="Loading department records..." />
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="space-y-4">
        <ErrorMessage
          message={error || 'Department record could not be loaded.'}
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
          to={ROUTES.DEPARTMENTS}
          className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
        >
          <FiBriefcase className="w-3.5 h-3.5" />
          <span>Departments</span>
        </Link>
        <FiChevronRight className="w-3 h-3 text-slate-400" />
        <Link
          to={`/departments/${id}`}
          className="hover:text-blue-600 transition-colors"
        >
          {department.departmentName}
        </Link>
        <FiChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">Edit</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Edit Department</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update operational information and leadership for {department.departmentName}
        </p>
      </div>

      {/* Form */}
      <DepartmentForm
        initialData={department}
        isEdit={true}
        isLoading={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default EditDepartment;
