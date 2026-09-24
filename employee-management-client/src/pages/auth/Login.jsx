import { Link } from 'react-router-dom';

function Login() {
  return (
    <div className="card shadow-lg border-0" style={{ maxWidth: 440, width: '100%' }}>
      <div className="card-body p-4 p-md-5">
        <div className="text-center mb-4">
          <h1 className="h3 fw-bold">EMS Login</h1>
          <p className="text-muted mb-0">Authentication will be implemented in Phase 2.</p>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email</label>
          <input className="form-control" id="email" type="email" placeholder="admin@example.com" disabled />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="password">Password</label>
          <input className="form-control" id="password" type="password" placeholder="••••••••" disabled />
        </div>
        <button className="btn btn-primary w-100" type="button" disabled>Login</button>
        <div className="text-center mt-3">
          <Link to="/dashboard">Back to dashboard shell</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
