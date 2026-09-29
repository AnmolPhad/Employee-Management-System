namespace EmployeeManagementSystem.API.DTOs.Salary
{
    /// <summary>
    /// DTO for viewing/updating the global salary calculation settings.
    /// </summary>
    public class SalaryCalculationSettingsDto
    {
        public string SalaryCycle { get; set; } = "Monthly";
        public decimal UnpaidLeaveDivisor { get; set; } = 30m;
        public decimal PFPercentage { get; set; } = 12.00m;
    }
}
