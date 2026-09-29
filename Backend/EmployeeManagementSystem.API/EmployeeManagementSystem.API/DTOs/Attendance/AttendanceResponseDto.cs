using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.DTOs.Attendance
{
    public class AttendanceResponseDto
    {
        public int AttendanceId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeCode { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string? DepartmentName { get; set; }
        public DateTime AttendanceDate { get; set; }
        public TimeSpan? CheckInTime { get; set; }
        public TimeSpan? CheckOutTime { get; set; }
        public double? WorkHours { get; set; }
        public AttendanceStatus Status { get; set; }
        public string? Remarks { get; set; }
    }
}
