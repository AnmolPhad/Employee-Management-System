import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiLogOut, FiUser } from 'react-icons/fi';
import Badge from '../common/Badge';
import { ROUTES } from '../../utils/constants';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const primaryRole = user?.roles?.[0] || user?.role || 'Employee';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200">
      {/* Left side: Hamburger button (mobile) + App Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <FiMenu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            Employee Management System
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
            Portal
          </span>
        </div>
      </div>

      {/* Right side: User Profile info + Role + Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user && (
          <Link
            to={user?.employeeId ? `/employees/${user.employeeId}` : ROUTES.DASHBOARD}
            className="flex items-center gap-3 group p-1.5 -m-1.5 rounded-xl hover:bg-slate-50 transition-colors"
            title="View My Profile"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm border border-blue-200 shrink-0 group-hover:border-blue-400 transition-colors">
              <FiUser className="w-4 h-4" />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-none">
                {user.employeeName || user.userName || user.email}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                {user.email}
              </span>
            </div>
            <Badge status={primaryRole} text={primaryRole} className="ml-1" />
          </Link>
        )}

        <div className="h-6 w-px bg-slate-200" />

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-slate-200 hover:border-rose-200"
          title="Sign out"
        >
          <FiLogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
