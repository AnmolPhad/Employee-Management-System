using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.DTOs.Salary
{
    /// <summary>
    /// DTO for salary increment — creates a new salary version.
    /// Does NOT overwrite the existing salary record.
    /// </summary>
    public class SalaryIncrementDto
    {
        [Required(ErrorMessage = "New Annual CTC is required.")]
        [Range(0.01, 100000000, ErrorMessage = "New Annual CTC must be greater than zero.")]
        public decimal NewAnnualCTC { get; set; }

        [Range(0, 100000000, ErrorMessage = "Allowances cannot be negative.")]
        public decimal Allowances { get; set; } = 0;

        [Range(0, 100000000, ErrorMessage = "Deductions cannot be negative.")]
        public decimal Deductions { get; set; } = 0;

        [Range(0, 100, ErrorMessage = "PF Percentage must be between 0 and 100.")]
        public decimal? PFPercentage { get; set; }

        [Required(ErrorMessage = "Effective From date is required.")]
        [DataType(DataType.Date)]
        public DateTime EffectiveFrom { get; set; }
    }
}
