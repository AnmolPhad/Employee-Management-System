import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute({ isAllowed = true, redirectTo = '/login', children }) {
  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return children || <Outlet />;
}

export default ProtectedRoute;
