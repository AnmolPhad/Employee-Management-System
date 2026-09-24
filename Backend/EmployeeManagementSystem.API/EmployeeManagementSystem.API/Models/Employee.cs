using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.Models
{
    public class Employee
    {
        [Key]
        public int EmployeeId { get; set; }

        [Required(ErrorMessage = "Employee Code is required.")]
        [StringLength(20, ErrorMessage = "Employee Code cannot exceed 20 characters.")]
        [Display(Name = "Employee Code")]
        public string EmployeeCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "First Name is required.")]
        [StringLength(50, ErrorMessage = "First Name cannot exceed 50 characters.")]
        [Display(Name = "First Name")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last Name is required.")]
        [StringLength(50, ErrorMessage = "Last Name cannot exceed 50 characters.")]
        [Display(Name = "Last Name")]
        public string LastName { get; set; } = string.Empty;

        [NotMapped]
        [Display(Name = "Full Name")]
        public string FullName => $"{FirstName} {LastName}".Trim();

        [Required(ErrorMessage = "Email address is required.")]
        [EmailAddress(ErrorMessage = "Invalid Email Address.")]
        [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
        public string Email { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Invalid Phone Number.")]
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters.")]
        public string? Phone { get; set; }

        [DataType(DataType.Date)]
        [Display(Name = "Date of Birth")]
        public DateTime? DateOfBirth { get; set; }

        public Gender? Gender { get; set; }

        [StringLength(250, ErrorMessage = "Address cannot exceed 250 characters.")]
        public string? Address { get; set; }

        [Required(ErrorMessage = "Date of Joining is required.")]
        [DataType(DataType.Date)]
        [Display(Name = "Date of Joining")]
        public DateTime DateOfJoining { get; set; } = DateTime.Today;

        [Required(ErrorMessage = "Department is required.")]
        [Display(Name = "Department")]
        public int DepartmentId { get; set; }

        [ForeignKey(nameof(DepartmentId))]
        public virtual Department? Department { get; set; }

        [Required(ErrorMessage = "Role is required.")]
        [Display(Name = "Role")]
        public int RoleId { get; set; }

        [ForeignKey(nameof(RoleId))]
        public virtual Role? Role { get; set; }

        [Display(Name = "Manager")]
        public int? ManagerId { get; set; }

        [ForeignKey(nameof(ManagerId))]
        public virtual Employee? Manager { get; set; }

        [Display(Name = "Employment Status")]
        public EmploymentStatus EmploymentStatus { get; set; } = EmploymentStatus.FullTime;

        [Display(Name = "Created At")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Display(Name = "Updated At")]
        public DateTime? UpdatedAt { get; set; }

        // ASP.NET Core Identity link
        public string? UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual ApplicationUser? User { get; set; }

        // Navigation collections
        public virtual ICollection<Employee> Subordinates { get; set; } = new List<Employee>();
        public virtual ICollection<ProjectAssignment> ProjectAssignments { get; set; } = new List<ProjectAssignment>();
        public virtual ICollection<Project> ManagedProjects { get; set; } = new List<Project>();
        public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        public virtual ICollection<Leave> Leaves { get; set; } = new List<Leave>();
        public virtual ICollection<Leave> ApprovedLeaves { get; set; } = new List<Leave>();
        public virtual ICollection<Salary> Salaries { get; set; } = new List<Salary>();
        public virtual ICollection<Performance> PerformanceReviews { get; set; } = new List<Performance>();
        public virtual ICollection<Performance> GivenPerformanceReviews { get; set; } = new List<Performance>();
        public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
        public virtual ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
    }
}
