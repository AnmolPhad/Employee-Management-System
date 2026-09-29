import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';

const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, hasRole } = useAuth();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const isAllowed = allowedRoles.length === 0 || allowedRoles.some((role) => hasRole(role));

  if (!isAllowed) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
