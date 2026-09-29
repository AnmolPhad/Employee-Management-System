using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.DTOs.Holiday
{
    public class HolidayCreateDto
    {
        [Required(ErrorMessage = "Holiday Name is required.")]
        [StringLength(100, ErrorMessage = "Holiday Name cannot exceed 100 characters.")]
        public string HolidayName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Holiday Date is required.")]
        public DateTime HolidayDate { get; set; }

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
