import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { FaBars, FaBell, FaSearch, FaUserCircle } from 'react-icons/fa';

const titles = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/departments': 'Departments',
  '/roles': 'Roles',
  '/projects': 'Projects',
  '/attendance': 'Attendance',
  '/leaves': 'Leaves',
  '/salary': 'Salary',
  '/performance': 'Performance',
  '/tickets': 'Tickets',
};

function Navbar() {
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const exactTitle = titles[location.pathname];
    if (exactTitle) return exactTitle;

    const segment = location.pathname.split('/').filter(Boolean)[0];
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : 'Dashboard';
  }, [location.pathname]);

  return (
    <header className="top-navbar d-flex align-items-center px-3 px-lg-4 sticky-top">
      <button
        className="btn btn-outline-secondary d-lg-none me-3"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#mobileSidebar"
        aria-controls="mobileSidebar"
        aria-label="Open navigation"
      >
        <FaBars />
      </button>

      <div className="me-auto">
        <h1 className="h4 mb-0 fw-bold">{pageTitle}</h1>
        <small className="text-muted">EMS / {pageTitle}</small>
      </div>

      <div className="d-none d-md-flex align-items-center position-relative me-3" style={{ maxWidth: 280 }}>
        <FaSearch className="position-absolute ms-3 text-muted" />
        <input className="form-control ps-5" type="search" placeholder="Search..." aria-label="Search" />
      </div>

      <button className="btn btn-light position-relative me-2" type="button" aria-label="Notifications">
        <FaBell />
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">3</span>
      </button>

      <div className="dropdown">
        <button className="btn btn-light d-flex align-items-center gap-2" data-bs-toggle="dropdown" type="button">
          <FaUserCircle className="fs-5" />
          <span className="d-none d-sm-inline">Admin User</span>
        </button>
        <ul className="dropdown-menu dropdown-menu-end shadow-sm">
          <li><span className="dropdown-item-text text-muted small">Phase 1 shell</span></li>
          <li><hr className="dropdown-divider" /></li>
          <li><a className="dropdown-item" href="/login">Logout</a></li>
        </ul>
      </div>
    </header>
  );
}

export default Navbar;
