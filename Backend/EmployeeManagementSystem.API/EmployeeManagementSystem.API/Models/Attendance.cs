using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using EmployeeManagementSystem.API.Models.Enums;

namespace EmployeeManagementSystem.API.Models
{
    public class Attendance
    {
        [Key]
        public int AttendanceId { get; set; }

        [Required]
        [Display(Name = "Employee")]
        public int EmployeeId { get; set; }

        [ForeignKey(nameof(EmployeeId))]
        public virtual Employee? Employee { get; set; }

        [Required(ErrorMessage = "Attendance Date is required.")]
        [DataType(DataType.Date)]
        [Display(Name = "Date")]
        public DateTime AttendanceDate { get; set; } = DateTime.Today;

        [DataType(DataType.Time)]
        [Display(Name = "Check In")]
        public TimeSpan? CheckInTime { get; set; }

        [DataType(DataType.Time)]
        [Display(Name = "Check Out")]
        public TimeSpan? CheckOutTime { get; set; }

        [Display(Name = "Status")]
        public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;

        [Range(0, 24, ErrorMessage = "Work hours must be between 0 and 24.")]
        [Display(Name = "Work Hours")]
        public double? WorkHours { get; set; }

        [StringLength(250, ErrorMessage = "Remarks cannot exceed 250 characters.")]
        public string? Remarks { get; set; }
    }
}
