using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.API.Models
{
    public class Holiday
    {
        [Key]
        public int HolidayId { get; set; }

        [Required(ErrorMessage = "Holiday Name is required.")]
        [StringLength(100, ErrorMessage = "Holiday Name cannot exceed 100 characters.")]
        public string HolidayName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Holiday Date is required.")]
        [DataType(DataType.Date)]
        public DateTime HolidayDate { get; set; }

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        [StringLength(100)]
        public string? CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
