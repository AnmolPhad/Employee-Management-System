import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import {
  FiHome,
  FiUser,
  FiUsers,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiSun,
  FiDollarSign,
  FiTag,
  FiCheckSquare,
  FiLayers,
  FiX,
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const { isAdmin, isHR, isManager } = useAuth();

  const isPrivileged = isAdmin || isHR;
  const isApprover = isAdmin || isHR || isManager;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-blue-600 text-white shadow-xs font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const navGroups = [
    {
      title: 'General',
      items: [{ label: 'Dashboard', path: ROUTES.DASHBOARD, icon: FiHome }],
    },
    {
      title: 'My Workspace',
      items: [
        { label: 'My Profile', path: ROUTES.MY_PROFILE, icon: FiUser },
        { label: 'Leave', path: ROUTES.LEAVE, icon: FiCalendar },
        { label: 'Attendance', path: ROUTES.ATTENDANCE, icon: FiClock },
        { label: 'Salary (CTC)', path: ROUTES.SALARY, icon: FiDollarSign },
        { label: 'My Tickets', path: ROUTES.TICKETS, icon: FiTag },
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
                path: ROUTES.MY_APPROVALS,
                icon: FiTag,
              },
            ],
          },
        ]
      : []),
    ...(isPrivileged
      ? [
          {
            title: 'Administration',
            items: [
              { label: 'Employees', path: ROUTES.EMPLOYEES, icon: FiUsers },
              { label: 'Departments', path: ROUTES.DEPARTMENTS, icon: FiBriefcase },
              { label: 'Leave Types', path: ROUTES.LEAVE_TYPES, icon: FiLayers },
              { label: 'Holidays', path: ROUTES.HOLIDAYS, icon: FiSun },
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
                return (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={linkClass}
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
