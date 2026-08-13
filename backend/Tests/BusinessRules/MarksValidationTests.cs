using FluentAssertions;
using Xunit;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Exceptions;
using AssignmentSystem.Api.Services.Implementations;
using AssignmentSystem.Tests.TestHelpers;

namespace AssignmentSystem.Tests.BusinessRules;

public class MarksValidationTests
{
    [Fact]
    public async Task GradeSubmission_ShouldThrowException_WhenMarksExceedMaxMarks()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(GradeSubmission_ShouldThrowException_WhenMarksExceedMaxMarks));
        
        var teacher = new User { Id = 10, FullName = "Teacher", Email = "t@test.com", Role = UserRole.Teacher };
        var student = new User { Id = 20, FullName = "Student", Email = "s@test.com", Role = UserRole.Student, ClassId = 1 };
        var cls = new Class { Id = 1, Name = "CS101" };
        var subject = new Subject { Id = 100, Name = "Web Dev", ClassId = 1 };
        var teacherSubject = new TeacherSubject { Id = 1, TeacherId = teacher.Id, SubjectId = subject.Id };
        
        var assignment = new Assignment
        {
            Id = 50,
            Title = "Midterm Assignment",
            Description = "Test",
            MaxMarks = 50, // MAX MARKS IS 50
            Deadline = DateTime.UtcNow.AddDays(2),
            Status = AssignmentStatus.Published,
            SubjectId = subject.Id,
            CreatedBy = teacher.Id
        };

        var submission = new Submission
        {
            Id = 1,
            AssignmentId = assignment.Id,
            StudentId = student.Id,
            AnswerText = "My Answer",
            Status = SubmissionStatus.Submitted,
            SubmittedAt = DateTime.UtcNow
        };

        context.Users.AddRange(teacher, student);
        context.Classes.Add(cls);
        context.Subjects.Add(subject);
        context.TeacherSubjects.Add(teacherSubject);
        context.Assignments.Add(assignment);
        context.Submissions.Add(submission);
        await context.SaveChangesAsync();

        var submissionService = new SubmissionService(context);
        var gradeDto = new GradeSubmissionDto(Marks: 60, Feedback: "Over max marks!"); // 60 > 50

        // Act
        Func<Task> act = async () => await submissionService.GradeSubmissionAsync(submission.Id, gradeDto, teacher);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*cannot exceed the assignment's maximum marks*");
    }

    [Fact]
    public async Task GradeSubmission_ShouldSucceed_WhenMarksAreWithinMaxMarksLimit()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(GradeSubmission_ShouldSucceed_WhenMarksAreWithinMaxMarksLimit));
        
        var teacher = new User { Id = 10, FullName = "Teacher", Email = "t@test.com", Role = UserRole.Teacher };
        var student = new User { Id = 20, FullName = "Student", Email = "s@test.com", Role = UserRole.Student, ClassId = 1 };
        var cls = new Class { Id = 1, Name = "CS101" };
        var subject = new Subject { Id = 100, Name = "Web Dev", ClassId = 1 };
        var teacherSubject = new TeacherSubject { Id = 1, TeacherId = teacher.Id, SubjectId = subject.Id };
        
        var assignment = new Assignment
        {
            Id = 50,
            Title = "Midterm Assignment",
            Description = "Test",
            MaxMarks = 50,
            Deadline = DateTime.UtcNow.AddDays(2),
            Status = AssignmentStatus.Published,
            SubjectId = subject.Id,
            CreatedBy = teacher.Id
        };

        var submission = new Submission
        {
            Id = 1,
            AssignmentId = assignment.Id,
            StudentId = student.Id,
            AnswerText = "My Answer",
            Status = SubmissionStatus.Submitted,
            SubmittedAt = DateTime.UtcNow
        };

        context.Users.AddRange(teacher, student);
        context.Classes.Add(cls);
        context.Subjects.Add(subject);
        context.TeacherSubjects.Add(teacherSubject);
        context.Assignments.Add(assignment);
        context.Submissions.Add(submission);
        await context.SaveChangesAsync();

        var submissionService = new SubmissionService(context);
        var gradeDto = new GradeSubmissionDto(Marks: 45, Feedback: "Great job!"); // 45 <= 50

        // Act
        var result = await submissionService.GradeSubmissionAsync(submission.Id, gradeDto, teacher);

        // Assert
        result.Should().NotBeNull();
        result.Marks.Should().Be(45);
        result.Status.Should().Be(SubmissionStatus.Graded);
        result.Feedback.Should().Be("Great job!");
    }
}
