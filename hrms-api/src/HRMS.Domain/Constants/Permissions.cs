namespace HRMS.Domain.Constants;

public static class Permissions
{
    // Employee Module
    public const string EmployeeView       = "Permissions.Employee.View";
    public const string EmployeeViewAll    = "Permissions.Employee.ViewAll";
    public const string EmployeeCreate     = "Permissions.Employee.Create";
    public const string EmployeeUpdate     = "Permissions.Employee.Update";
    public const string EmployeeDelete     = "Permissions.Employee.Delete";
    public const string EmployeeSearch     = "Permissions.Employee.Search";

    // Department Module
    public const string DepartmentView     = "Permissions.Department.View";
    public const string DepartmentCreate   = "Permissions.Department.Create";
    public const string DepartmentUpdate   = "Permissions.Department.Update";
    public const string DepartmentDelete   = "Permissions.Department.Delete";

    // Designation Module
    public const string DesignationView    = "Permissions.Designation.View";
    public const string DesignationCreate  = "Permissions.Designation.Create";
    public const string DesignationUpdate  = "Permissions.Designation.Update";
    public const string DesignationDelete  = "Permissions.Designation.Delete";

    // Leave Module
    public const string LeaveApply         = "Permissions.Leave.Apply";
    public const string LeaveViewOwn       = "Permissions.Leave.ViewOwn";
    public const string LeaveViewAll       = "Permissions.Leave.ViewAll";
    public const string LeaveApprove       = "Permissions.Leave.Approve";
    public const string LeaveReject        = "Permissions.Leave.Reject";
    public const string LeaveManageTypes   = "Permissions.Leave.ManageTypes";
    public const string LeaveManageBalance = "Permissions.Leave.ManageBalance";
    public const string LeaveViewTeam      = "Permissions.Leave.ViewTeam";

    // Attendance Module
    public const string AttendanceCheckIn  = "Permissions.Attendance.CheckIn";
    public const string AttendanceViewOwn  = "Permissions.Attendance.ViewOwn";
    public const string AttendanceViewAll  = "Permissions.Attendance.ViewAll";
    public const string AttendanceReport   = "Permissions.Attendance.Report";

    // Payroll Module
    public const string PayrollView        = "Permissions.Payroll.View";
    public const string PayrollViewOwn     = "Permissions.Payroll.ViewOwn";
    public const string PayrollGenerate    = "Permissions.Payroll.Generate";
    public const string PayrollApprove     = "Permissions.Payroll.Approve";
    public const string SalaryView         = "Permissions.Salary.View";
    public const string SalaryManage       = "Permissions.Salary.Manage";

    // Performance Module
    public const string ReviewView         = "Permissions.Review.View";
    public const string ReviewViewOwn      = "Permissions.Review.ViewOwn";
    public const string ReviewCreate       = "Permissions.Review.Create";
    public const string ReviewSelfAssess   = "Permissions.Review.SelfAssess";
    public const string ReviewManagerRate  = "Permissions.Review.ManagerRate";
    public const string ReviewFinalize     = "Permissions.Review.Finalize";
    public const string ReviewManageGoals  = "Permissions.Review.ManageGoals";

    // Admin & Auth Module
    public const string UserRegister       = "Permissions.User.Register";
    public const string RoleManage         = "Permissions.Role.Manage";
    public const string AuditLogView       = "Permissions.AuditLog.View";
}
