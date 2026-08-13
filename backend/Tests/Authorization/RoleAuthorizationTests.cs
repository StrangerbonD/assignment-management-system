using FluentAssertions;
using Xunit;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Exceptions;
using AssignmentSystem.Api.Services.Implementations;
using AssignmentSystem.Tests.TestHelpers;

namespace AssignmentSystem.Tests.Authorization;

public class RoleAuthorizationTests
{
    [Fact]
    public async Task GetAssignmentById_ShouldThrowUnauthorized_WhenStudentAttemptsToViewDraftAssignment()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(GetAssignmentById_ShouldThrowUnauthorized_WhenStudentAttemptsToViewDraftAssignment));

        var class10 = new Class { Id = 10, Name = "Physics Class" };
        var student = new User { Id = 1, FullName = "Student", Email = "student@test.com", Role = UserRole.Student, ClassId = 10 };
        var teacher = new User { Id = 2, FullName = "Teacher", Email = "teacher@test.com", Role = UserRole.Teacher };
        var subject = new Subject { Id = 100, Name = "Physics", ClassId = 10 };

        var draftAssignment = new Assignment
        {
            Id = 999,
            Title = "Draft Physics Quiz",
            Description = "Work in progress",
            Deadline = DateTime.UtcNow.AddDays(5),
            MaxMarks = 50,
            Status = AssignmentStatus.Draft, // DRAFT STATUS
            SubjectId = subject.Id,
            CreatedBy = teacher.Id
        };

        context.Classes.Add(class10);
        context.Users.AddRange(student, teacher);
        context.Subjects.Add(subject);
        context.Assignments.Add(draftAssignment);
        await context.SaveChangesAsync();

        var assignmentService = new AssignmentService(context);

        // Act
        Func<Task> act = async () => await assignmentService.GetAssignmentByIdAsync(draftAssignment.Id, student);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*cannot view draft assignments*");
    }

    [Fact]
    public async Task GetAssignmentsForUser_ShouldExcludeDrafts_WhenCalledByStudent()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(GetAssignmentsForUser_ShouldExcludeDrafts_WhenCalledByStudent));

        var class10 = new Class { Id = 10, Name = "Physics Class" };
        var student = new User { Id = 1, FullName = "Student", Email = "student@test.com", Role = UserRole.Student, ClassId = 10 };
        var teacher = new User { Id = 2, FullName = "Teacher", Email = "teacher@test.com", Role = UserRole.Teacher };
        var subject = new Subject { Id = 100, Name = "Physics", ClassId = 10 };

        var draftAssignment = new Assignment
        {
            Id = 1,
            Title = "Draft Assignment",
            Description = "Draft",
            Deadline = DateTime.UtcNow.AddDays(5),
            MaxMarks = 50,
            Status = AssignmentStatus.Draft,
            SubjectId = subject.Id,
            CreatedBy = teacher.Id
        };

        var publishedAssignment = new Assignment
        {
            Id = 2,
            Title = "Published Assignment",
            Description = "Published",
            Deadline = DateTime.UtcNow.AddDays(5),
            MaxMarks = 50,
            Status = AssignmentStatus.Published,
            SubjectId = subject.Id,
            CreatedBy = teacher.Id
        };

        context.Classes.Add(class10);
        context.Users.AddRange(student, teacher);
        context.Subjects.Add(subject);
        context.Assignments.AddRange(draftAssignment, publishedAssignment);
        await context.SaveChangesAsync();

        var assignmentService = new AssignmentService(context);

        // Act
        var result = await assignmentService.GetAssignmentsForUserAsync(student);

        // Assert
        result.Should().HaveCount(1);
        result.First().Id.Should().Be(publishedAssignment.Id);
        result.First().Title.Should().Be("Published Assignment");
    }
}
