namespace EmployeeManagementSystem.API.DTOs.Employee
{
    public class RoleResponseDto
    {
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
