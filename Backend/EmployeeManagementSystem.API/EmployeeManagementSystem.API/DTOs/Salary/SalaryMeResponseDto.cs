namespace EmployeeManagementSystem.API.DTOs.Salary
{
    /// <summary>
    /// Restricted salary response for Employee /me endpoint.
    /// Employee must NOT see: BasicSalary, PF percentage, PF amount,
    /// Unpaid leave deduction, Allowances, Deductions, Net Salary breakdown.
    /// Employee can ONLY see their CTC.
    /// </summary>
    public class SalaryMeResponseDto
    {
        public decimal AnnualCTC { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
