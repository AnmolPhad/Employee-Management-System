namespace EmployeeManagementSystem.API.Models
{
    public class OrganizationSettings
    {
        public string TimeZoneId { get; set; } = "India Standard Time";
        public List<DayOfWeek> WeeklyOffDays { get; set; } = new() { DayOfWeek.Saturday, DayOfWeek.Sunday };
    }
}
