using System;
using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.Api.Dtos;

public record RequestEnrollmentDto(
    [Required] int SubjectId
);

public record EnrollmentDto(
    int Id,
    int StudentId,
    string StudentName,
    string StudentEmail,
    string? StudentIdRoll,
    string? StudentClassName,
    int SubjectId,
    string SubjectName,
    string SubjectClassName,
    bool IsApproved,
    DateTime RequestedAt,
    DateTime? ApprovedAt
);
