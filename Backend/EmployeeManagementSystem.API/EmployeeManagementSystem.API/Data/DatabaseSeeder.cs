using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.Models;
using EmployeeManagementSystem.API.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.API.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedDatabaseAsync(IServiceProvider serviceProvider, IConfiguration configuration)
        {
            using var scope = serviceProvider.CreateScope();
            var services = scope.ServiceProvider;
            var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseSeeder");
            var context = services.GetRequiredService<ApplicationDbContext>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

            try
            {
                // 1. Apply any pending EF Core migrations automatically
                if ((await context.Database.GetPendingMigrationsAsync()).Any())
                {
                    logger.LogInformation("Applying pending EF Core migrations...");
                    await context.Database.MigrateAsync();
                    logger.LogInformation("EF Core migrations applied successfully.");
                }

                // 2. Seed Identity Roles (Admin, HR, Manager, Employee)
                foreach (var roleName in AppRoles.All)
                {
                    if (!await roleManager.RoleExistsAsync(roleName))
                    {
                        await roleManager.CreateAsync(new IdentityRole(roleName));
                        logger.LogInformation("Seeded Identity role: {RoleName}", roleName);
                    }
                }

                // 3. Seed Default Departments (if none exist)
                if (!await context.Departments.AnyAsync())
                {
                    logger.LogInformation("Seeding default departments...");
                    var departments = new List<Department>
                    {
                        new() { DepartmentName = "Information Technology", Description = "IT infrastructure, software development and DevOps", Location = "Building A, Floor 3", CreatedAt = DateTime.UtcNow },
                        new() { DepartmentName = "Human Resources", Description = "Recruitment, employee relations and people operations", Location = "Building A, Floor 2", CreatedAt = DateTime.UtcNow },
                        new() { DepartmentName = "Finance", Description = "Financial management, accounting and payroll", Location = "Building B, Floor 1", CreatedAt = DateTime.UtcNow },
                        new() { DepartmentName = "Operations", Description = "Business processes and operations management", Location = "Building B, Floor 2", CreatedAt = DateTime.UtcNow }
                    };

                    await context.Departments.AddRangeAsync(departments);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Default departments seeded successfully.");
                }

                // 4. Seed Default EMS Domain Roles (if none exist)
                if (!await context.AppRoles.AnyAsync())
                {
                    logger.LogInformation("Seeding default EMS domain roles...");
                    var domainRoles = new List<Role>
                    {
                        new() { RoleName = "System Administrator", Description = "Full administrative access across all systems", IsActive = true, CreatedAt = DateTime.UtcNow },
                        new() { RoleName = "Software Engineer", Description = "Software design, coding and testing", IsActive = true, CreatedAt = DateTime.UtcNow },
                        new() { RoleName = "HR Specialist", Description = "Onboarding, leave administration and employee engagement", IsActive = true, CreatedAt = DateTime.UtcNow },
                        new() { RoleName = "Project Manager", Description = "Project delivery, resource allocation and sprint planning", IsActive = true, CreatedAt = DateTime.UtcNow },
                        new() { RoleName = "Financial Analyst", Description = "Budget analysis, reporting and audit", IsActive = true, CreatedAt = DateTime.UtcNow }
                    };

                    await context.AppRoles.AddRangeAsync(domainRoles);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Default EMS domain roles seeded successfully.");
                }

                // 5. Seed Default Leave Types (if none exist)
                if (!await context.LeaveTypes.AnyAsync())
                {
                    var leaveTypes = new List<LeaveType>
                    {
                        new() { LeaveTypeName = "Annual Leave", Description = "Paid yearly leave allowance", MaxDaysPerYear = 20, IsActive = true },
                        new() { LeaveTypeName = "Sick Leave", Description = "Medical illness leave", MaxDaysPerYear = 10, IsActive = true },
                        new() { LeaveTypeName = "Casual Leave", Description = "Short-notice personal leave", MaxDaysPerYear = 5, IsActive = true }
                    };

                    await context.LeaveTypes.AddRangeAsync(leaveTypes);
                    await context.SaveChangesAsync();
                }

                // 6. Seed Default Admin User (Idempotent)
                var adminEmail = configuration["DefaultAdmin:Email"] ?? "admin@ems.com";
                var adminPassword = configuration["DefaultAdmin:Password"] ?? "Admin@123";
                var adminFirstName = configuration["DefaultAdmin:FirstName"] ?? "System";
                var adminLastName = configuration["DefaultAdmin:LastName"] ?? "Admin";

                var existingAdminUser = await userManager.FindByEmailAsync(adminEmail);
                if (existingAdminUser is null)
                {
                    logger.LogInformation("Seeding default ADMIN user: {AdminEmail}", adminEmail);

                    // Ensure an Employee record exists for the Admin
                    var itDepartment = await context.Departments.FirstAsync();
                    var adminDomainRole = await context.AppRoles.FirstAsync();

                    var adminEmployee = await context.Employees.FirstOrDefaultAsync(e => e.Email == adminEmail);
                    if (adminEmployee is null)
                    {
                        adminEmployee = new Employee
                        {
                            EmployeeCode = "ADM001",
                            FirstName = adminFirstName,
                            LastName = adminLastName,
                            Email = adminEmail,
                            Phone = "+1-555-0100",
                            DepartmentId = itDepartment.DepartmentId,
                            RoleId = adminDomainRole.RoleId,
                            EmploymentStatus = EmploymentStatus.FullTime,
                            DateOfJoining = DateTime.UtcNow.Date,
                            CreatedAt = DateTime.UtcNow
                        };

                        context.Employees.Add(adminEmployee);
                        await context.SaveChangesAsync();
                    }

                    var newAdminUser = new ApplicationUser
                    {
                        UserName = adminEmail,
                        Email = adminEmail,
                        EmailConfirmed = true,
                        EmployeeId = adminEmployee.EmployeeId
                    };

                    var createResult = await userManager.CreateAsync(newAdminUser, adminPassword);
                    if (createResult.Succeeded)
                    {
                        await userManager.AddToRoleAsync(newAdminUser, AppRoles.Admin);
                        adminEmployee.UserId = newAdminUser.Id;
                        await context.SaveChangesAsync();
                        logger.LogInformation("Default ADMIN user ({AdminEmail}) seeded successfully with password from configuration.", adminEmail);
                    }
                    else
                    {
                        logger.LogError("Failed to create default ADMIN user: {Errors}",
                            string.Join(", ", createResult.Errors.Select(e => e.Description)));
                    }
                }
                else
                {
                    // Ensure the existing admin user has the Admin role
                    if (!await userManager.IsInRoleAsync(existingAdminUser, AppRoles.Admin))
                    {
                        await userManager.AddToRoleAsync(existingAdminUser, AppRoles.Admin);
                        logger.LogInformation("Assigned Admin role to existing user: {AdminEmail}", adminEmail);
                    }

                    // Link to employee record if not already linked
                    if (!existingAdminUser.EmployeeId.HasValue)
                    {
                        var adminEmp = await context.Employees.FirstOrDefaultAsync(e => e.Email == adminEmail);
                        if (adminEmp is not null)
                        {
                            existingAdminUser.EmployeeId = adminEmp.EmployeeId;
                            adminEmp.UserId = existingAdminUser.Id;
                            await userManager.UpdateAsync(existingAdminUser);
                            await context.SaveChangesAsync();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while seeding the database.");
            }
        }
    }
}
