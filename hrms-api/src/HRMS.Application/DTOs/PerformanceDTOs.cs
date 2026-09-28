using HRMS.Domain.Enums;

namespace HRMS.Application.DTOs;

public class PerformanceReviewDto
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public int ReviewerId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public string ReviewPeriod { get; set; } = string.Empty;
    public int Year { get; set; }
    public decimal? SelfRating { get; set; }
    public decimal? ManagerRating { get; set; }
    public decimal? FinalRating { get; set; }
    public string? SelfComments { get; set; }
    public string? ManagerComments { get; set; }
    public string? HRComments { get; set; }
    public ReviewStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ReviewGoalDto> Goals { get; set; } = [];
}

public class ReviewGoalDto
{
    public int Id { get; set; }
    public int PerformanceReviewId { get; set; }
    public string GoalTitle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Weightage { get; set; }
    public decimal? SelfScore { get; set; }
    public decimal? ManagerScore { get; set; }
    public string? Comments { get; set; }
}

public class CreateReviewRequest
{
    public int EmployeeId { get; set; }
    public int ReviewerId { get; set; }
    public string ReviewPeriod { get; set; } = string.Empty;
    public int Year { get; set; }
    public List<CreateGoalRequest> Goals { get; set; } = [];
}

public class CreateGoalRequest
{
    public string GoalTitle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Weightage { get; set; } = 1.0m;
}

public class SubmitSelfAssessmentRequest
{
    public decimal SelfRating { get; set; }
    public string SelfComments { get; set; } = string.Empty;
    public Dictionary<int, decimal>? GoalScores { get; set; }
}

public class SubmitManagerReviewRequest
{
    public decimal ManagerRating { get; set; }
    public string ManagerComments { get; set; } = string.Empty;
    public Dictionary<int, decimal>? GoalScores { get; set; }
}

public class FinalizeReviewRequest
{
    public decimal FinalRating { get; set; }
    public string HRComments { get; set; } = string.Empty;
}
