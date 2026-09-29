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
  HOLIDAYS: '/holidays',
  SALARY: '/salary',
  TICKETS: '/tickets',
  MY_APPROVALS: '/my-approvals',
  UNAUTHORIZED: '/unauthorized',
};
