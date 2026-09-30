export const ROLES = {
  ADMIN: 'Admin',
  HR: 'HR',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
};

export const SYSTEM_ROLES = [
  { id: 1, name: 'System Administrator' },
  { id: 2, name: 'Software Engineer' },
  { id: 3, name: 'HR Specialist' },
  { id: 4, name: 'Project Manager' },
  { id: 5, name: 'Financial Analyst' },
];

export const EMPLOYMENT_STATUSES = [
  'FullTime',
  'PartTime',
  'Contract',
  'Intern',
  'Resigned',
  'Terminated',
];

export const GENDERS = ['Male', 'Female', 'Other'];

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'ems_auth_token',
  AUTH_USER: 'ems_auth_user',
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  EMPLOYEES: '/employees',
  EMPLOYEES_CREATE: '/employees/create',
  EMPLOYEES_DETAILS: '/employees/:id',
  EMPLOYEES_EDIT: '/employees/:id/edit',
  MY_PROFILE: '/my-profile',
  DEPARTMENTS: '/departments',
  DEPARTMENTS_CREATE: '/departments/create',
  DEPARTMENTS_DETAILS: '/departments/:id',
  DEPARTMENTS_EDIT: '/departments/:id/edit',
  LEAVE: '/leave',
  LEAVE_APPLY: '/leave/apply',
  LEAVE_HISTORY: '/leave/history',
  LEAVE_DETAILS: '/leave/:id',
  LEAVE_APPROVALS: '/leave/approvals',
  LEAVE_TYPES: '/leave-types',
  LEAVE_TYPES_CREATE: '/leave-types/create',
  LEAVE_TYPES_DETAILS: '/leave-types/:id',
  LEAVE_TYPES_EDIT: '/leave-types/:id/edit',
  ATTENDANCE: '/attendance',
  ATTENDANCE_MY: '/attendance/my',
  ATTENDANCE_DETAILS: '/attendance/:id',
  ADMIN_ATTENDANCE: '/admin/attendance',
  ADMIN_ATTENDANCE_DETAILS: '/admin/attendance/:id',
  HOLIDAYS: '/holidays',
  HOLIDAYS_CREATE: '/holidays/create',
  HOLIDAYS_DETAILS: '/holidays/:id',
  HOLIDAYS_EDIT: '/holidays/:id/edit',
  SALARY: '/salary',
  ADMIN_SALARY: '/admin/salary',
  ADMIN_SALARY_CREATE: '/admin/salary/create',
  ADMIN_SALARY_DETAILS: '/admin/salary/:id',
  ADMIN_SALARY_EDIT: '/admin/salary/:id/edit',
  ADMIN_SALARY_INCREMENT: '/admin/salary/:id/increment',
  ADMIN_SALARY_CALCULATE: '/admin/salary/calculate',
  ADMIN_SALARY_SETTINGS: '/admin/salary/settings',
  TICKETS: '/tickets',
  TICKETS_MY: '/tickets/my',
  TICKETS_DETAILS: '/tickets/:id',
  TICKETS_APPROVALS: '/tickets/approvals',
  ADMIN_TICKETS: '/admin/tickets',
  MY_APPROVALS: '/my-approvals',
  UNAUTHORIZED: '/unauthorized',
};

export const TICKET_STATUSES = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const SALARY_STATUSES = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  REVISED: 'Revised',
};

export const ATTENDANCE_STATUSES = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'HalfDay',
  ON_LEAVE: 'OnLeave',
  HOLIDAY: 'Holiday',
  WEEK_OFF: 'WeekOff',
};

