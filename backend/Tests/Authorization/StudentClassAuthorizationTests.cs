using FluentAssertions;
using Xunit;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Services.Implementations;
using AssignmentSystem.Tests.TestHelpers;

namespace AssignmentSystem.Tests.Authorization;

public class StudentClassAuthorizationTests
{
    [Fact]
    public async Task CreateSubmission_ShouldThrowUnauthorized_WhenStudentAttemptsSubmissionForOtherClass()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(CreateSubmission_ShouldThrowUnauthorized_WhenStudentAttemptsSubmissionForOtherClass));

        var class1 = new Class { Id = 1, Name = "Class 1" };
        var class2 = new Class { Id = 2, Name = "Class 2" };

        var studentInClass1 = new User { Id = 10, FullName = "Class 1 Student", Email = "c1@test.com", Role = UserRole.Student, ClassId = 1 };
        var teacher = new User { Id = 1, FullName = "Teacher", Email = "t@test.com", Role = UserRole.Teacher };
        var class2Subject = new Subject { Id = 50, Name = "Advanced Chemistry", ClassId = 2 };

        var class2Assignment = new Assignment
        {
            Id = 500,
            Title = "Chemistry Lab Report",
            Description = "Perform test",
            Deadline = DateTime.UtcNow.AddDays(5),
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            SubjectId = class2Subject.Id,
            CreatedBy = teacher.Id
        };

        context.Classes.AddRange(class1, class2);
        context.Users.AddRange(studentInClass1, teacher);
        context.Subjects.Add(class2Subject);
        context.Assignments.Add(class2Assignment);
        await context.SaveChangesAsync();

        var submissionService = new SubmissionService(context);
        var dto = new CreateSubmissionDto(AssignmentId: class2Assignment.Id, AnswerText: "Student 1 trying to submit for Class 2", FileUrl: null);

        // Act
        Func<Task> act = async () => await submissionService.CreateSubmissionAsync(dto, studentInClass1);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*assigned to your class*");
    }

    [Fact]
    public async Task GetAssignmentById_ShouldThrowUnauthorized_WhenStudentAccessesAssignmentOfOtherClass()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(GetAssignmentById_ShouldThrowUnauthorized_WhenStudentAccessesAssignmentOfOtherClass));

        var class1 = new Class { Id = 1, Name = "Class 1" };
        var class2 = new Class { Id = 2, Name = "Class 2" };

        var studentInClass1 = new User { Id = 10, FullName = "Class 1 Student", Email = "c1@test.com", Role = UserRole.Student, ClassId = 1 };
        var teacher = new User { Id = 1, FullName = "Teacher", Email = "t@test.com", Role = UserRole.Teacher };
        var class2Subject = new Subject { Id = 50, Name = "Advanced Chemistry", ClassId = 2 };

        var class2Assignment = new Assignment
        {
            Id = 500,
            Title = "Chemistry Exam",
            Description = "Exam",
            MaxMarks = 100,
            Deadline = DateTime.UtcNow.AddDays(5),
            Status = AssignmentStatus.Published,
            SubjectId = class2Subject.Id,
            CreatedBy = teacher.Id
        };

        context.Classes.AddRange(class1, class2);
        context.Users.AddRange(studentInClass1, teacher);
        context.Subjects.Add(class2Subject);
        context.Assignments.Add(class2Assignment);
        await context.SaveChangesAsync();

        var assignmentService = new AssignmentService(context);

        // Act
        Func<Task> act = async () => await assignmentService.GetAssignmentByIdAsync(class2Assignment.Id, studentInClass1);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*belonging to other classes*");
    }
}
