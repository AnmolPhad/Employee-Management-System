using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.Models
{
    public class Salary
    {
        [Key]
        public int SalaryId { get; set; }

        [Required]
        [Display(Name = "Employee")]
        public int EmployeeId { get; set; }

        [ForeignKey(nameof(EmployeeId))]
        public virtual Employee? Employee { get; set; }

        [Required(ErrorMessage = "Basic Salary is required.")]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 100000000, ErrorMessage = "Basic Salary cannot be negative.")]
        [Display(Name = "Basic Salary")]
        public decimal BasicSalary { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 100000000, ErrorMessage = "Allowances cannot be negative.")]
        [Display(Name = "Allowances")]
        public decimal Allowances { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 100000000, ErrorMessage = "Deductions cannot be negative.")]
        [Display(Name = "Deductions")]
        public decimal Deductions { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Net Salary")]
        public decimal NetSalary { get; set; }

        [Required(ErrorMessage = "Effective From date is required.")]
        [DataType(DataType.Date)]
        [Display(Name = "Effective From")]
        public DateTime EffectiveFrom { get; set; } = DateTime.Today;

        [DataType(DataType.Date)]
        [Display(Name = "Effective To")]
        public DateTime? EffectiveTo { get; set; }

        [Display(Name = "Status")]
        public SalaryStatus Status { get; set; } = SalaryStatus.Active;

        [Display(Name = "Created At")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Recalculates Net Salary based on Basic Salary, Allowances, and Deductions.
        /// </summary>
        public void CalculateNetSalary()
        {
            NetSalary = BasicSalary + Allowances - Deductions;
        }
    }
}
