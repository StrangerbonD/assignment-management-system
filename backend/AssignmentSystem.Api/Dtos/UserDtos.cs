using System.ComponentModel.DataAnnotations;
using AssignmentSystem.Api.Enums;

namespace AssignmentSystem.Api.Dtos;

public record CreateUserDto(
    string? StudentId,
    string? IdCardUrl,
    [Required][MaxLength(100)] string FullName,
    [Required][EmailAddress][MaxLength(150)] string Email,
    [Required][MinLength(4)] string Password,
    [Required] UserRole Role,
    int? ClassId
);

public record UpdateUserDto(
    string? StudentId,
    string? IdCardUrl,
    bool IsApproved,
    [Required][MaxLength(100)] string FullName,
    [Required][EmailAddress][MaxLength(150)] string Email,
    [Required] UserRole Role,
    int? ClassId
);

public record ResetPasswordDto(
    [Required][MinLength(4)] string NewPassword
);

public record UserDto(
    int Id,
    string? StudentId,
    string? IdCardUrl,
    bool IsApproved,
    string FullName,
    string Email,
    UserRole Role,
    int? ClassId,
    string? ClassName,
    List<TeacherSubjectDto>? AssignedSubjects
);
