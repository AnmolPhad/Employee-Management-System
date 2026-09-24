import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <main className="auth-shell d-flex align-items-center justify-content-center p-3">
      <Outlet />
    </main>
  );
}

export default AuthLayout;
