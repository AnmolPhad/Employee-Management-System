using System.Reflection;
using HRMS.Domain.Constants;
using HRMS.Domain.Entities;
using HRMS.Domain.Enums;
using HRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace HRMS.Infrastructure.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<HrmsDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<HrmsDbContext>>();

        try
        {
            // 1. Seed Permissions
            var permissionFields = typeof(Permissions)
                .GetFields(BindingFlags.Public | BindingFlags.Static)
                .Where(f => f.FieldType == typeof(string))
                .Select(f => (string)f.GetValue(null)!)
                .ToList();

            var existingPerms = await context.PermissionDefinitions.ToDictionaryAsync(p => p.Name);

            foreach (var perm in permissionFields)
            {
                if (!existingPerms.ContainsKey(perm))
                {
                    var parts = perm.Split('.');
                    var module = parts.Length > 1 ? parts[1] : "General";
                    var newPerm = new PermissionDefinition
                    {
                        Name = perm,
                        Module = module,
                        Description = perm
                    };
                    context.PermissionDefinitions.Add(newPerm);
                    existingPerms[perm] = newPerm;
                }
            }
            await context.SaveChangesAsync();

            // 2. Seed Roles
            var rolesList = new[]
            {
                (Roles.SuperAdmin, "Complete administrative access"),
                (Roles.HRManager, "HR operations, employee lifecycle, payroll, approvals"),
                (Roles.Manager, "Team management, performance reviews, leave approvals"),
                (Roles.Employee, "Employee self-service")
            };

            var existingRoles = await context.Roles.ToDictionaryAsync(r => r.Name);
            foreach (var (roleName, desc) in rolesList)
            {
                if (!existingRoles.ContainsKey(roleName))
                {
                    var role = new Role { Name = roleName, Description = desc };
                    context.Roles.Add(role);
                    existingRoles[roleName] = role;
                }
            }
            await context.SaveChangesAsync();

            // 3. Map Permissions to Roles
            var allPerms = await context.PermissionDefinitions.ToListAsync();
            var superAdminRole = existingRoles[Roles.SuperAdmin];
            var hrManagerRole = existingRoles[Roles.HRManager];
            var managerRole = existingRoles[Roles.Manager];
            var employeeRole = existingRoles[Roles.Employee];

            var existingRolePerms = await context.RolePermissions
                .Select(rp => $"{rp.RoleId}_{rp.PermissionId}")
                .ToHashSetAsync();

            // SuperAdmin gets ALL
            foreach (var p in allPerms)
            {
                var key = $"{superAdminRole.Id}_{p.Id}";
                if (!existingRolePerms.Contains(key))
                {
                    context.RolePermissions.Add(new RolePermission { RoleId = superAdminRole.Id, PermissionId = p.Id });
                    existingRolePerms.Add(key);
                }
            }

            // HRManager gets everything except user/role admin
            var hrPermissions = allPerms.Where(p =>
                !p.Name.Equals(Permissions.UserRegister) &&
                !p.Name.Equals(Permissions.RoleManage) &&
                !p.Name.Equals(Permissions.EmployeeDelete) &&
                !p.Name.Equals(Permissions.DepartmentDelete) &&
                !p.Name.Equals(Permissions.DesignationDelete)
            ).ToList();

            foreach (var p in hrPermissions)
            {
                var key = $"{hrManagerRole.Id}_{p.Id}";
                if (!existingRolePerms.Contains(key))
                {
                    context.RolePermissions.Add(new RolePermission { RoleId = hrManagerRole.Id, PermissionId = p.Id });
                    existingRolePerms.Add(key);
                }
            }

            // Manager permissions
            var managerPermNames = new HashSet<string>
            {
                Permissions.EmployeeView, Permissions.EmployeeSearch,
                Permissions.DepartmentView, Permissions.DesignationView,
                Permissions.LeaveApply, Permissions.LeaveViewOwn, Permissions.LeaveApprove, Permissions.LeaveReject, Permissions.LeaveViewTeam,
                Permissions.AttendanceCheckIn, Permissions.AttendanceViewOwn,
                Permissions.PayrollViewOwn,
                Permissions.ReviewViewOwn, Permissions.ReviewCreate, Permissions.ReviewSelfAssess, Permissions.ReviewManagerRate, Permissions.ReviewManageGoals
            };

            foreach (var p in allPerms.Where(p => managerPermNames.Contains(p.Name)))
            {
                var key = $"{managerRole.Id}_{p.Id}";
                if (!existingRolePerms.Contains(key))
                {
                    context.RolePermissions.Add(new RolePermission { RoleId = managerRole.Id, PermissionId = p.Id });
                    existingRolePerms.Add(key);
                }
            }

            // Employee self-service permissions
            var employeePermNames = new HashSet<string>
            {
                Permissions.EmployeeSearch,
                Permissions.DepartmentView, Permissions.DesignationView,
                Permissions.LeaveApply, Permissions.LeaveViewOwn,
                Permissions.AttendanceCheckIn, Permissions.AttendanceViewOwn,
                Permissions.PayrollViewOwn,
                Permissions.ReviewViewOwn, Permissions.ReviewSelfAssess
            };

            foreach (var p in allPerms.Where(p => employeePermNames.Contains(p.Name)))
            {
                var key = $"{employeeRole.Id}_{p.Id}";
                if (!existingRolePerms.Contains(key))
                {
                    context.RolePermissions.Add(new RolePermission { RoleId = employeeRole.Id, PermissionId = p.Id });
                    existingRolePerms.Add(key);
                }
            }

            await context.SaveChangesAsync();

            // 4. Seed Leave Types
            if (!await context.LeaveTypes.AnyAsync())
            {
                context.LeaveTypes.AddRange(
                    new LeaveType { Name = "Casual Leave", Code = "CL", DefaultDaysPerYear = 12, IsCarryForward = false },
                    new LeaveType { Name = "Sick Leave", Code = "SL", DefaultDaysPerYear = 10, IsCarryForward = true, MaxCarryForwardDays = 5 },
                    new LeaveType { Name = "Privilege / Annual Leave", Code = "PL", DefaultDaysPerYear = 15, IsCarryForward = true, MaxCarryForwardDays = 10 }
                );
                await context.SaveChangesAsync();
            }

            // 5. Seed Departments & Designations
            if (!await context.Departments.AnyAsync())
            {
                context.Departments.AddRange(
                    new Department { Name = "Engineering", Code = "ENG", Description = "Software and Technology" },
                    new Department { Name = "Human Resources", Code = "HR", Description = "People and Operations" },
                    new Department { Name = "Finance", Code = "FIN", Description = "Finance and Accounts" }
                );
                await context.SaveChangesAsync();
            }

            if (!await context.Designations.AnyAsync())
            {
                context.Designations.AddRange(
                    new Designation { Title = "Chief Technology Officer", Level = 5 },
                    new Designation { Title = "Engineering Manager", Level = 4 },
                    new Designation { Title = "Senior Software Engineer", Level = 3 },
                    new Designation { Title = "Software Engineer", Level = 2 },
                    new Designation { Title = "HR Manager", Level = 4 }
                );
                await context.SaveChangesAsync();
            }

            // 6. Seed Sample Users & Employees
            if (!await context.Users.AnyAsync(u => u.Email == "admin@hrms.com"))
            {
                var deptEng = await context.Departments.FirstAsync(d => d.Code == "ENG");
                var desigManager = await context.Designations.FirstAsync(d => d.Title == "Engineering Manager");
                var desigDev = await context.Designations.FirstAsync(d => d.Title == "Software Engineer");

                // Seed Manager Employee
                var managerEmp = new Employee
                {
                    EmployeeCode = "EMP-2026-0001",
                    FirstName = "Alex",
                    LastName = "Morgan",
                    Email = "manager@hrms.com",
                    Phone = "+1-555-0101",
                    DateOfBirth = new DateTime(1985, 3, 12),
                    Gender = "Male",
                    DateOfJoining = new DateTime(2022, 1, 15),
                    DepartmentId = deptEng.Id,
                    DesignationId = desigManager.Id,
                    Status = EmployeeStatus.Active
                };
                context.Employees.Add(managerEmp);
                await context.SaveChangesAsync();

                // Seed Staff Employee reporting to Alex
                var staffEmp = new Employee
                {
                    EmployeeCode = "EMP-2026-0002",
                    FirstName = "Sam",
                    LastName = "Taylor",
                    Email = "employee@hrms.com",
                    Phone = "+1-555-0102",
                    DateOfBirth = new DateTime(1995, 7, 24),
                    Gender = "Female",
                    DateOfJoining = new DateTime(2024, 6, 1),
                    DepartmentId = deptEng.Id,
                    DesignationId = desigDev.Id,
                    ReportingManagerId = managerEmp.Id,
                    Status = EmployeeStatus.Active
                };
                context.Employees.Add(staffEmp);
                await context.SaveChangesAsync();

                // Setup Salary Structures
                context.SalaryStructures.AddRange(
                    new SalaryStructure
                    {
                        EmployeeId = managerEmp.Id,
                        BasicSalary = 5000,
                        HRA = 2000,
                        DA = 500,
                        MedicalAllowance = 300,
                        ConveyanceAllowance = 200,
                        SpecialAllowance = 1000,
                        PF = 600,
                        ESI = 100,
                        ProfessionalTax = 50,
                        TDS = 500,
                        EffectiveFrom = DateTime.UtcNow.AddMonths(-12)
                    },
                    new SalaryStructure
                    {
                        EmployeeId = staffEmp.Id,
                        BasicSalary = 3000,
                        HRA = 1200,
                        DA = 300,
                        MedicalAllowance = 200,
                        ConveyanceAllowance = 150,
                        SpecialAllowance = 500,
                        PF = 360,
                        ESI = 60,
                        ProfessionalTax = 30,
                        TDS = 200,
                        EffectiveFrom = DateTime.UtcNow.AddMonths(-3)
                    }
                );
                await context.SaveChangesAsync();

                // Initialize Leave Balances for 2026
                var leaveTypes = await context.LeaveTypes.ToListAsync();
                foreach (var lt in leaveTypes)
                {
                    context.LeaveBalances.Add(new LeaveBalance
                    {
                        EmployeeId = staffEmp.Id,
                        LeaveTypeId = lt.Id,
                        Year = 2026,
                        TotalLeaves = lt.DefaultDaysPerYear,
                        UsedLeaves = 0
                    });
                    context.LeaveBalances.Add(new LeaveBalance
                    {
                        EmployeeId = managerEmp.Id,
                        LeaveTypeId = lt.Id,
                        Year = 2026,
                        TotalLeaves = lt.DefaultDaysPerYear,
                        UsedLeaves = 0
                    });
                }
                await context.SaveChangesAsync();

                // Seed Users
                var adminUser = new User
                {
                    Email = "admin@hrms.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    FullName = "System Administrator"
                };
                context.Users.Add(adminUser);

                var hrUser = new User
                {
                    Email = "hr@hrms.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Hr@123"),
                    FullName = "HR Administrator"
                };
                context.Users.Add(hrUser);

                var managerUser = new User
                {
                    Email = "manager@hrms.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"),
                    FullName = "Alex Morgan",
                    EmployeeId = managerEmp.Id
                };
                context.Users.Add(managerUser);

                var staffUser = new User
                {
                    Email = "employee@hrms.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@123"),
                    FullName = "Sam Taylor",
                    EmployeeId = staffEmp.Id
                };
                context.Users.Add(staffUser);
                await context.SaveChangesAsync();

                // Assign Roles
                context.UserRoles.AddRange(
                    new UserRole { UserId = adminUser.Id, RoleId = superAdminRole.Id },
                    new UserRole { UserId = hrUser.Id, RoleId = hrManagerRole.Id },
                    new UserRole { UserId = managerUser.Id, RoleId = managerRole.Id },
                    new UserRole { UserId = staffUser.Id, RoleId = employeeRole.Id }
                );
                await context.SaveChangesAsync();
            }

            logger.LogInformation("HRMS initial database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred during database seeding.");
        }
    }
}
