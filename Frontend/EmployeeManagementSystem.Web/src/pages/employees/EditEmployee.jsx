import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiChevronRight, FiUsers } from 'react-icons/fi';
import employeeApi from '../../api/employeeApi';
import EmployeeForm from '../../components/employees/EmployeeForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { ROUTES } from '../../utils/constants';

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await employeeApi.getEmployeeById(id);
        if (res && res.data) {
          setEmployee(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load employee details for editing.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await employeeApi.updateEmployee(id, payload);
      navigate(`/employees/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12">
        <LoadingSpinner message="Loading employee information..." />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-4">
        <ErrorMessage
          message={error || 'Employee record could not be loaded.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const displayName =
    employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employeeCode;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          to={ROUTES.EMPLOYEES}
          className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
        >
          <FiUsers className="w-3.5 h-3.5" />
          <span>Employees</span>
        </Link>
        <FiChevronRight className="w-3 h-3 text-slate-400" />
        <Link
          to={`/employees/${id}`}
          className="hover:text-blue-600 transition-colors"
        >
          {displayName}
        </Link>
        <FiChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">Edit</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Edit Employee</h1>
        <p className="text-sm text-slate-500 mt-1">
          Modify organizational records and contact information for {displayName}
        </p>
      </div>

      {/* Form */}
      <EmployeeForm
        initialData={employee}
        isEdit={true}
        isLoading={submitting}
        currentEmployeeId={id}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default EditEmployee;
