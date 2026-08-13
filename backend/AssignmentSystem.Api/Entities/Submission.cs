using System.ComponentModel.DataAnnotations;
using AssignmentSystem.Api.Enums;

namespace AssignmentSystem.Api.Entities;

public class Submission
{
    public int Id { get; set; }

    public int AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;

    public int StudentId { get; set; }
    public User Student { get; set; } = null!;

    [Required]
    public string AnswerText { get; set; } = string.Empty;

    public string? FileUrl { get; set; }

    public int AttemptCount { get; set; } = 1;

    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

    public int? Marks { get; set; }

    public string? Feedback { get; set; }

    public int? GradedBy { get; set; }
    public User? Grader { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? GradedAt { get; set; }
}
