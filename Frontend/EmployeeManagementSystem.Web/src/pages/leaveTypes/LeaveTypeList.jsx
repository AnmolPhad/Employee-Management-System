import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiFilter, FiRotateCcw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import leaveTypeApi from '../../api/leaveTypeApi';
import LeaveTypeTable from '../../components/leaveTypes/LeaveTypeTable';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { ROUTES } from '../../utils/constants';

const LeaveTypeList = () => {
  const { isAdmin, isHR } = useAuth();
  const canManage = isAdmin || isHR;

  // Query parameters state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [selectedPaid, setSelectedPaid] = useState('all'); // 'all', 'paid', 'unpaid'

  // Data state
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch leave types with server-side search, filters, and pagination
  const fetchLeaveTypes = useCallback(async () => {
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

      if (selectedStatus === 'active') {
        params.isActive = true;
      } else if (selectedStatus === 'inactive') {
        params.isActive = false;
      }

      if (selectedPaid === 'paid') {
        params.isPaid = true;
      } else if (selectedPaid === 'unpaid') {
        params.isPaid = false;
      }

      const res = await leaveTypeApi.getLeaveTypes(params);

      if (res && res.data) {
        const pagedData = res.data;
        setLeaveTypes(pagedData.items || []);
        setTotalCount(pagedData.totalCount || 0);
        setTotalPages(pagedData.totalPages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to load leave types.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, selectedStatus, selectedPaid]);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setPage(1);
  };

  const handlePaidChange = (e) => {
    setSelectedPaid(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedPaid('all');
    setPage(1);
  };

  const isFiltered = Boolean(
    searchTerm.trim() || selectedStatus !== 'all' || selectedPaid !== 'all'
  );

  // Delete handlers
  const handleOpenDelete = (type) => {
    setTypeToDelete(type);
    setDeleteModalOpen(true);
    setFeedback(null);
  };

  const handleCloseDelete = () => {
    setDeleteModalOpen(false);
    setTypeToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return;
    setIsDeleting(true);
    setFeedback(null);

    try {
      await leaveTypeApi.deleteLeaveType(typeToDelete.leaveTypeId);
      setDeleteModalOpen(false);
      setTypeToDelete(null);
      setFeedback({
        type: 'success',
        message: `Leave type "${typeToDelete.leaveTypeName}" was deleted successfully.`,
      });
      fetchLeaveTypes();
    } catch (err) {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      const conflictMsg =
        err.status === 409
          ? 'This leave type cannot be deleted because it is currently used by existing leave records.'
          : err.message || 'Failed to delete leave type.';
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Leave Types</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure employee leave categories, annual day entitlements, and payroll deduction rules
          </p>
        </div>
        {canManage && (
          <Link to={ROUTES.LEAVE_TYPES_CREATE}>
            <Button variant="primary" icon={FiPlus}>
              Add Leave Type
            </Button>
          </Link>
        )}
      </div>

      {/* Feedback banner (Success or 409 Conflict Error) */}
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

      {/* Search & Filter Bar */}
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
          <div className="sm:col-span-2 lg:col-span-2">
            <SearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by leave type name or description..."
            />
          </div>

          {/* Active Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Remuneration (Paid / Unpaid) Filter */}
          <div>
            <select
              value={selectedPaid}
              onChange={handlePaidChange}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              <option value="all">All Remunerations</option>
              <option value="paid">Paid Leave Only</option>
              <option value="unpaid">Unpaid Leave Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12">
          <LoadingSpinner message="Fetching leave types catalog..." />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchLeaveTypes} />
      ) : leaveTypes.length === 0 ? (
        <EmptyState
          title="No Leave Types Found"
          message={
            isFiltered
              ? 'No leave types match your filter criteria. Try adjusting or clearing your filters.'
              : 'There are currently no leave types registered in the system catalog.'
          }
          action={
            isFiltered ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            ) : canManage ? (
              <Link to={ROUTES.LEAVE_TYPES_CREATE}>
                <Button variant="primary" size="sm" icon={FiPlus}>
                  Add First Leave Type
                </Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          <LeaveTypeTable
            leaveTypes={leaveTypes}
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
        title="Delete Leave Type"
        message={`Are you sure you want to permanently delete the leave type "${
          typeToDelete?.leaveTypeName || 'this leave type'
        }"? Leave categories referenced by existing leave records cannot be deleted.`}
        confirmText="Delete Leave Type"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDelete}
      />
    </div>
  );
};

export default LeaveTypeList;
