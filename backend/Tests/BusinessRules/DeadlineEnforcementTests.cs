using FluentAssertions;
using Xunit;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Exceptions;
using AssignmentSystem.Api.Services.Implementations;
using AssignmentSystem.Tests.TestHelpers;

namespace AssignmentSystem.Tests.BusinessRules;

public class DeadlineEnforcementTests
{
    [Fact]
    public async Task CreateSubmission_ShouldThrowException_WhenSubmittedAfterDeadline()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(CreateSubmission_ShouldThrowException_WhenSubmittedAfterDeadline));
        
        var student = new User { Id = 5, FullName = "Late Student", Email = "late@test.com", Role = UserRole.Student, ClassId = 1 };
        var cls = new Class { Id = 1, Name = "CS101" };
        var subject = new Subject { Id = 10, Name = "Database Systems", ClassId = 1 };
        
        var expiredAssignment = new Assignment
        {
            Id = 100,
            Title = "Expired Quiz",
            Description = "Already closed",
            Deadline = DateTime.UtcNow.AddDays(-1), // DEADLINE WAS YESTERDAY
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            SubjectId = subject.Id,
            CreatedBy = 1
        };

        context.Users.Add(student);
        context.Classes.Add(cls);
        context.Subjects.Add(subject);
        context.Assignments.Add(expiredAssignment);
        await context.SaveChangesAsync();

        var submissionService = new SubmissionService(context);
        var dto = new CreateSubmissionDto(AssignmentId: expiredAssignment.Id, AnswerText: "My late answer", FileUrl: null);

        // Act
        Func<Task> act = async () => await submissionService.CreateSubmissionAsync(dto, student);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*deadline has passed*");
    }

    [Fact]
    public async Task UpdateSubmission_ShouldThrowException_WhenUpdatedAfterDeadline()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(UpdateSubmission_ShouldThrowException_WhenUpdatedAfterDeadline));
        
        var student = new User { Id = 5, FullName = "Student", Email = "s@test.com", Role = UserRole.Student, ClassId = 1 };
        var cls = new Class { Id = 1, Name = "CS101" };
        var subject = new Subject { Id = 10, Name = "Database Systems", ClassId = 1 };
        
        var expiredAssignment = new Assignment
        {
            Id = 100,
            Title = "Expired Assignment",
            Description = "Closed",
            Deadline = DateTime.UtcNow.AddDays(-1), // DEADLINE PASSED
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            SubjectId = subject.Id,
            CreatedBy = 1
        };

        var submission = new Submission
        {
            Id = 50,
            AssignmentId = expiredAssignment.Id,
            StudentId = student.Id,
            AnswerText = "Initial Submission",
            Status = SubmissionStatus.Submitted,
            SubmittedAt = DateTime.UtcNow.AddDays(-2)
        };

        context.Users.Add(student);
        context.Classes.Add(cls);
        context.Subjects.Add(subject);
        context.Assignments.Add(expiredAssignment);
        context.Submissions.Add(submission);
        await context.SaveChangesAsync();

        var submissionService = new SubmissionService(context);
        var updateDto = new UpdateSubmissionDto(AnswerText: "Attempting edit post-deadline", FileUrl: null);

        // Act
        Func<Task> act = async () => await submissionService.UpdateSubmissionAsync(submission.Id, updateDto, student);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*read-only*");
    }
}
