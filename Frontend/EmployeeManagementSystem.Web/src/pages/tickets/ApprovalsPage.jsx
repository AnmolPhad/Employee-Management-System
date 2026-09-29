import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { FiCheckSquare } from 'react-icons/fi';

const ApprovalsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pending Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Review, approve, or reject leave tickets assigned to you</p>
        </div>
        <Badge status="active" text="API Ready" />
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiCheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Approval Workflow Inbox Active</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Connected to <code>/api/tickets/my-approvals</code>, <code>/api/tickets/{'{id}'}/approve</code>, and <code>/api/tickets/{'{id}'}/reject</code>.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ApprovalsPage;
