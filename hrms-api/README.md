# HRMS REST API (.NET 9 Web API)

Enterprise-grade **Human Resource Management System (HRMS) REST API** built with **C# .NET 9** and **Entity Framework Core**.

---

## 🏗️ Architecture (Clean Architecture)

```
hrms-api/
├── src/
│   ├── HRMS.Domain/            # Entities, Enums, Constants (Roles, Permissions)
│   ├── HRMS.Application/       # DTOs, Interfaces, Exceptions, FluentValidation Validators
│   ├── HRMS.Infrastructure/    # EF Core DbContext, Repositories, Services, DataSeeder
│   └── HRMS.API/               # Controllers, Custom Auth Attributes & Handlers, Middlewares
└── tests/
    └── HRMS.Tests/             # Integration & Unit Tests (WebApplicationFactory)
```

---

## 🚀 Getting Started

### Prerequisites
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- SQL Server (Optional — In-Memory database enabled by default for zero-setup execution)

### Run the API
```bash
dotnet run
```

Once running:
- **Swagger UI**: [`http://localhost:5000`](http://localhost:5000) (or the port specified in console)
- **OpenAPI JSON**: `/swagger/v1/swagger.json`

### Run Automated Tests
```bash
dotnet test
```

---

## 🔑 Default Seeded Accounts

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **SuperAdmin** | `admin@hrms.com` | `Admin@123` | Full system access, all 40 permissions |
| **HRManager** | `hr@hrms.com` | `Hr@123` | HR operations, payroll, leave management |
| **Manager** | `manager@hrms.com` | `Manager@123` | Direct reports, approvals, reviews |
| **Employee** | `employee@hrms.com` | `Employee@123` | Self-service profile, attendance, leaves, payslips |

---

## 🛡️ Middlewares Pipeline (Execution Order)

1. **CorrelationIdMiddleware**: Attaches / preserves `X-Correlation-Id` header for distributed tracing.
2. **GlobalExceptionMiddleware**: Catches all uncaught exceptions, translating them to standard `ApiResponse<T>` JSON format.
3. **RateLimiter**:
   - `AuthPolicy`: 10 requests / 5 minutes (sliding window) for brute-force defense
   - `PayrollGeneratePolicy`: 5 requests / hour (fixed window) for heavy operations
   - `SuperAdminPolicy`: 500 requests / minute (token bucket)
   - `HRManagerPolicy`: 300 requests / minute (token bucket)
   - `StandardPolicy`: 100 requests / minute (token bucket)
   - Global Fallback: 100 requests / minute per IP
4. **RequestLoggingMiddleware**: Measures execution time and logs HTTP method, path, response status, and duration.
5. **CORS**: Configurable domain allow-list with exposed headers (`X-Correlation-Id`, `Retry-After`).
6. **Authentication**: JWT Bearer token validation with zero clock skew.
7. **Authorization**: Custom dynamic policy provider mapping `[HasPermission("...")]` to JWT claims.
8. **AuditTrailMiddleware**: Automatically logs all mutating HTTP verbs (`POST`, `PUT`, `PATCH`, `DELETE`) to the `AuditLog` table.

---

## 📋 Modules & Endpoints

### 1. Authentication & Authorization (`/api/v1/auth`)
- `POST /api/v1/auth/login` (Rate Limited: `AuthPolicy`)
- `POST /api/v1/auth/register` (`Permissions.UserRegister`)
- `POST /api/v1/auth/refresh-token` (Rate Limited: `AuthPolicy`)
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/change-password`
- `GET  /api/v1/auth/me`
- `GET  /api/v1/auth/roles` (`Permissions.RoleManage`)
- `POST /api/v1/auth/roles/assign` (`Permissions.RoleManage`)

### 2. Employee Management (`/api/v1/employees`)
- `GET    /api/v1/employees` (Paginated, filterable) (`Permissions.EmployeeViewAll`)
- `GET    /api/v1/employees/{id}` (`Permissions.EmployeeView`)
- `GET    /api/v1/employees/me` (Self-service)
- `PUT    /api/v1/employees/me` (Self-service profile update)
- `POST   /api/v1/employees` (`Permissions.EmployeeCreate`)
- `PUT    /api/v1/employees/{id}` (`Permissions.EmployeeUpdate`)
- `DELETE /api/v1/employees/{id}` (Soft delete) (`Permissions.EmployeeDelete`)
- `GET    /api/v1/employees/{id}/reports` (Direct reports) (`Permissions.EmployeeView`)
- `GET    /api/v1/employees/search` (`Permissions.EmployeeSearch`)

### 3. Departments & Designations
- `GET    /api/v1/departments` (`Permissions.DepartmentView`)
- `GET    /api/v1/departments/{id}` (`Permissions.DepartmentView`)
- `POST   /api/v1/departments` (`Permissions.DepartmentCreate`)
- `PUT    /api/v1/departments/{id}` (`Permissions.DepartmentUpdate`)
- `DELETE /api/v1/departments/{id}` (`Permissions.DepartmentDelete`)
- `GET    /api/v1/departments/{id}/employees` (`Permissions.DepartmentView`)
- `GET    /api/v1/departments/org-chart` (`Permissions.DepartmentView`)
- `GET    /api/v1/designations` (`Permissions.DesignationView`)
- `GET    /api/v1/designations/{id}` (`Permissions.DesignationView`)
- `POST   /api/v1/designations` (`Permissions.DesignationCreate`)
- `PUT    /api/v1/designations/{id}` (`Permissions.DesignationUpdate`)
- `DELETE /api/v1/designations/{id}` (`Permissions.DesignationDelete`)

### 4. Leave & Attendance Management
- `GET    /api/v1/leaves/types`
- `POST   /api/v1/leaves/types` (`Permissions.LeaveManageTypes`)
- `POST   /api/v1/leaves` (`Permissions.LeaveApply`)
- `GET    /api/v1/leaves/my-leaves` (`Permissions.LeaveViewOwn`)
- `GET    /api/v1/leaves` (`Permissions.LeaveViewAll`)
- `GET    /api/v1/leaves/pending-approvals` (`Permissions.LeaveApprove`)
- `PATCH  /api/v1/leaves/{id}/approve` (`Permissions.LeaveApprove`)
- `PATCH  /api/v1/leaves/{id}/reject` (`Permissions.LeaveReject`)
- `POST   /api/v1/leaves/{id}/cancel` (`Permissions.LeaveApply`)
- `GET    /api/v1/leaves/balances/my-balances` (`Permissions.LeaveViewOwn`)
- `GET    /api/v1/leaves/balances/{employeeId}` (`Permissions.LeaveManageBalance`)
- `PUT    /api/v1/leaves/balances/{employeeId}/leave-type/{leaveTypeId}` (`Permissions.LeaveManageBalance`)
- `POST   /api/v1/attendance/check-in` (`Permissions.AttendanceCheckIn`)
- `POST   /api/v1/attendance/check-out` (`Permissions.AttendanceCheckIn`)
- `GET    /api/v1/attendance/my-attendance` (`Permissions.AttendanceViewOwn`)
- `GET    /api/v1/attendance/employee/{employeeId}` (`Permissions.AttendanceViewAll`)
- `GET    /api/v1/attendance/report` (`Permissions.AttendanceReport`)

### 5. Payroll Management (`/api/v1/payroll`)
- `GET   /api/v1/payroll/salary-structure/{employeeId}` (`Permissions.SalaryView`)
- `POST  /api/v1/payroll/salary-structure` (`Permissions.SalaryManage`)
- `POST  /api/v1/payroll/generate` (Rate Limited: `PayrollGeneratePolicy`) (`Permissions.PayrollGenerate`)
- `GET   /api/v1/payroll/my-payslips` (`Permissions.PayrollViewOwn`)
- `GET   /api/v1/payroll/payslips` (`Permissions.PayrollView`)
- `GET   /api/v1/payroll/payslips/{id}`
- `PATCH /api/v1/payroll/payslips/{id}/approve` (`Permissions.PayrollApprove`)

### 6. Performance Reviews (`/api/v1/performancereviews`)
- `POST  /api/v1/performancereviews` (`Permissions.ReviewCreate`)
- `GET   /api/v1/performancereviews/{id}`
- `GET   /api/v1/performancereviews/my-reviews` (`Permissions.ReviewViewOwn`)
- `GET   /api/v1/performancereviews/pending-for-manager` (`Permissions.ReviewManagerRate`)
- `GET   /api/v1/performancereviews` (`Permissions.ReviewView`)
- `PATCH /api/v1/performancereviews/{id}/self-assessment` (`Permissions.ReviewSelfAssess`)
- `PATCH /api/v1/performancereviews/{id}/manager-review` (`Permissions.ReviewManagerRate`)
- `PATCH /api/v1/performancereviews/{id}/finalize` (`Permissions.ReviewFinalize`)
