import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { FiTag } from 'react-icons/fi';

const TicketsPage = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isAdmin ? 'All Leave Approval Tickets' : 'My Leave Tickets'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Global oversight of all organizational leave approval tickets and status lifecycle'
              : 'Track the status and routing of your submitted leave applications'}
          </p>
        </div>
        <Badge status="active" text="API Ready" />
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiTag className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            {isAdmin ? 'Global Ticket Oversight Active' : 'Personal Ticket Tracker Active'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Connected to <code>{isAdmin ? '/api/admin/tickets' : '/api/tickets/me'}</code>.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TicketsPage;
