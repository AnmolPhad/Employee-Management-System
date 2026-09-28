using HRMS.Domain.Common;
using HRMS.Domain.Enums;

namespace HRMS.Domain.Entities;

public class PerformanceReview : BaseEntity
{
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public int ReviewerId { get; set; }
    public Employee Reviewer { get; set; } = null!;

    public string ReviewPeriod { get; set; } = string.Empty; // e.g., "Q1 2026", "Annual 2026"
    public int Year { get; set; }

    public decimal? SelfRating { get; set; }
    public decimal? ManagerRating { get; set; }
    public decimal? FinalRating { get; set; }

    public string? SelfComments { get; set; }
    public string? ManagerComments { get; set; }
    public string? HRComments { get; set; }

    public ReviewStatus Status { get; set; } = ReviewStatus.Draft;
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ManagerReviewedAt { get; set; }
    public DateTime? FinalizedAt { get; set; }

    public ICollection<ReviewGoal> Goals { get; set; } = new List<ReviewGoal>();
}

public class ReviewGoal : BaseEntity
{
    public int PerformanceReviewId { get; set; }
    public PerformanceReview PerformanceReview { get; set; } = null!;

    public string GoalTitle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Weightage { get; set; } = 1.0m;
    public decimal? SelfScore { get; set; }
    public decimal? ManagerScore { get; set; }
    public string? Comments { get; set; }
}
