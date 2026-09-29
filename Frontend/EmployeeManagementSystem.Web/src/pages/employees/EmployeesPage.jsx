import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { FiUsers } from 'react-icons/fi';

const EmployeesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage organizational workforce profiles, assignments, and roles</p>
        </div>
        <Badge status="active" text="API Ready" />
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiUsers className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Employee Directory Foundation Active</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The foundation and API layer for Employee CRUD are connected to <code>/api/admin/employees</code>. Full UI views, search, and edit modals will be rendered in the Employee Module phase.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default EmployeesPage;
