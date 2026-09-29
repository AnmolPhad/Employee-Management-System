namespace EmployeeManagementSystem.API.DTOs.Salary
{
    /// <summary>
    /// Full salary response for Admin/HR. Shows all details.
    /// </summary>
    public class SalaryResponseDto
    {
        public int SalaryId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeCode { get; set; } = string.Empty;
        public decimal AnnualCTC { get; set; }
        public decimal BasicSalary { get; set; }
        public decimal PFPercentage { get; set; }
        public decimal PFAmount { get; set; }
        public decimal Allowances { get; set; }
        public decimal Deductions { get; set; }
        public decimal NetSalary { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
