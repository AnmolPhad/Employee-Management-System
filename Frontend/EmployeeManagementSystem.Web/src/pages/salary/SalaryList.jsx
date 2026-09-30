import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import salaryApi from '../../api/salaryApi';
import SalaryTable from '../../components/salary/SalaryTable';
import SalarySummaryCard from '../../components/salary/SalarySummaryCard';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { ROUTES } from '../../utils/constants';
import {
  FiPlus,
  FiSettings,
  FiPercent,
  FiSearch,
  FiDollarSign,
  FiUsers,
  FiCheckCircle,
  FiRefreshCw,
  FiFilter,
} from 'react-icons/fi';

const SalaryList = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [minCTC, setMinCTC] = useState('');
  const [maxCTC, setMaxCTC] = useState('');

  // Delete modal state
  const [salaryToDelete, setSalaryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchSalaries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        pageSize: pageSize,
      };

      if (statusFilter) {
        // Map string to enum value if needed, or pass string
        params.status = statusFilter;
      }
      if (minCTC) params.minCTC = parseFloat(minCTC);
      if (maxCTC) params.maxCTC = parseFloat(maxCTC);

      const res = await salaryApi.getSalariesAdmin(params);
      const data = res.data;

      // Check if response is PagedResponse
      if (data && data.items) {
        setSalaries(data.items);
        setTotalCount(data.totalCount || data.items.length);
        setTotalPages(data.totalPages || Math.ceil((data.totalCount || data.items.length) / pageSize));
      } else if (Array.isArray(data)) {
        setSalaries(data);
        setTotalCount(data.length);
        setTotalPages(Math.ceil(data.length / pageSize));
      } else if (data && data.data) {
        const inner = data.data;
        if (inner.items) {
          setSalaries(inner.items);
          setTotalCount(inner.totalCount || inner.items.length);
          setTotalPages(inner.totalPages || 1);
        } else if (Array.isArray(inner)) {
          setSalaries(inner);
          setTotalCount(inner.length);
          setTotalPages(Math.ceil(inner.length / pageSize));
        }
      } else {
        setSalaries([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch salary records.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, minCTC, maxCTC]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  // Client search filter on the current page items if needed
  const filteredSalaries = salaries.filter((s) => {
    if (!searchEmployee) return true;
    const query = searchEmployee.toLowerCase();
    const nameMatch = s.employeeName?.toLowerCase().includes(query);
    const codeMatch = s.employeeCode?.toLowerCase().includes(query);
    const deptMatch = s.departmentName?.toLowerCase().includes(query);
    return nameMatch || codeMatch || deptMatch;
  });

  const handleDeleteClick = (salary) => {
    setDeleteError(null);
    setSalaryToDelete(salary);
  };

  const handleConfirmDelete = async () => {
    if (!salaryToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await salaryApi.deleteSalaryAdmin(salaryToDelete.salaryId);
      setSalaryToDelete(null);
      fetchSalaries();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete salary record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setSearchEmployee('');
    setMinCTC('');
    setMaxCTC('');
    setCurrentPage(1);
  };

  // Metrics computation from loaded list
  const activeCount = salaries.filter((s) => s.status === 1 || s.status === 'Active').length;
  const totalCTC = salaries.reduce((acc, curr) => acc + (parseFloat(curr.annualCTC) || 0), 0);
  const avgCTC = salaries.length > 0 ? totalCTC / salaries.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Salary Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain employee compensation structures, handle revisions, and process monthly payroll calculations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to={ROUTES.ADMIN_SALARY_SETTINGS}>
            <Button variant="outline" icon={FiSettings}>
              Settings
            </Button>
          </Link>
          <Link to={ROUTES.ADMIN_SALARY_CALCULATE}>
            <Button variant="secondary" icon={FiPercent}>
              Payroll Calculator
            </Button>
          </Link>
          <Link to={ROUTES.ADMIN_SALARY_CREATE}>
            <Button variant="primary" icon={FiPlus}>
              Assign Salary
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SalarySummaryCard
          title="Total Active Records"
          amount={activeCount}
          isRawValue={true}
          subtitle={`Out of ${salaries.length} loaded records`}
          icon={FiCheckCircle}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
        <SalarySummaryCard
          title="Cumulative Payroll CTC"
          amount={totalCTC}
          subtitle="Sum of active annual compensation"
          icon={FiDollarSign}
          iconBgColor="bg-blue-50 text-blue-600"
        />
        <SalarySummaryCard
          title="Average Employee CTC"
          amount={avgCTC}
          subtitle="Mean annual package"
          icon={FiUsers}
          iconBgColor="bg-purple-50 text-purple-600"
        />
        <SalarySummaryCard
          title="Monthly Base Exposure"
          amount={totalCTC / 12}
          subtitle="Aggregate base pay per month"
          icon={FiPercent}
          iconBgColor="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Filters Toolbar */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FiFilter className="w-3.5 h-3.5" />
              Filter Compensation Records
            </span>
            {(statusFilter || searchEmployee || minCTC || maxCTC) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search name, code, dept..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Revised">Revised</option>
              </select>
            </div>

            {/* Min CTC */}
            <div>
              <input
                type="number"
                placeholder="Min Annual CTC (₹)"
                value={minCTC}
                onChange={(e) => {
                  setMinCTC(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Max CTC */}
            <div>
              <input
                type="number"
                placeholder="Max Annual CTC (₹)"
                value={maxCTC}
                onChange={(e) => {
                  setMaxCTC(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table / State */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchSalaries} />
      ) : filteredSalaries.length === 0 ? (
        <EmptyState
          title="No Salary Records Found"
          message="There are no compensation records matching your current filter criteria."
          icon={FiDollarSign}
          actionLabel="Assign First Salary"
          onAction={() => window.location.assign(ROUTES.ADMIN_SALARY_CREATE)}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <SalaryTable
            salaries={filteredSalaries}
            onDelete={handleDeleteClick}
          />
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!salaryToDelete}
        title="Delete Salary Record"
        message={
          salaryToDelete
            ? `Are you sure you want to delete the compensation record for ${
                salaryToDelete.employeeName || `Employee #${salaryToDelete.employeeId}`
              }? This action will archive this salary configuration.`
            : ''
        }
        confirmText="Delete Record"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setSalaryToDelete(null)}
      />

      {deleteError && (
        <div className="fixed bottom-6 right-6 max-w-sm z-50">
          <ErrorMessage message={deleteError} />
        </div>
      )}
    </div>
  );
};

export default SalaryList;
