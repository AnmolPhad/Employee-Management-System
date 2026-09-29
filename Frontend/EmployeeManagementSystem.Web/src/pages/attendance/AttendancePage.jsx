import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { FiClock } from 'react-icons/fi';

const AttendancePage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Daily clock-in, clock-out, and attendance history logs</p>
        </div>
        <Badge status="active" text="API Ready" />
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiClock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Attendance Tracker Active</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Connected to <code>/api/attendance/check-in</code>, <code>/api/attendance/check-out</code>, and <code>/api/attendance/me</code>.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AttendancePage;
