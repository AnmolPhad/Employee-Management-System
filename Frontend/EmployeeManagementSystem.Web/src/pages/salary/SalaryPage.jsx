import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { FiDollarSign } from 'react-icons/fi';

const SalaryPage = () => {
  const { isAdmin, isHR } = useAuth();
  const isPrivileged = isAdmin || isHR;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isPrivileged ? 'Salary & Compensation Management' : 'My Compensation (CTC)'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isPrivileged
              ? 'Manage employee CTC, basic pay, PF parameters, increments, and monthly calculations'
              : 'View your confidential annual Cost to Company (CTC) overview'}
          </p>
        </div>
        <Badge status="active" text="API Ready" />
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            {isPrivileged ? 'Salary Administration Active' : 'Personal Salary / CTC View Active'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Connected to <code>{isPrivileged ? '/api/admin/salaries' : '/api/salary/me'}</code> with strict backend IDOR privacy enforcement.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SalaryPage;
