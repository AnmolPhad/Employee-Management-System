namespace EmployeeManagementSystem.API.DTOs.Attendance
{
    public class AttendanceCheckOutDto
    {
        public TimeSpan? Time { get; set; }
        public DateTime? Date { get; set; }
        public string? Remarks { get; set; }
    }
}
