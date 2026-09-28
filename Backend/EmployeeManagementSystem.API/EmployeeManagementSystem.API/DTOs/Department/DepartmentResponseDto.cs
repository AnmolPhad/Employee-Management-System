namespace EmployeeManagementSystem.API.DTOs.Department
{
    public class DepartmentResponseDto
    {
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Location { get; set; }
        public int? DepartmentHeadId { get; set; }
        public string? DepartmentHeadName { get; set; }
        public string? DepartmentHeadEmail { get; set; }
        public int EmployeeCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
