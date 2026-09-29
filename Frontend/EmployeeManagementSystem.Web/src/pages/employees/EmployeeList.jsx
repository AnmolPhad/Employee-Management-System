import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiUserPlus, FiFilter, FiRotateCcw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import employeeApi from '../../api/employeeApi';
import departmentApi from '../../api/departmentApi';
import EmployeeTable from '../../components/employees/EmployeeTable';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { SYSTEM_ROLES, EMPLOYMENT_STATUSES, ROUTES } from '../../utils/constants';

const EmployeeList = () => {
  const { isAdmin, isHR } = useAuth();
  const canManage = isAdmin || isHR;

  // Query parameters state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Data state
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch departments for filter dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await departmentApi.getDepartments({ pageSize: 100 });
        if (res && res.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.items || [];
          setDepartments(list);
        }
      } catch (err) {
        console.error('Failed to load departments for filter:', err);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        pageSize,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (selectedDept) {
        params.departmentId = Number(selectedDept);
      }
      if (selectedRole) {
        params.roleId = Number(selectedRole);
      }
      if (selectedStatus) {
        params.status = selectedStatus;
      }

      const res = await employeeApi.getEmployees(params);

      if (res && res.data) {
        const pagedData = res.data;
        setEmployees(pagedData.items || []);
        setTotalCount(pagedData.totalCount || 0);
        setTotalPages(pagedData.totalPages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, selectedDept, selectedRole, selectedStatus]);

  // Load employees when filters change
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Debounced search / filter change triggers page reset
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleDeptChange = (e) => {
    setSelectedDept(e.target.value);
    setPage(1);
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    setSelectedRole('');
    setSelectedStatus('');
    setPage(1);
  };

  const isFiltered = Boolean(searchTerm || selectedDept || selectedRole || selectedStatus);

  // Delete handlers
  const handleOpenDelete = (emp) => {
    setEmployeeToDelete(emp);
    setDeleteModalOpen(true);
    setFeedback(null);
  };

  const handleCloseDelete = () => {
    setDeleteModalOpen(false);
    setEmployeeToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    setFeedback(null);

    try {
      await employeeApi.deleteEmployee(employeeToDelete.employeeId);
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
      setFeedback({
        type: 'success',
        message: `Employee "${employeeToDelete.fullName || employeeToDelete.employeeCode}" was deleted successfully.`,
      });
      // Refresh list
      fetchEmployees();
    } catch (err) {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      const conflictMsg =
        err.status === 409
          ? `Cannot delete employee: ${err.message}`
          : err.message || 'Failed to delete employee.';
      setFeedback({
        type: 'error',
        message: conflictMsg,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage organization members, assignments, roles, and profiles
          </p>
        </div>
        {canManage && (
          <Link to={ROUTES.EMPLOYEES_CREATE}>
            <Button variant="primary" icon={FiUserPlus}>
              Add Employee
            </Button>
          </Link>
        )}
      </div>

      {/* Feedback banner (Success or Conflict Error) */}
      {feedback && (
        <div
          className={`flex items-start justify-between p-4 rounded-xl border text-sm font-medium animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <FiAlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs uppercase font-bold tracking-wider hover:underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center gap-1.5">
            <FiFilter className="w-3.5 h-3.5" />
            <span>Search & Filters</span>
          </div>
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 normal-case font-semibold cursor-pointer"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name, code, email..."
          />

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={handleDeptChange}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={handleRoleChange}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
          >
            <option value="">All Roles</option>
            {SYSTEM_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
          >
            <option value="">All Statuses</option>
            {EMPLOYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12">
          <LoadingSpinner message="Fetching employee directory..." />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchEmployees} />
      ) : employees.length === 0 ? (
        <EmptyState
          title="No Employees Found"
          message={
            isFiltered
              ? 'No employee profiles match the applied filter criteria. Try adjusting or resetting your search.'
              : 'There are currently no employee records registered in the system.'
          }
          action={
            isFiltered ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            ) : canManage ? (
              <Link to={ROUTES.EMPLOYEES_CREATE}>
                <Button variant="primary" size="sm" icon={FiUserPlus}>
                  Add First Employee
                </Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          <EmployeeTable
            employees={employees}
            onDelete={handleOpenDelete}
            canEdit={canManage}
            canDelete={canManage}
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Employee"
        message={`Are you sure you want to permanently delete "${
          employeeToDelete?.fullName || employeeToDelete?.email || 'this employee'
        }" (${employeeToDelete?.employeeCode})? This action cannot be undone.`}
        confirmText="Delete Employee"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDelete}
      />
    </div>
  );
};

export default EmployeeList;
