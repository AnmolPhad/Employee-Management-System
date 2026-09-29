namespace EmployeeManagementSystem.API.DTOs.Salary
{
    /// <summary>
    /// Dynamic monthly salary calculation result.
    /// Shows the breakdown for a specific month including unpaid leave deductions.
    /// </summary>
    public class MonthlySalaryCalculationDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeCode { get; set; } = string.Empty;
        public string Month { get; set; } = string.Empty;
        public decimal AnnualCTC { get; set; }
        public decimal MonthlyBasicSalary { get; set; }
        public decimal PFPercentage { get; set; }
        public decimal PFAmount { get; set; }
        public decimal Allowances { get; set; }
        public decimal Deductions { get; set; }
        public decimal MonthlyGrossSalary { get; set; }
        public int TotalUnpaidLeaveDays { get; set; }
        public decimal DailySalary { get; set; }
        public decimal UnpaidLeaveDeduction { get; set; }
        public decimal NetSalary { get; set; }
        public decimal UnpaidLeaveDivisor { get; set; }
    }
}
