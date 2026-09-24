import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';

function AdminLayout() {
  return (
    <div className="admin-shell d-flex">
      <Sidebar />

      <div className="offcanvas offcanvas-start text-bg-dark" tabIndex="-1" id="mobileSidebar" aria-labelledby="mobileSidebarLabel">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="mobileSidebarLabel">EMS Admin</h5>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close" />
        </div>
        <div className="offcanvas-body p-0 sidebar">
          <Sidebar mobile />
        </div>
      </div>

      <div className="main-content d-flex flex-column">
        <Navbar />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
