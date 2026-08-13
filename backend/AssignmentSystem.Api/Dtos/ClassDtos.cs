using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.Api.Dtos;

public record CreateClassDto(
    [Required][MaxLength(100)] string Name
);

public record ClassDto(
    int Id,
    string Name,
    int StudentCount,
    int SubjectCount
);
