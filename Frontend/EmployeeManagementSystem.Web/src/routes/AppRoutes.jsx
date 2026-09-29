import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { ROUTES, ROLES } from '../utils/constants';

// Pages
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import EmployeeList from '../pages/employees/EmployeeList';
import EmployeeDetails from '../pages/employees/EmployeeDetails';
import CreateEmployee from '../pages/employees/CreateEmployee';
import EditEmployee from '../pages/employees/EditEmployee';
import MyProfile from '../pages/employees/MyProfile';
import DepartmentList from '../pages/departments/DepartmentList';
import DepartmentDetails from '../pages/departments/DepartmentDetails';
import CreateDepartment from '../pages/departments/CreateDepartment';
import EditDepartment from '../pages/departments/EditDepartment';
import LeaveTypeList from '../pages/leaveTypes/LeaveTypeList';
import LeaveTypeDetails from '../pages/leaveTypes/LeaveTypeDetails';
import CreateLeaveType from '../pages/leaveTypes/CreateLeaveType';
import EditLeaveType from '../pages/leaveTypes/EditLeaveType';
import LeaveDashboard from '../pages/leave/LeaveDashboard';
import LeaveApply from '../pages/leave/LeaveApply';
import LeaveHistory from '../pages/leave/LeaveHistory';
import LeaveDetails from '../pages/leave/LeaveDetails';
import LeaveApprovals from '../pages/leave/LeaveApprovals';
import AttendancePage from '../pages/attendance/AttendancePage';
import HolidaysPage from '../pages/holidays/HolidaysPage';
import SalaryPage from '../pages/salary/SalaryPage';
import TicketsPage from '../pages/tickets/TicketsPage';
import ApprovalsPage from '../pages/tickets/ApprovalsPage';
import Unauthorized from '../pages/common/Unauthorized';
import NotFound from '../pages/common/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Authentication routes */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<Login />} />
      </Route>

      {/* General error pages */}
      <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />

      {/* Protected application routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

        {/* Common workspace routes for all authenticated employees */}
        <Route path={ROUTES.MY_PROFILE} element={<MyProfile />} />
        <Route path={ROUTES.LEAVE} element={<LeaveDashboard />} />
        <Route path={ROUTES.LEAVE_APPLY} element={<LeaveApply />} />
        <Route path={ROUTES.LEAVE_HISTORY} element={<LeaveHistory />} />
        <Route path={ROUTES.LEAVE_DETAILS} element={<LeaveDetails />} />
        <Route path={ROUTES.ATTENDANCE} element={<AttendancePage />} />
        <Route path={ROUTES.SALARY} element={<SalaryPage />} />
        <Route path={ROUTES.TICKETS} element={<TicketsPage />} />

        {/* Approvals routes: Accessible by Admin, HR, and Manager */}
        <Route
          path={ROUTES.LEAVE_APPROVALS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]}>
              <LeaveApprovals />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.MY_APPROVALS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]}>
              <ApprovalsPage />
            </RoleRoute>
          }
        />

        {/* Administrative Employee Routes: Accessible by Admin and HR */}
        <Route
          path={ROUTES.EMPLOYEES}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <EmployeeList />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.EMPLOYEES_CREATE}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <CreateEmployee />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.EMPLOYEES_DETAILS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <EmployeeDetails />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.EMPLOYEES_EDIT}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <EditEmployee />
            </RoleRoute>
          }
        />

        {/* Administrative Department Routes: Accessible by Admin and HR */}
        <Route
          path={ROUTES.DEPARTMENTS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <DepartmentList />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.DEPARTMENTS_CREATE}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <CreateDepartment />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.DEPARTMENTS_DETAILS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <DepartmentDetails />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.DEPARTMENTS_EDIT}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <EditDepartment />
            </RoleRoute>
          }
        />

        {/* Administrative Leave Type Routes: Accessible by Admin and HR */}
        <Route
          path={ROUTES.LEAVE_TYPES}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <LeaveTypeList />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.LEAVE_TYPES_CREATE}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <CreateLeaveType />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.LEAVE_TYPES_DETAILS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <LeaveTypeDetails />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.LEAVE_TYPES_EDIT}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <EditLeaveType />
            </RoleRoute>
          }
        />

        {/* Other administrative module routes: Accessible by Admin and HR */}
        <Route
          path={ROUTES.HOLIDAYS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <HolidaysPage />
            </RoleRoute>
          }
        />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
