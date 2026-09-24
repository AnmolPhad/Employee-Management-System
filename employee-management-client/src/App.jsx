import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import Login from './pages/auth/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employees" element={<PlaceholderPage title="Employees" />} />
        <Route path="/employees/create" element={<PlaceholderPage title="Add Employee" />} />
        <Route path="/employees/:id" element={<PlaceholderPage title="Employee Details" />} />
        <Route path="/employees/:id/edit" element={<PlaceholderPage title="Edit Employee" />} />
        <Route path="/departments" element={<PlaceholderPage title="Departments" />} />
        <Route path="/roles" element={<PlaceholderPage title="Roles" />} />
        <Route path="/projects" element={<PlaceholderPage title="Projects" />} />
        <Route path="/projects/create" element={<PlaceholderPage title="Create Project" />} />
        <Route path="/projects/:id" element={<PlaceholderPage title="Project Details" />} />
        <Route path="/projects/:id/edit" element={<PlaceholderPage title="Edit Project" />} />
        <Route path="/attendance" element={<PlaceholderPage title="Attendance" />} />
        <Route path="/attendance/mark" element={<PlaceholderPage title="Mark Attendance" />} />
        <Route path="/leaves" element={<PlaceholderPage title="Leaves" />} />
        <Route path="/leaves/apply" element={<PlaceholderPage title="Apply Leave" />} />
        <Route path="/leaves/:id" element={<PlaceholderPage title="Leave Details" />} />
        <Route path="/salary" element={<PlaceholderPage title="Salary" />} />
        <Route path="/salary/:employeeId" element={<PlaceholderPage title="Salary Details" />} />
        <Route path="/performance" element={<PlaceholderPage title="Performance" />} />
        <Route path="/performance/create" element={<PlaceholderPage title="Create Review" />} />
        <Route path="/performance/:id" element={<PlaceholderPage title="Performance Details" />} />
        <Route path="/tickets" element={<PlaceholderPage title="Tickets" />} />
        <Route path="/tickets/create" element={<PlaceholderPage title="Create Ticket" />} />
        <Route path="/tickets/:id" element={<PlaceholderPage title="Ticket Details" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
