using AssignmentSystem.Api.Dtos;

namespace AssignmentSystem.Api.Services.Interfaces;

public interface IClassSubjectService
{
    // Classes
    Task<List<ClassDto>> GetAllClassesAsync();
    Task<ClassDto> GetClassByIdAsync(int id);
    Task<ClassDto> CreateClassAsync(CreateClassDto dto);
    Task DeleteClassAsync(int id);

    // Subjects
    Task<List<SubjectDto>> GetAllSubjectsAsync(int? classId = null);
    Task<SubjectDto> GetSubjectByIdAsync(int id);
    Task<SubjectDto> CreateSubjectAsync(CreateSubjectDto dto);
    Task DeleteSubjectAsync(int id);

    // TeacherSubject Assignments
    Task<TeacherSubjectDto> AssignTeacherToSubjectAsync(AssignTeacherDto dto);
    Task UnassignTeacherFromSubjectAsync(int teacherSubjectId);
    Task<List<TeacherSubjectDto>> GetTeacherSubjectsAsync(int teacherId);

    // Course Marksheet & Grade Summary
    Task<CourseMarksheetDto> GetCourseMarksheetAsync(int subjectId);
}
