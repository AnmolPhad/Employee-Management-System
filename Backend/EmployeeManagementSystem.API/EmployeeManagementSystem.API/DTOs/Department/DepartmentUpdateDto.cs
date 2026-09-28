using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.DTOs.Department
{
    public class DepartmentUpdateDto
    {
        [Required(ErrorMessage = "Department Name is required.")]
        [StringLength(100, ErrorMessage = "Department Name cannot exceed 100 characters.")]
        public string DepartmentName { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string? Description { get; set; }

        [StringLength(100, ErrorMessage = "Location cannot exceed 100 characters.")]
        public string? Location { get; set; }

        public int? DepartmentHeadId { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
