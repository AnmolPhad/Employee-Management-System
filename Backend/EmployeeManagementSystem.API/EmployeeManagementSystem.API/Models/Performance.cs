using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EmployeeManagementSystem.API.Models
{
    public class Performance
    {
        [Key]
        public int PerformanceId { get; set; }

        [Required]
        [Display(Name = "Employee")]
        public int EmployeeId { get; set; }

        [ForeignKey(nameof(EmployeeId))]
        public virtual Employee? Employee { get; set; }

        [Required(ErrorMessage = "Review Period is required.")]
        [StringLength(50, ErrorMessage = "Review Period cannot exceed 50 characters.")]
        [Display(Name = "Review Period")]
        public string ReviewPeriod { get; set; } = string.Empty;

        [Required(ErrorMessage = "Rating is required.")]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5.")]
        [Display(Name = "Rating (1 - 5)")]
        public int Rating { get; set; } = 3;

        [StringLength(1000, ErrorMessage = "Goals cannot exceed 1000 characters.")]
        public string? Goals { get; set; }

        [StringLength(1000, ErrorMessage = "Achievements cannot exceed 1000 characters.")]
        public string? Achievements { get; set; }

        [StringLength(1000, ErrorMessage = "Review Comments cannot exceed 1000 characters.")]
        [Display(Name = "Review Comments")]
        public string? ReviewComments { get; set; }

        [Display(Name = "Reviewed By")]
        public int? ReviewedById { get; set; }

        [ForeignKey(nameof(ReviewedById))]
        public virtual Employee? ReviewedBy { get; set; }

        [Required(ErrorMessage = "Review Date is required.")]
        [DataType(DataType.Date)]
        [Display(Name = "Review Date")]
        public DateTime ReviewDate { get; set; } = DateTime.Today;
    }
}
