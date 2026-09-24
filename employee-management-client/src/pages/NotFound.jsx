import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="card border-0 shadow-sm" style={{ maxWidth: 520 }}>
        <div className="card-body text-center p-5">
          <div className="display-4 fw-bold text-primary mb-2">404</div>
          <h1 className="h3 fw-bold">Page not found</h1>
          <p className="text-muted">The page you are looking for does not exist or has been moved.</p>
          <Link className="btn btn-primary" to="/dashboard">Go to Dashboard</Link>
        </div>
      </div>
    </main>
  );
}

export default NotFound;
