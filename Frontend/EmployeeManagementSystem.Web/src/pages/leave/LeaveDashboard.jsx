import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiPlus,
  FiClock,
  FiCheckSquare,
  FiList,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import leaveApi from '../../api/leaveApi';
import { ROUTES } from '../../utils/constants';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import LeaveBalanceCard from '../../components/leave/LeaveBalanceCard';
import LeaveTable from '../../components/leave/LeaveTable';

const LeaveDashboard = () => {
  const { isAdmin, isHR, isManager } = useAuth();
  const isApprover = isAdmin || isHR || isManager;

  const [balances, setBalances] = useState([]);
  const [activeTypes, setActiveTypes] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Fetch leave balances & active leave types in parallel
      const [balancesRes, typesRes, recentRes] = await Promise.all([
        leaveApi.getMyLeaveBalance(),
        leaveApi.getActiveLeaveTypes(),
        leaveApi.getMyLeaves({ page: 1, pageSize: 5 }),
      ]);

      const balanceList = balancesRes?.data || [];
      const typesList = typesRes?.data || [];
      const leavesData = recentRes?.data?.items || recentRes?.data || [];

      setBalances(Array.isArray(balanceList) ? balanceList : []);
      setActiveTypes(Array.isArray(typesList) ? typesList : []);
      setRecentLeaves(Array.isArray(leavesData) ? leavesData : []);

      // 2. If user is an approver, also fetch pending approvals count
      if (isApprover) {
        try {
          const approvalsRes = await leaveApi.getPendingApprovals();
          const approvalsList = approvalsRes?.data || [];
          setPendingApprovalsCount(Array.isArray(approvalsList) ? approvalsList.length : 0);
        } catch (approvalsErr) {
          console.error('Failed to fetch pending approvals count:', approvalsErr);
        }
      }
    } catch (err) {
      console.error('Failed to load leave dashboard data:', err);
      setError(err?.message || 'Failed to load leave dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Map leaveTypeId to paid/unpaid status from active types
  const typePaidMap = activeTypes.reduce((acc, t) => {
    acc[t.leaveTypeId] = t.isPaid;
    return acc;
  }, {});

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading leave dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Leave Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your leave quotas, submit time-off requests, and monitor approval workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            as={Link}
            to={ROUTES.LEAVE_HISTORY}
            variant="outline"
            icon={FiList}
          >
            History
          </Button>

          {isApprover && (
            <Button
              as={Link}
              to={ROUTES.LEAVE_APPROVALS}
              variant="outline"
              icon={FiCheckSquare}
              className="relative"
            >
              Approvals
              {pendingApprovalsCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                  {pendingApprovalsCount}
                </span>
              )}
            </Button>
          )}

          <Button
            as={Link}
            to={ROUTES.LEAVE_APPLY}
            variant="primary"
            icon={FiPlus}
          >
            Apply for Leave
          </Button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            className="text-xs font-semibold text-rose-800 underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Section 1: Leave Balances Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Current Leave Balances
            </h2>
            {balances.length > 0 && balances[0]?.financialYear && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Financial Year: {balances[0].financialYear}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {balances.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <FiCalendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">No leave entitlement quotas found.</p>
              <p className="text-xs text-slate-400 mt-1">
                Contact your HR Administrator if your leave quotas have not been configured yet.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {balances.map((balance) => (
              <LeaveBalanceCard
                key={balance.leaveTypeId}
                balance={balance}
                isPaid={typePaidMap[balance.leaveTypeId] ?? null}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Recent Leave Applications */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Recent Applications
          </h2>
          {recentLeaves.length > 0 && (
            <Link
              to={ROUTES.LEAVE_HISTORY}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View Full History &rarr;
            </Link>
          )}
        </div>

        {recentLeaves.length === 0 ? (
          <Card>
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiClock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">
                No Leave Applications Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                You haven't submitted any leave applications recently. When you submit time off requests, they will appear here.
              </p>
              <Button
                as={Link}
                to={ROUTES.LEAVE_APPLY}
                variant="primary"
                size="sm"
                icon={FiPlus}
              >
                Apply for Leave Now
              </Button>
            </div>
          </Card>
        ) : (
          <LeaveTable leaves={recentLeaves} isApproverView={false} />
        )}
      </div>
    </div>
  );
};

export default LeaveDashboard;
