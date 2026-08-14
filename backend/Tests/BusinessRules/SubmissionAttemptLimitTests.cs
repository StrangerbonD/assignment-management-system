using FluentAssertions;
using Xunit;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Exceptions;
using AssignmentSystem.Api.Services.Implementations;
using AssignmentSystem.Tests.TestHelpers;

namespace AssignmentSystem.Tests.BusinessRules;

public class SubmissionAttemptLimitTests
{
    [Fact]
    public async Task UpdateSubmission_ShouldThrowBusinessRuleException_WhenAttemptLimitExceeded()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(UpdateSubmission_ShouldThrowBusinessRuleException_WhenAttemptLimitExceeded));

        var student = new User { Id = 1, FullName = "Student One", Email = "student1@test.com", Role = UserRole.Student, ClassId = 1 };
        var subject = new Subject { Id = 10, Name = "Data Structures", ClassId = 1 };
        var assignment = new Assignment
        {
            Id = 100,
            Title = "Binary Trees",
            Description = "Implement binary search tree",
            MaxMarks = 100,
            Deadline = DateTime.UtcNow.AddDays(5),
            MaxSubmissionAttempts = 2, // Maximum 2 attempts
            Status = AssignmentStatus.Published,
            SubjectId = subject.Id,
            CreatedBy = 2
        };

        var submission = new Submission
        {
            Id = 500,
            AssignmentId = assignment.Id,
            StudentId = student.Id,
            AnswerText = "Initial attempt",
            AttemptCount = 2, // Already reached maximum allowed attempts (2)
            Status = SubmissionStatus.Submitted,
            SubmittedAt = DateTime.UtcNow.AddDays(-1)
        };

        context.Users.Add(student);
        context.Subjects.Add(subject);
        context.Assignments.Add(assignment);
        context.Submissions.Add(submission);
        await context.SaveChangesAsync();

        var service = new SubmissionService(context);
        var updateDto = new UpdateSubmissionDto("Third attempt text", null);

        // Act
        Func<Task> act = async () => await service.UpdateSubmissionAsync(submission.Id, updateDto, student);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*maximum allowed submission attempts*");
    }
}
