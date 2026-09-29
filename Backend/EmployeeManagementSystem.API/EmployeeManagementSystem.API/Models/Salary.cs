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

        /// <summary>
        /// Annual Cost to Company.
        /// </summary>
        [Required(ErrorMessage = "Annual CTC is required.")]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 100000000, ErrorMessage = "Annual CTC cannot be negative.")]
        [Display(Name = "Annual CTC")]
        public decimal AnnualCTC { get; set; }

        /// <summary>
        /// Monthly Basic Salary (derived from AnnualCTC during creation).
        /// </summary>
        [Required(ErrorMessage = "Basic Salary is required.")]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 100000000, ErrorMessage = "Basic Salary cannot be negative.")]
        [Display(Name = "Basic Salary")]
        public decimal BasicSalary { get; set; }

        /// <summary>
        /// PF percentage applied to Basic Salary (e.g. 12.00).
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        [Range(0, 100, ErrorMessage = "PF Percentage must be between 0 and 100.")]
        [Display(Name = "PF Percentage")]
        public decimal PFPercentage { get; set; } = 12.00m;

        /// <summary>
        /// Monthly PF amount = BasicSalary * (PFPercentage / 100).
        /// Computed and stored when salary record is created/updated.
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "PF Amount")]
        public decimal PFAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 100000000, ErrorMessage = "Allowances cannot be negative.")]
        [Display(Name = "Allowances")]
        public decimal Allowances { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 100000000, ErrorMessage = "Deductions cannot be negative.")]
        [Display(Name = "Deductions")]
        public decimal Deductions { get; set; } = 0;

        /// <summary>
        /// Monthly Net Salary = BasicSalary + Allowances - Deductions - PFAmount.
        /// </summary>
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

        [Display(Name = "Updated At")]
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Recalculates PF Amount and Net Salary.
        /// </summary>
        public void CalculateNetSalary()
        {
            PFAmount = Math.Round(BasicSalary * (PFPercentage / 100m), 2);
            NetSalary = BasicSalary + Allowances - Deductions - PFAmount;
        }
    }
}
