using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.DTOs.Attendance
{
    public class AttendanceQueryParameters
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

        public int? EmployeeId { get; set; }
        public AttendanceStatus? Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? Year { get; set; }
        public int? Month { get; set; }
    }
}
