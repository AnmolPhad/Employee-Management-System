import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import employeeApi from '../../api/employeeApi';
import departmentApi from '../../api/departmentApi';
import ticketApi from '../../api/ticketApi';
import leaveApi from '../../api/leaveApi';
import holidayApi from '../../api/holidayApi';
import {
  FiUsers,
  FiBriefcase,
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiSun,
  FiArrowRight,
  FiTag,
} from 'react-icons/fi';

const Dashboard = () => {
  const { user, isAdmin, isHR, isManager } = useAuth();

  const [stats, setStats] = useState({
    employeesCount: null,
    departmentsCount: null,
    pendingTicketsCount: null,
    holidaysCount: null,
    myPendingTicketsCount: null,
    myLeaveBalanceCount: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isPrivileged = isAdmin || isHR;

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextStats = {};

        // 1. Privileged queries (Admin/HR)
        if (isPrivileged) {
          try {
            const [empRes, deptRes, holidayRes] = await Promise.allSettled([
              employeeApi.getEmployees({ pageSize: 1 }),
              departmentApi.getDepartments({ pageSize: 1 }),
              holidayApi.getHolidays({ pageSize: 1 }),
            ]);

            if (empRes.status === 'fulfilled' && empRes.value?.data?.totalCount !== undefined) {
              nextStats.employeesCount = empRes.value.data.totalCount;
            }
            if (deptRes.status === 'fulfilled' && deptRes.value?.data?.totalCount !== undefined) {
              nextStats.departmentsCount = deptRes.value.data.totalCount;
            }
            if (holidayRes.status === 'fulfilled' && holidayRes.value?.data?.totalCount !== undefined) {
              nextStats.holidaysCount = holidayRes.value.data.totalCount;
            }
          } catch {
            // Non-critical fallback
          }
        }

        // 2. Approver queries (Admin/HR/Manager)
        if (isPrivileged || isManager) {
          try {
            const approvalsRes = await ticketApi.getMyApprovals({ status: 'Pending', pageSize: 1 });
            if (approvalsRes?.data?.totalCount !== undefined) {
              nextStats.pendingTicketsCount = approvalsRes.data.totalCount;
            }
          } catch {
            // Non-critical fallback
          }
        }

        // 3. Employee personal workspace queries
        try {
          const [myTicketsRes, myLeaveRes] = await Promise.allSettled([
            ticketApi.getMyTickets({ status: 'Pending', pageSize: 1 }),
            leaveApi.getMyLeaveBalance(),
          ]);

          if (myTicketsRes.status === 'fulfilled' && myTicketsRes.value?.data?.totalCount !== undefined) {
            nextStats.myPendingTicketsCount = myTicketsRes.value.data.totalCount;
          }
          if (myLeaveRes.status === 'fulfilled' && Array.isArray(myLeaveRes.value?.data)) {
            // Total remaining days across active leave types
            const totalRemaining = myLeaveRes.value.data.reduce((acc, item) => acc + (item.remainingDays || 0), 0);
            nextStats.myLeaveBalanceCount = totalRemaining;
          }
        } catch {
          // Non-critical fallback
        }

        if (isMounted) {
          setStats(nextStats);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load dashboard overview.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [isPrivileged, isManager]);

  const primaryRole = user?.roles?.[0] || user?.role || 'Employee';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/20 uppercase tracking-wider">
              {primaryRole}
            </span>
            <span className="text-xs text-blue-100">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.employeeName || user?.userName || user?.email}!
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Here is your organizational dashboard summary and quick workspace actions.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Link
            to={ROUTES.LEAVE}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            <FiCalendar className="w-4 h-4" />
            Apply Leave
          </Link>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <div className="py-12 bg-white rounded-2xl border border-slate-200">
          <LoadingSpinner message="Loading your dashboard summary..." />
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {isPrivileged && stats.employeesCount !== null && (
              <Card className="hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Employees</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.employeesCount}</h3>
                    <Link to={ROUTES.EMPLOYEES} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mt-2">
                      Manage employees <FiArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FiUsers className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            )}

            {isPrivileged && stats.departmentsCount !== null && (
              <Card className="hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Departments</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.departmentsCount}</h3>
                    <Link to={ROUTES.DEPARTMENTS} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mt-2">
                      View departments <FiArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <FiBriefcase className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            )}

            {(isPrivileged || isManager) && stats.pendingTicketsCount !== null && (
              <Card className="hover:border-amber-300 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
                    <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingTicketsCount}</h3>
                    <Link to={ROUTES.MY_APPROVALS} className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 mt-2">
                      Review requests <FiArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <FiCheckSquare className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            )}

            {stats.myPendingTicketsCount !== null && (
              <Card className="hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Open Tickets</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.myPendingTicketsCount}</h3>
                    <Link to={ROUTES.TICKETS} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mt-2">
                      View my tickets <FiArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <FiTag className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            )}

            {stats.myLeaveBalanceCount !== null && (
              <Card className="hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leave Days Left</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.myLeaveBalanceCount}</h3>
                    <Link to={ROUTES.LEAVE} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mt-2">
                      Leave balance details <FiArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FiCalendar className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            )}

            {isPrivileged && stats.holidaysCount !== null && (
              <Card className="hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Org Holidays</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.holidaysCount}</h3>
                    <Link to={ROUTES.HOLIDAYS} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mt-2">
                      Holiday calendar <FiArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <FiSun className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card title="Quick Actions" subtitle="Frequently used operations">
              <div className="space-y-2.5">
                <Link
                  to={ROUTES.LEAVE}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FiCalendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Apply for Leave</span>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
                <Link
                  to={ROUTES.ATTENDANCE}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FiClock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Daily Attendance</span>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
                <Link
                  to={ROUTES.TICKETS}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FiTag className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">Track Leave Tickets</span>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </Card>

            <Card title="System Information" subtitle="Platform environment status" className="md:col-span-2">
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">API Connection</span>
                  <Badge status="online" text="ASP.NET Core Web API Online" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">User Identity</span>
                  <span className="font-semibold text-slate-800">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Active Roles</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(user?.roles || [user?.role || 'Employee']).map((r, i) => (
                      <Badge key={i} status={r} text={r} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Employee ID</span>
                  <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                    {user?.employeeId ? `EMP #${user.employeeId}` : 'N/A'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
