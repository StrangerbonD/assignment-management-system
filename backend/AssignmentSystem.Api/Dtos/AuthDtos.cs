using System.ComponentModel.DataAnnotations;
using AssignmentSystem.Api.Enums;

namespace AssignmentSystem.Api.Dtos;

public record LoginRequestDto(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record RegisterStudentDto(
    [Required][MaxLength(50)] string StudentId,
    [Required][MaxLength(100)] string FullName,
    [Required][EmailAddress][MaxLength(150)] string Email,
    [Required][MinLength(6)] string Password,
    [Required] int ClassId,
    [Required(ErrorMessage = "Student ID Card photo proof is required.")] string IdCardUrl
);

public record AuthResponseDto(
    string Token,
    int Id,
    string FullName,
    string Email,
    UserRole Role,
    int? ClassId,
    string? ClassName
);

public record UserProfileDto(
    int Id,
    string FullName,
    string Email,
    UserRole Role,
    int? ClassId,
    string? ClassName
);
