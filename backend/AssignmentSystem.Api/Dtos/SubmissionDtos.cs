using System.ComponentModel.DataAnnotations;
using AssignmentSystem.Api.Enums;

namespace AssignmentSystem.Api.Dtos;

public record CreateSubmissionDto(
    [Required] int AssignmentId,
    [Required] string AnswerText,
    [Url] string? FileUrl
);

public record UpdateSubmissionDto(
    [Required] string AnswerText,
    [Url] string? FileUrl
);

public record GradeSubmissionDto(
    [Required][Range(0, 1000)] int Marks,
    string? Feedback
);

public record SubmissionDto(
    int Id,
    int AssignmentId,
    string AssignmentTitle,
    int MaxMarks,
    DateTime Deadline,
    int StudentId,
    string StudentName,
    string StudentEmail,
    string AnswerText,
    string? FileUrl,
    int AttemptCount,
    int MaxSubmissionAttempts,
    int RemainingAttempts,
    SubmissionStatus Status,
    int? Marks,
    string? Feedback,
    int? GradedBy,
    string? GraderName,
    DateTime SubmittedAt,
    DateTime? GradedAt
);
