import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import {
  FiHome,
  FiUser,
  FiUsers,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiList,
  FiSun,
  FiDollarSign,
  FiTag,
  FiCheckSquare,
  FiLayers,
  FiSettings,
  FiX,
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin, isHR, isManager } = useAuth();

  const isPrivileged = isAdmin || isHR;
  const isApprover = isAdmin || isHR || isManager;
  const currentPath = location.pathname.toLowerCase();

  const isItemActive = (itemPath) => {
    const path = itemPath.toLowerCase();

    // 1. Dashboard
    if (path === ROUTES.DASHBOARD.toLowerCase()) {
      return currentPath === '/dashboard' || currentPath === '/';
    }

    // 2. Approvals (must be strictly separated from My Workspace)
    if (path === ROUTES.LEAVE_APPROVALS.toLowerCase()) {
      return currentPath.startsWith('/leave/approvals');
    }
    if (path === ROUTES.TICKETS_APPROVALS.toLowerCase()) {
      return currentPath.startsWith('/tickets/approvals') || currentPath === '/my-approvals';
    }

    // 3. My Workspace Items
    if (path === ROUTES.LEAVE.toLowerCase()) {
      return (
        currentPath.startsWith('/leave') &&
        !currentPath.startsWith('/leave/approvals') &&
        !currentPath.startsWith('/leave-types')
      );
    }
    if (path === ROUTES.ATTENDANCE.toLowerCase()) {
      return (
        currentPath === '/attendance' ||
        currentPath === '/attendance/my' ||
        (currentPath.startsWith('/attendance/') && !currentPath.startsWith('/admin/attendance'))
      );
    }
    if (path === ROUTES.SALARY.toLowerCase()) {
      return (
        currentPath === '/salary' ||
        (currentPath.startsWith('/salary/') && !currentPath.startsWith('/admin/salary'))
      );
    }
    if (path === ROUTES.TICKETS_MY.toLowerCase()) {
      return (
        currentPath === '/tickets/my' ||
        currentPath === '/tickets' ||
        (currentPath.startsWith('/tickets/') && !currentPath.startsWith('/tickets/approvals'))
      );
    }

    // 4. Management & Admin
    if (path === ROUTES.ADMIN_ATTENDANCE.toLowerCase()) {
      return currentPath.startsWith('/admin/attendance');
    }
    if (path === ROUTES.ADMIN_SALARY_SETTINGS.toLowerCase()) {
      return currentPath.startsWith('/admin/salary/settings');
    }
    if (path === ROUTES.ADMIN_SALARY.toLowerCase()) {
      return currentPath.startsWith('/admin/salary') && !currentPath.startsWith('/admin/salary/settings');
    }
    if (path === ROUTES.ADMIN_TICKETS.toLowerCase()) {
      return currentPath.startsWith('/admin/tickets');
    }
    if (path === ROUTES.EMPLOYEES.toLowerCase()) {
      return currentPath.startsWith('/employees');
    }
    if (path === ROUTES.DEPARTMENTS.toLowerCase()) {
      return currentPath.startsWith('/departments');
    }
    if (path === ROUTES.LEAVE_TYPES.toLowerCase()) {
      return currentPath.startsWith('/leave-types');
    }
    if (path === ROUTES.HOLIDAYS.toLowerCase()) {
      return currentPath.startsWith('/holidays');
    }

    return currentPath === path;
  };

  const navGroups = [
    {
      title: 'My Workspace',
      items: [
        { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: FiHome },
        { label: 'My Leave', path: ROUTES.LEAVE, icon: FiCalendar },
        { label: 'My Attendance', path: ROUTES.ATTENDANCE, icon: FiClock },
        { label: 'My Salary', path: ROUTES.SALARY, icon: FiDollarSign },
        { label: 'My Tickets', path: ROUTES.TICKETS_MY, icon: FiTag },
      ],
    },
    ...(isApprover
      ? [
          {
            title: 'Approvals',
            items: [
              {
                label: 'Leave Approvals',
                path: ROUTES.LEAVE_APPROVALS,
                icon: FiCheckSquare,
              },
              {
                label: 'Ticket Approvals',
                path: ROUTES.TICKETS_APPROVALS,
                icon: FiCheckSquare,
              },
            ],
          },
        ]
      : []),
    ...(isPrivileged || isManager
      ? [
          {
            title: 'Management',
            items: [
              ...(isPrivileged
                ? [
                    { label: 'Employees', path: ROUTES.EMPLOYEES, icon: FiUsers },
                    { label: 'Departments', path: ROUTES.DEPARTMENTS, icon: FiBriefcase },
                    { label: 'Leave Types', path: ROUTES.LEAVE_TYPES, icon: FiLayers },
                  ]
                : []),
              { label: 'Staff Attendance', path: ROUTES.ADMIN_ATTENDANCE, icon: FiClock },
              ...(isPrivileged
                ? [
                    { label: 'Holidays', path: ROUTES.HOLIDAYS, icon: FiSun },
                    { label: 'Salary Management', path: ROUTES.ADMIN_SALARY, icon: FiDollarSign },
                  ]
                : []),
            ],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: 'Administration',
            items: [
              { label: 'All Leave Tickets', path: ROUTES.ADMIN_TICKETS, icon: FiTag },
              { label: 'Salary Settings', path: ROUTES.ADMIN_SALARY_SETTINGS, icon: FiSettings },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0 shadow-xl lg:shadow-none' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              EMS
            </div>
            <span className="font-bold text-slate-800 text-base">EMS Workspace</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {group.title}
              </div>
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const active = isItemActive(item.path);
                return (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
          EMS v1.0.0 &bull; Secure Portal
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
