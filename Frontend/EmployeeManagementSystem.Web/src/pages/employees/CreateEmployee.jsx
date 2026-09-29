import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiChevronRight, FiUsers } from 'react-icons/fi';
import employeeApi from '../../api/employeeApi';
import EmployeeForm from '../../components/employees/EmployeeForm';
import { ROUTES } from '../../utils/constants';

const CreateEmployee = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await employeeApi.createEmployee(payload);
      navigate(ROUTES.EMPLOYEES);
    } finally {
      setSubmitting(false);
    }
  };

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
        <span className="text-slate-800 font-semibold">New Employee</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Add New Employee</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create an official personnel profile and assign organization credentials
        </p>
      </div>

      {/* Form */}
      <EmployeeForm
        isEdit={false}
        isLoading={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default CreateEmployee;
