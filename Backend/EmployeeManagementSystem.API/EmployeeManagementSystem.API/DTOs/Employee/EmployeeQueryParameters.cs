using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.DTOs.Employee
{
    public class EmployeeQueryParameters
    {
        private const int MaxPageSize = 100;
        private int _page = 1;
        private int _pageSize = 10;

        public int Page
        {
            get => _page;
            set => _page = value < 1 ? 1 : value;
        }

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = value < 1 ? 10 : Math.Min(value, MaxPageSize);
        }

        public string? Search { get; set; }
        public int? DepartmentId { get; set; }
        public int? RoleId { get; set; }
        public EmploymentStatus? Status { get; set; }
    }
}
