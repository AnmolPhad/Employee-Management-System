import { NavLink } from 'react-router-dom';
import {
  FaBuilding,
  FaCalendarCheck,
  FaChartLine,
  FaClipboardList,
  FaFolderOpen,
  FaMoneyCheckAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTicketAlt,
  FaUserShield,
  FaUsers,
  FaUserTie,
  FaCog,
} from 'react-icons/fa';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: FaTachometerAlt },
  { label: 'Employees', path: '/employees', icon: FaUsers },
  { label: 'Departments', path: '/departments', icon: FaBuilding },
  { label: 'Roles', path: '/roles', icon: FaUserShield },
  { label: 'Projects', path: '/projects', icon: FaFolderOpen },
  { label: 'Attendance', path: '/attendance', icon: FaCalendarCheck },
  { label: 'Leaves', path: '/leaves', icon: FaClipboardList },
  { label: 'Salary', path: '/salary', icon: FaMoneyCheckAlt },
  { label: 'Performance', path: '/performance', icon: FaChartLine },
  { label: 'Tickets', path: '/tickets', icon: FaTicketAlt },
];

function Sidebar({ mobile = false }) {
  return (
    <aside className={`${mobile ? '' : 'sidebar sidebar-desktop d-flex flex-column flex-shrink-0'}`}>
      <div className="sidebar-brand d-flex align-items-center px-4">
        <div className="bg-white text-primary rounded-3 p-2 me-2">
          <FaUserTie />
        </div>
        <div>
          <div className="fw-bold">EMS Admin</div>
          <small className="text-white-50">Management Portal</small>
        </div>
      </div>

      <nav className="nav flex-column gap-1 p-3 flex-grow-1">
        {menuItems.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} className="nav-link">
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-top border-white border-opacity-10">
        <NavLink to="/settings" className="nav-link mb-1">
          <FaCog />
          <span>Settings</span>
        </NavLink>
        <NavLink to="/login" className="nav-link">
          <FaSignOutAlt />
          <span>Logout</span>
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
