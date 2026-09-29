namespace EmployeeManagementSystem.API.DTOs.Salary
{
    /// <summary>
    /// Query parameters for listing salary records.
    /// </summary>
    public class SalaryQueryParameters
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public int? EmployeeId { get; set; }
        public string? Status { get; set; }
        public string? SortBy { get; set; } = "EffectiveFrom";
        public string? SortOrder { get; set; } = "desc";
    }
}
