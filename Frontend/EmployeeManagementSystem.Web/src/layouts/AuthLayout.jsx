import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
      <footer className="mt-8 text-xs text-slate-400 text-center">
        &copy; {new Date().getFullYear()} Employee Management System. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthLayout;
