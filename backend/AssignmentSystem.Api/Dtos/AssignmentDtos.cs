using System.ComponentModel.DataAnnotations;
using AssignmentSystem.Api.Enums;

namespace AssignmentSystem.Api.Dtos;

public record CreateAssignmentDto(
    [Required][MaxLength(200)] string Title,
    [Required] string Description,
    string? AttachmentUrl,
    [Required] DateTime Deadline,
    [Required][Range(1, 1000)] int MaxMarks,
    [Range(1, 10)] int MaxSubmissionAttempts,
    [Required] int SubjectId,
    [Required] AssignmentStatus Status
);

public record UpdateAssignmentDto(
    [Required][MaxLength(200)] string Title,
    [Required] string Description,
    string? AttachmentUrl,
    [Required] DateTime Deadline,
    [Required][Range(1, 1000)] int MaxMarks,
    [Range(1, 10)] int MaxSubmissionAttempts,
    [Required] AssignmentStatus Status
);

public record AssignmentDto(
    int Id,
    string Title,
    string Description,
    string? AttachmentUrl,
    DateTime Deadline,
    int MaxMarks,
    int MaxSubmissionAttempts,
    AssignmentStatus Status,
    int SubjectId,
    string SubjectName,
    int ClassId,
    string ClassName,
    int CreatedBy,
    string CreatorName,
    DateTime CreatedAt,
    bool IsOverdue,
    int TotalSubmissionsCount,
    int GradedSubmissionsCount
);
