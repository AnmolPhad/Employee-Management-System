using EmployeeManagementSystem.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.API.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Employee> Employees { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Role> AppRoles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectAssignment> ProjectAssignments { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<Leave> Leaves { get; set; }
        public DbSet<LeaveType> LeaveTypes { get; set; }
        public DbSet<Salary> Salaries { get; set; }
        public DbSet<Performance> Performances { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 1. Identity base configuration
            base.OnModelCreating(modelBuilder);

            // =========================================================================
            // ENTITY CONFIGURATIONS (Primary Keys, Properties, Unique Indexes)
            // =========================================================================

            // Employee
            modelBuilder.Entity<Employee>(entity =>
            {
                entity.HasKey(e => e.EmployeeId);

                entity.HasIndex(e => e.EmployeeCode)
                      .IsUnique();

                entity.HasIndex(e => e.Email)
                      .IsUnique();

                entity.Property(e => e.EmployeeCode)
                      .IsRequired()
                      .HasMaxLength(20);

                entity.Property(e => e.FirstName)
                      .IsRequired()
                      .HasMaxLength(50);

                entity.Property(e => e.LastName)
                      .IsRequired()
                      .HasMaxLength(50);

                entity.Property(e => e.Email)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(e => e.Phone)
                      .IsRequired(false)
                      .HasMaxLength(20);

                entity.Property(e => e.Address)
                      .IsRequired(false)
                      .HasMaxLength(250);

                entity.Property(e => e.DateOfJoining)
                      .IsRequired();

                entity.Property(e => e.DateOfBirth)
                      .IsRequired(false);

                entity.Property(e => e.CreatedAt)
                      .IsRequired();

                entity.Property(e => e.UpdatedAt)
                      .IsRequired(false);
            });

            // Department
            modelBuilder.Entity<Department>(entity =>
            {
                entity.HasKey(d => d.DepartmentId);

                entity.HasIndex(d => d.DepartmentName)
                      .IsUnique();

                entity.Property(d => d.DepartmentName)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(d => d.Description)
                      .IsRequired(false)
                      .HasMaxLength(500);

                entity.Property(d => d.Location)
                      .IsRequired(false)
                      .HasMaxLength(100);

                entity.Property(d => d.CreatedAt)
                      .IsRequired();

                entity.Property(d => d.UpdatedAt)
                      .IsRequired(false);
            });

            // Role
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("Roles");

                entity.HasKey(r => r.RoleId);

                entity.HasIndex(r => r.RoleName)
                      .IsUnique();

                entity.Property(r => r.RoleName)
                      .IsRequired()
                      .HasMaxLength(50);

                entity.Property(r => r.Description)
                      .IsRequired(false)
                      .HasMaxLength(250);

                entity.Property(r => r.CreatedAt)
                      .IsRequired();

                entity.Property(r => r.UpdatedAt)
                      .IsRequired(false);
            });

            // Permission
            modelBuilder.Entity<Permission>(entity =>
            {
                entity.HasKey(p => p.PermissionId);

                entity.HasIndex(p => p.PermissionName)
                      .IsUnique();

                entity.Property(p => p.PermissionName)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(p => p.Module)
                      .IsRequired()
                      .HasMaxLength(50);

                entity.Property(p => p.Description)
                      .IsRequired(false)
                      .HasMaxLength(250);
            });

            // RolePermission
            modelBuilder.Entity<RolePermission>(entity =>
            {
                entity.HasKey(rp => rp.RolePermissionId);

                entity.HasIndex(rp => new { rp.RoleId, rp.PermissionId })
                      .IsUnique();
            });

            // Project
            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(p => p.ProjectId);

                entity.Property(p => p.ProjectName)
                      .IsRequired()
                      .HasMaxLength(150);

                entity.Property(p => p.Description)
                      .IsRequired(false)
                      .HasMaxLength(1000);

                entity.Property(p => p.StartDate)
                      .IsRequired();

                entity.Property(p => p.EndDate)
                      .IsRequired(false);

                entity.Property(p => p.CreatedAt)
                      .IsRequired();

                entity.Property(p => p.UpdatedAt)
                      .IsRequired(false);
            });

            // ProjectAssignment
            modelBuilder.Entity<ProjectAssignment>(entity =>
            {
                entity.HasKey(pa => pa.ProjectAssignmentId);

                entity.HasIndex(pa => new { pa.ProjectId, pa.EmployeeId });

                entity.Property(pa => pa.RoleInProject)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(pa => pa.StartDate)
                      .IsRequired();

                entity.Property(pa => pa.EndDate)
                      .IsRequired(false);
            });

            // Attendance
            modelBuilder.Entity<Attendance>(entity =>
            {
                entity.HasKey(a => a.AttendanceId);

                entity.HasIndex(a => new { a.EmployeeId, a.AttendanceDate })
                      .IsUnique();

                entity.Property(a => a.AttendanceDate)
                      .IsRequired();

                entity.Property(a => a.Remarks)
                      .IsRequired(false)
                      .HasMaxLength(250);
            });

            // LeaveType
            modelBuilder.Entity<LeaveType>(entity =>
            {
                entity.HasKey(lt => lt.LeaveTypeId);

                entity.HasIndex(lt => lt.LeaveTypeName)
                      .IsUnique();

                entity.Property(lt => lt.LeaveTypeName)
                      .IsRequired()
                      .HasMaxLength(50);

                entity.Property(lt => lt.Description)
                      .IsRequired(false)
                      .HasMaxLength(250);
            });

            // Leave
            modelBuilder.Entity<Leave>(entity =>
            {
                entity.HasKey(l => l.LeaveId);

                entity.Property(l => l.StartDate)
                      .IsRequired();

                entity.Property(l => l.EndDate)
                      .IsRequired();

                entity.Property(l => l.Reason)
                      .IsRequired()
                      .HasMaxLength(500);

                entity.Property(l => l.RejectionReason)
                      .IsRequired(false)
                      .HasMaxLength(500);

                entity.Property(l => l.AppliedDate)
                      .IsRequired();

                entity.Property(l => l.ApprovedDate)
                      .IsRequired(false);
            });

            // Salary
            modelBuilder.Entity<Salary>(entity =>
            {
                entity.HasKey(s => s.SalaryId);

                entity.Property(s => s.BasicSalary)
                      .IsRequired()
                      .HasPrecision(18, 2);

                entity.Property(s => s.Allowances)
                      .IsRequired()
                      .HasPrecision(18, 2);

                entity.Property(s => s.Deductions)
                      .IsRequired()
                      .HasPrecision(18, 2);

                entity.Property(s => s.NetSalary)
                      .IsRequired()
                      .HasPrecision(18, 2);

                entity.Property(s => s.EffectiveFrom)
                      .IsRequired();

                entity.Property(s => s.EffectiveTo)
                      .IsRequired(false);

                entity.Property(s => s.CreatedAt)
                      .IsRequired();
            });

            // Performance
            modelBuilder.Entity<Performance>(entity =>
            {
                entity.HasKey(p => p.PerformanceId);

                entity.Property(p => p.ReviewPeriod)
                      .IsRequired()
                      .HasMaxLength(50);

                entity.Property(p => p.Goals)
                      .IsRequired(false)
                      .HasMaxLength(1000);

                entity.Property(p => p.Achievements)
                      .IsRequired(false)
                      .HasMaxLength(1000);

                entity.Property(p => p.ReviewComments)
                      .IsRequired(false)
                      .HasMaxLength(1000);

                entity.Property(p => p.ReviewDate)
                      .IsRequired();
            });

            // Ticket
            modelBuilder.Entity<Ticket>(entity =>
            {
                entity.HasKey(t => t.TicketId);

                entity.Property(t => t.Title)
                      .IsRequired()
                      .HasMaxLength(150);

                entity.Property(t => t.Description)
                      .IsRequired()
                      .HasMaxLength(2000);

                entity.Property(t => t.Category)
                      .IsRequired()
                      .HasMaxLength(50);

                entity.Property(t => t.CreatedAt)
                      .IsRequired();

                entity.Property(t => t.UpdatedAt)
                      .IsRequired(false);

                entity.Property(t => t.ClosedAt)
                      .IsRequired(false);
            });

            // AuditLog
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(al => al.AuditLogId);

                entity.Property(al => al.UserId)
                      .IsRequired(false)
                      .HasMaxLength(450);

                entity.Property(al => al.Action)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(al => al.EntityName)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(al => al.EntityId)
                      .IsRequired(false)
                      .HasMaxLength(100);

                entity.Property(al => al.OldValue)
                      .IsRequired(false);

                entity.Property(al => al.NewValue)
                      .IsRequired(false);

                entity.Property(al => al.IPAddress)
                      .IsRequired(false)
                      .HasMaxLength(50);

                entity.Property(al => al.Timestamp)
                      .IsRequired();
            });

            // =========================================================================
            // RELATIONSHIPS CONFIGURATION (Safeguarded against multiple cascade paths)
            // =========================================================================

            // Employee -> Department
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Employee -> Role
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Role)
                .WithMany(r => r.Employees)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Employee -> Manager (Self-referencing hierarchy)
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Manager)
                .WithMany(m => m.Subordinates)
                .HasForeignKey(e => e.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Department -> DepartmentHead
            modelBuilder.Entity<Department>()
                .HasOne(d => d.DepartmentHead)
                .WithMany()
                .HasForeignKey(d => d.DepartmentHeadId)
                .OnDelete(DeleteBehavior.Restrict);

            // Project -> Department
            modelBuilder.Entity<Project>()
                .HasOne(p => p.Department)
                .WithMany(d => d.Projects)
                .HasForeignKey(p => p.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Project -> ProjectManager
            modelBuilder.Entity<Project>()
                .HasOne(p => p.ProjectManager)
                .WithMany(e => e.ManagedProjects)
                .HasForeignKey(p => p.ProjectManagerId)
                .OnDelete(DeleteBehavior.Restrict);

            // ProjectAssignment -> Project
            modelBuilder.Entity<ProjectAssignment>()
                .HasOne(pa => pa.Project)
                .WithMany(p => p.Assignments)
                .HasForeignKey(pa => pa.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            // ProjectAssignment -> Employee
            modelBuilder.Entity<ProjectAssignment>()
                .HasOne(pa => pa.Employee)
                .WithMany(e => e.ProjectAssignments)
                .HasForeignKey(pa => pa.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Attendance -> Employee
            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Employee)
                .WithMany(e => e.Attendances)
                .HasForeignKey(a => a.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Leave -> Employee
            modelBuilder.Entity<Leave>()
                .HasOne(l => l.Employee)
                .WithMany(e => e.Leaves)
                .HasForeignKey(l => l.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Leave -> LeaveType
            modelBuilder.Entity<Leave>()
                .HasOne(l => l.LeaveType)
                .WithMany(lt => lt.Leaves)
                .HasForeignKey(l => l.LeaveTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Leave -> ApprovedBy (Employee)
            modelBuilder.Entity<Leave>()
                .HasOne(l => l.ApprovedBy)
                .WithMany(e => e.ApprovedLeaves)
                .HasForeignKey(l => l.ApprovedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Salary -> Employee
            modelBuilder.Entity<Salary>()
                .HasOne(s => s.Employee)
                .WithMany(e => e.Salaries)
                .HasForeignKey(s => s.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Performance -> Employee
            modelBuilder.Entity<Performance>()
                .HasOne(p => p.Employee)
                .WithMany(e => e.PerformanceReviews)
                .HasForeignKey(p => p.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Performance -> ReviewedBy (Employee)
            modelBuilder.Entity<Performance>()
                .HasOne(p => p.ReviewedBy)
                .WithMany(e => e.GivenPerformanceReviews)
                .HasForeignKey(p => p.ReviewedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Ticket -> Employee (Creator)
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Employee)
                .WithMany(e => e.Tickets)
                .HasForeignKey(t => t.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Ticket -> AssignedTo (Employee)
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.AssignedTo)
                .WithMany(e => e.AssignedTickets)
                .HasForeignKey(t => t.AssignedToId)
                .OnDelete(DeleteBehavior.Restrict);

            // RolePermission -> Role
            modelBuilder.Entity<RolePermission>()
                .HasOne(rp => rp.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(rp => rp.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            // RolePermission -> Permission
            modelBuilder.Entity<RolePermission>()
                .HasOne(rp => rp.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(rp => rp.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);

            // AuditLog -> ApplicationUser
            modelBuilder.Entity<AuditLog>()
                .HasOne(al => al.User)
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(al => al.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // ApplicationUser -> Employee (1:1 optional link)
            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.Employee)
                .WithOne(e => e.User)
                .HasForeignKey<ApplicationUser>(u => u.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
