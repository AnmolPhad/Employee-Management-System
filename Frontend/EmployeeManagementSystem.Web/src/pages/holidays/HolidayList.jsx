import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSun,
  FiPlus,
  FiFilter,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiSearch,
} from 'react-icons/fi';
import holidayApi from '../../api/holidayApi';
import { ROUTES } from '../../utils/constants';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import HolidayTable from '../../components/holidays/HolidayTable';
import { formatDate } from '../../utils/formatters';

const HolidayList = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [isActive, setIsActive] = useState('');

  // Delete modal state
  const [holidayToDelete, setHolidayToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchHolidays = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        pageSize,
      };

      if (search.trim()) {
        params.search = search.trim();
      }
      if (year) {
        params.year = Number(year);
      }
      if (isActive !== '') {
        params.isActive = isActive === 'true';
      }

      const res = await holidayApi.getHolidays(params);
      const data = res?.data || {};
      const items = data?.items || (Array.isArray(data) ? data : []);

      setHolidays(items);
      setTotalPages(data?.totalPages || 1);
      setTotalCount(data?.totalCount || items.length);
    } catch (err) {
      console.error('Failed to load holidays:', err);
      setError(err?.message || 'Failed to retrieve organizational holidays.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [page, year, isActive]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHolidays();
  };

  const handleResetFilters = () => {
    setSearch('');
    setYear('');
    setIsActive('');
    setPage(1);
  };

  const handleDeleteClick = (holiday) => {
    setHolidayToDelete(holiday);
  };

  const handleConfirmDelete = async () => {
    if (!holidayToDelete) return;

    setDeleteLoading(true);
    setError('');

    try {
      await holidayApi.deleteHoliday(holidayToDelete.holidayId);
      setSuccessMessage(
        `Holiday "${holidayToDelete.holidayName}" (${formatDate(holidayToDelete.holidayDate)}) was deleted successfully.`
      );
      setHolidayToDelete(null);
      await fetchHolidays();
    } catch (err) {
      console.error('Failed to delete holiday:', err);
      setError(
        err?.message ||
        'Unable to delete holiday. It may be referenced by existing attendance audit records.'
      );
      setHolidayToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { label: 'All Years', value: '' },
    { label: `${currentYear - 1}`, value: `${currentYear - 1}` },
    { label: `${currentYear}`, value: `${currentYear}` },
    { label: `${currentYear + 1}`, value: `${currentYear + 1}` },
    { label: `${currentYear + 2}`, value: `${currentYear + 2}` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Organizational Holidays
            </h1>
            {totalCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                {totalCount} {totalCount === 1 ? 'holiday' : 'holidays'}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure official company holidays and observed non-working dates. Active holidays automatically apply to employee attendance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            as={Link}
            to={ROUTES.HOLIDAYS_CREATE}
            variant="primary"
            icon={FiPlus}
          >
            Create Holiday
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
          <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search holidays..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Year Filter */}
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Active/Inactive Filter */}
          <select
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>

          {(search || year || isActive !== '') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>

        <button
          type="button"
          onClick={fetchHolidays}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer disabled:opacity-50"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table & Pagination */}
      {loading ? (
        <LoadingSpinner size="lg" message="Loading holidays..." />
      ) : holidays.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiSun className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              No Holidays Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {search || year || isActive !== ''
                ? 'No holidays match your current filter parameters.'
                : 'No organizational holidays have been configured yet.'}
            </p>
            {search || year || isActive !== '' ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button
                as={Link}
                to={ROUTES.HOLIDAYS_CREATE}
                variant="primary"
                size="sm"
                icon={FiPlus}
              >
                Create Holiday
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <HolidayTable holidays={holidays} onDelete={handleDeleteClick} />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={Boolean(holidayToDelete)}
        title="Delete Holiday Configuration"
        message={
          holidayToDelete
            ? `Are you sure you want to delete "${holidayToDelete.holidayName}" (${formatDate(
                holidayToDelete.holidayDate
              )})? Deleting this holiday will remove its automatic 'Holiday' attendance classification for this date.`
            : ''
        }
        confirmText="Delete Holiday"
        confirmVariant="danger"
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setHolidayToDelete(null)}
      />
    </div>
  );
};

export default HolidayList;
