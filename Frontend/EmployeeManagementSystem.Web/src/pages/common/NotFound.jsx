import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiHome } from 'react-icons/fi';
import { ROUTES } from '../../utils/constants';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-600 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to={ROUTES.DASHBOARD}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          <FiHome className="w-4 h-4" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
