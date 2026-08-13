using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.Api.Dtos;

public record CreateSubjectDto(
    [Required][MaxLength(100)] string Name,
    [Required] int ClassId
);

public record AssignTeacherDto(
    [Required] int TeacherId,
    [Required] int SubjectId
);

public record SubjectDto(
    int Id,
    string Name,
    int ClassId,
    string ClassName,
    List<TeacherMiniDto> AssignedTeachers
);

public record TeacherSubjectDto(
    int Id,
    int SubjectId,
    string SubjectName,
    int ClassId,
    string ClassName
);

public record TeacherMiniDto(
    int Id,
    string FullName,
    string Email
);

public record MarksheetAssignmentHeaderDto(
    int Id,
    string Title,
    int MaxMarks,
    int SequenceNumber
);

public record StudentMarksheetRowDto(
    int StudentId,
    string StudentRegId,
    string StudentName,
    string StudentEmail,
    Dictionary<int, double?> MarksMap,
    double TotalObtainedMarks,
    double TotalMaxMarks,
    double AveragePercentage
);

public record CourseMarksheetDto(
    int SubjectId,
    string SubjectName,
    int ClassId,
    string ClassName,
    List<MarksheetAssignmentHeaderDto> Assignments,
    List<StudentMarksheetRowDto> Students
);
