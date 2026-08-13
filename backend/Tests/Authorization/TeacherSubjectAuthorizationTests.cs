using FluentAssertions;
using Xunit;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Services.Implementations;
using AssignmentSystem.Tests.TestHelpers;

namespace AssignmentSystem.Tests.Authorization;

public class TeacherSubjectAuthorizationTests
{
    [Fact]
    public async Task CreateAssignment_ShouldThrowUnauthorized_WhenTeacherNotAssignedToSubject()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(CreateAssignment_ShouldThrowUnauthorized_WhenTeacherNotAssignedToSubject));

        var teacher = new User { Id = 2, FullName = "Unassigned Teacher", Email = "t2@test.com", Role = UserRole.Teacher };
        var subject = new Subject { Id = 10, Name = "Mathematics", ClassId = 1 };
        // Teacher is NOT added to TeacherSubjects for Subject 10

        context.Users.Add(teacher);
        context.Subjects.Add(subject);
        await context.SaveChangesAsync();

        var assignmentService = new AssignmentService(context);
        var dto = new CreateAssignmentDto(
            Title: "Math Quiz",
            Description: "Algebra",
            AttachmentUrl: null,
            Deadline: DateTime.UtcNow.AddDays(3),
            MaxMarks: 50,
            MaxSubmissionAttempts: 2,
            SubjectId: subject.Id,
            Status: AssignmentStatus.Published
        );

        // Act
        Func<Task> act = async () => await assignmentService.CreateAssignmentAsync(dto, teacher.Id);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*subjects you are assigned to teach*");
    }

    [Fact]
    public async Task GradeSubmission_ShouldThrowUnauthorized_WhenTeacherNotAssignedToSubject()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(GradeSubmission_ShouldThrowUnauthorized_WhenTeacherNotAssignedToSubject));

        var otherTeacher = new User { Id = 99, FullName = "Other Teacher", Email = "other@test.com", Role = UserRole.Teacher };
        var student = new User { Id = 5, FullName = "Student", Email = "s@test.com", Role = UserRole.Student, ClassId = 1 };
        var subject = new Subject { Id = 20, Name = "History", ClassId = 1 };

        var assignment = new Assignment
        {
            Id = 300,
            Title = "History Essay",
            Description = "WWII",
            MaxMarks = 100,
            Deadline = DateTime.UtcNow.AddDays(5),
            Status = AssignmentStatus.Published,
            SubjectId = subject.Id,
            CreatedBy = 1
        };

        var submission = new Submission
        {
            Id = 77,
            AssignmentId = assignment.Id,
            StudentId = student.Id,
            AnswerText = "My History Essay",
            Status = SubmissionStatus.Submitted
        };

        context.Users.AddRange(otherTeacher, student);
        context.Subjects.Add(subject);
        context.Assignments.Add(assignment);
        context.Submissions.Add(submission);
        await context.SaveChangesAsync();

        var submissionService = new SubmissionService(context);
        var gradeDto = new GradeSubmissionDto(Marks: 90, Feedback: "Good");

        // Act
        Func<Task> act = async () => await submissionService.GradeSubmissionAsync(submission.Id, gradeDto, otherTeacher);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*assigned to teach*");
    }
}
