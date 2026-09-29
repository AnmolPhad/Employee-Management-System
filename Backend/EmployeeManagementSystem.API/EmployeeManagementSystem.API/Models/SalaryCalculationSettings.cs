using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EmployeeManagementSystem.API.Models
{
    /// <summary>
    /// Configurable settings for salary calculation.
    /// Stored in the database so Admin/HR can update without redeployment.
    /// </summary>
    public class SalaryCalculationSettings
    {
        [Key]
        public int SettingsId { get; set; }

        /// <summary>
        /// The salary cycle label (e.g. "Monthly").
        /// </summary>
        [Required]
        [StringLength(50)]
        [Display(Name = "Salary Cycle")]
        public string SalaryCycle { get; set; } = "Monthly";

        /// <summary>
        /// The divisor used to calculate daily salary from monthly salary.
        /// Default: 30. Monthly Salary / UnpaidLeaveDivisor = Daily Salary.
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        [Range(1, 31, ErrorMessage = "Unpaid Leave Divisor must be between 1 and 31.")]
        [Display(Name = "Unpaid Leave Divisor")]
        public decimal UnpaidLeaveDivisor { get; set; } = 30m;

        /// <summary>
        /// Default PF percentage for new salary records (e.g. 12.00).
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        [Range(0, 100, ErrorMessage = "PF Percentage must be between 0 and 100.")]
        [Display(Name = "Default PF Percentage")]
        public decimal PFPercentage { get; set; } = 12.00m;

        [Display(Name = "Updated At")]
        public DateTime? UpdatedAt { get; set; }

        [StringLength(100)]
        [Display(Name = "Updated By")]
        public string? UpdatedBy { get; set; }
    }
}
