namespace EmployeeManagementSystem.API.DTOs.Holiday
{
    public class HolidayQueryParameters
    {
        private const int MaxPageSize = 100;
        private int _pageSize = 20;
        private int _page = 1;

        public int Page
        {
            get => _page;
            set => _page = value < 1 ? 1 : value;
        }

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = value > MaxPageSize ? MaxPageSize : (value < 1 ? 20 : value);
        }

        public int? Year { get; set; }
        public bool? IsActive { get; set; }
        public string? Search { get; set; }
    }
}
