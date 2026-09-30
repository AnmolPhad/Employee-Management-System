import React from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2, FiCalendar } from 'react-icons/fi';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/formatters';

const HolidayTable = ({
  holidays = [],
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <th className="py-3.5 px-4">Holiday Date</th>
            <th className="py-3.5 px-4">Holiday Name</th>
            <th className="py-3.5 px-4">Description</th>
            <th className="py-3.5 px-4 text-center">Status</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {holidays.map((holiday) => {
            return (
              <tr
                key={holiday.holidayId}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Holiday Date */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <FiCalendar className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>{formatDate(holiday.holidayDate)}</span>
                  </div>
                </td>

                {/* Holiday Name */}
                <td className="py-3.5 px-4">
                  <Link
                    to={`/holidays/${holiday.holidayId}`}
                    className="font-semibold text-slate-800 hover:text-blue-600 transition-colors block"
                  >
                    {holiday.holidayName}
                  </Link>
                </td>

                {/* Description */}
                <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate" title={holiday.description || ''}>
                  {holiday.description || <span className="italic text-slate-400">No description</span>}
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <Badge
                    status={holiday.isActive ? 'active' : 'inactive'}
                    text={holiday.isActive ? 'Active' : 'Inactive'}
                  />
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <Link
                      to={`/holidays/${holiday.holidayId}`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>

                    <Link
                      to={`/holidays/${holiday.holidayId}/edit`}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit Holiday"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </Link>

                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(holiday)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Holiday"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HolidayTable;
