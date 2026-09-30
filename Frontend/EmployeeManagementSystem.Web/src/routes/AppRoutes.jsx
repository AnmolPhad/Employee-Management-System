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
import AttendanceDashboard from '../pages/attendance/AttendanceDashboard';
import MyAttendance from '../pages/attendance/MyAttendance';
import AttendanceDetails from '../pages/attendance/AttendanceDetails';
import AdminAttendance from '../pages/attendance/AdminAttendance';
import AdminAttendanceDetails from '../pages/attendance/AdminAttendanceDetails';
import HolidayList from '../pages/holidays/HolidayList';
import HolidayDetails from '../pages/holidays/HolidayDetails';
import CreateHoliday from '../pages/holidays/CreateHoliday';
import EditHoliday from '../pages/holidays/EditHoliday';
import SalaryDashboard from '../pages/salary/SalaryDashboard';
import SalaryList from '../pages/salary/SalaryList';
import SalaryDetails from '../pages/salary/SalaryDetails';
import CreateSalary from '../pages/salary/CreateSalary';
import EditSalary from '../pages/salary/EditSalary';
import SalaryIncrement from '../pages/salary/SalaryIncrement';
import SalaryCalculation from '../pages/salary/SalaryCalculation';
import SalarySettings from '../pages/salary/SalarySettings';
import TicketDashboard from '../pages/tickets/TicketDashboard';
import MyTickets from '../pages/tickets/MyTickets';
import TicketDetails from '../pages/tickets/TicketDetails';
import TicketApprovals from '../pages/tickets/TicketApprovals';
import AdminTickets from '../pages/tickets/AdminTickets';
import Unauthorized from '../pages/common/Unauthorized';
import NotFound from '../pages/common/NotFound';
import { useAuth } from '../context/AuthContext';

const MyProfileRedirect = () => {
  const { user } = useAuth();
  if (user?.employeeId) {
    return <Navigate to={`/employees/${user.employeeId}`} replace />;
  }
  return <Navigate to={ROUTES.DASHBOARD} replace />;
};

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
        <Route
          path={ROUTES.MY_PROFILE}
          element={
            <ProtectedRoute>
              <MyProfileRedirect />
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.EMPLOYEES_DETAILS} element={<EmployeeDetails />} />
        <Route path={ROUTES.LEAVE} element={<LeaveDashboard />} />
        <Route path={ROUTES.LEAVE_APPLY} element={<LeaveApply />} />
        <Route path={ROUTES.LEAVE_HISTORY} element={<LeaveHistory />} />
        <Route path={ROUTES.LEAVE_DETAILS} element={<LeaveDetails />} />
        <Route path={ROUTES.ATTENDANCE} element={<AttendanceDashboard />} />
        <Route path={ROUTES.ATTENDANCE_MY} element={<MyAttendance />} />
        <Route path={ROUTES.ATTENDANCE_DETAILS} element={<AttendanceDetails />} />
        <Route path={ROUTES.SALARY} element={<SalaryDashboard />} />
        <Route path={ROUTES.TICKETS} element={<Navigate to={ROUTES.TICKETS_MY} replace />} />
        <Route path={ROUTES.TICKETS_MY} element={<MyTickets />} />
        <Route path={ROUTES.TICKETS_DETAILS} element={<TicketDetails />} />

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
          path={ROUTES.TICKETS_APPROVALS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]}>
              <TicketApprovals />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.MY_APPROVALS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]}>
              <TicketApprovals />
            </RoleRoute>
          }
        />

        {/* Management Attendance Routes: Accessible by Admin, HR, and Manager */}
        <Route
          path={ROUTES.ADMIN_ATTENDANCE}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]}>
              <AdminAttendance />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_ATTENDANCE_DETAILS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]}>
              <AdminAttendanceDetails />
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

        {/* Administrative Holiday Routes: Accessible by Admin and HR */}
        <Route
          path={ROUTES.HOLIDAYS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <HolidayList />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.HOLIDAYS_CREATE}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <CreateHoliday />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.HOLIDAYS_DETAILS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <HolidayDetails />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.HOLIDAYS_EDIT}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <EditHoliday />
            </RoleRoute>
          }
        />

        {/* Administrative Salary Routes: Accessible strictly by Admin and HR */}
        <Route
          path={ROUTES.ADMIN_SALARY}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <SalaryList />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_SALARY_CREATE}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <CreateSalary />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_SALARY_DETAILS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <SalaryDetails />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_SALARY_EDIT}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <EditSalary />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_SALARY_INCREMENT}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <SalaryIncrement />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_SALARY_CALCULATE}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <SalaryCalculation />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_SALARY_SETTINGS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <SalarySettings />
            </RoleRoute>
          }
        />

        {/* Global Ticket Oversight: Admin Only */}
        <Route
          path={ROUTES.ADMIN_TICKETS}
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminTickets />
            </RoleRoute>
          }
        />
        {/* Administrative route aliases */}
        <Route path="/admin/holidays" element={<Navigate to={ROUTES.HOLIDAYS} replace />} />
        <Route path="/admin/employees" element={<Navigate to={ROUTES.EMPLOYEES} replace />} />
        <Route path="/admin/departments" element={<Navigate to={ROUTES.DEPARTMENTS} replace />} />
        <Route path="/admin/leave-types" element={<Navigate to={ROUTES.LEAVE_TYPES} replace />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
