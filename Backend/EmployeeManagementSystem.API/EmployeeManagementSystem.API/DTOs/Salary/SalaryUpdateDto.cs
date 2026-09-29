using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.DTOs.Salary
{
    /// <summary>
    /// DTO for updating an existing salary record.
    /// </summary>
    public class SalaryUpdateDto
    {
        [Required(ErrorMessage = "Annual CTC is required.")]
        [Range(0.01, 100000000, ErrorMessage = "Annual CTC must be greater than zero.")]
        public decimal AnnualCTC { get; set; }

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
