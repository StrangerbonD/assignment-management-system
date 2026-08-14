using FluentAssertions;
using Xunit;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Services.Implementations;
using AssignmentSystem.Tests.TestHelpers;

namespace AssignmentSystem.Tests.BusinessRules;

public class OneCourseOneTeacherPolicyTests
{
    [Fact]
    public async Task AssignTeacherToSubject_ShouldReplacePreviousTeacher_EnforcingOneTeacherPerCourse()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(AssignTeacherToSubject_ShouldReplacePreviousTeacher_EnforcingOneTeacherPerCourse));

        var cls = new Class { Id = 1, Name = "CSE 1st Year 1st Semester" };
        var subject = new Subject { Id = 50, Name = "Database Management Systems", ClassId = cls.Id };

        var oldTeacher = new User { Id = 100, FullName = "Old Teacher", Email = "old@test.com", Role = UserRole.Teacher, IsApproved = true };
        var newTeacher = new User { Id = 200, FullName = "New Teacher", Email = "new@test.com", Role = UserRole.Teacher, IsApproved = true };

        var existingAssignment = new TeacherSubject { Id = 1, TeacherId = oldTeacher.Id, SubjectId = subject.Id };

        context.Classes.Add(cls);
        context.Subjects.Add(subject);
        context.Users.AddRange(oldTeacher, newTeacher);
        context.TeacherSubjects.Add(existingAssignment);
        await context.SaveChangesAsync();

        var service = new ClassSubjectService(context);

        // Act - Assign new teacher to the subject
        var assignDto = new AssignTeacherDto(TeacherId: newTeacher.Id, SubjectId: subject.Id);
        var result = await service.AssignTeacherToSubjectAsync(assignDto);

        // Assert
        result.Should().NotBeNull();
        result.SubjectId.Should().Be(subject.Id);
        
        var teacherSubjects = context.TeacherSubjects.Where(ts => ts.SubjectId == subject.Id).ToList();
        teacherSubjects.Should().HaveCount(1); // Exactly 1 assigned teacher
        teacherSubjects.First().TeacherId.Should().Be(newTeacher.Id); // Old teacher replaced by new teacher
    }
}
