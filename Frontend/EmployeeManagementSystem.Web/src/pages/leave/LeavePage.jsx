import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { FiCalendar } from 'react-icons/fi';

const LeavePage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
          <p className="text-sm text-slate-500 mt-1">Apply for leaves, track leave balance, and view personal leave history</p>
        </div>
        <Badge status="active" text="API Ready" />
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiCalendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Leave Workspace Active</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Connected to <code>/api/leaves</code>, <code>/api/leaves/me</code>, and <code>/api/leaves/me/balance</code>.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LeavePage;
