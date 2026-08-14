using FluentAssertions;
using Xunit;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Exceptions;
using AssignmentSystem.Api.Services.Implementations;
using AssignmentSystem.Tests.TestHelpers;

namespace AssignmentSystem.Tests.BusinessRules;

public class LowerSemesterRetakePolicyTests
{
    [Fact]
    public async Task RequestEnrollment_ShouldThrowBusinessRuleException_WhenCourseIsNotFromLowerSemester()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(RequestEnrollment_ShouldThrowBusinessRuleException_WhenCourseIsNotFromLowerSemester));

        var class1 = new Class { Id = 1, Name = "CSE 1st Year 1st Semester" };
        var class2 = new Class { Id = 2, Name = "CSE 1st Year 2nd Semester" };
        var class3 = new Class { Id = 3, Name = "CSE 2nd Year 1st Semester" };

        // Student is enrolled in CSE 1st Year 2nd Semester (Class ID 2)
        var student = new User
        {
            Id = 10,
            FullName = "Retake Student",
            Email = "retake@test.com",
            Role = UserRole.Student,
            ClassId = class2.Id,
            IsApproved = true
        };

        // Course belonging to CSE 2nd Year 1st Semester (Class ID 3 - NOT a lower semester)
        var higherSemesterSubject = new Subject { Id = 100, Name = "Algorithms", ClassId = class3.Id };

        context.Classes.AddRange(class1, class2, class3);
        context.Users.Add(student);
        context.Subjects.Add(higherSemesterSubject);
        await context.SaveChangesAsync();

        var service = new EnrollmentService(context);

        // Act
        Func<Task> act = async () => await service.RequestEnrollmentAsync(student.Id, higherSemesterSubject.Id);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*lower semester*");
    }

    [Fact]
    public async Task RequestEnrollment_ShouldSucceed_WhenCourseIsFromLowerSemester()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(RequestEnrollment_ShouldSucceed_WhenCourseIsFromLowerSemester));

        var class1 = new Class { Id = 1, Name = "CSE 1st Year 1st Semester" };
        var class2 = new Class { Id = 2, Name = "CSE 1st Year 2nd Semester" };

        // Student is enrolled in CSE 1st Year 2nd Semester (Class ID 2)
        var student = new User
        {
            Id = 20,
            FullName = "Valid Retake Student",
            Email = "validretake@test.com",
            Role = UserRole.Student,
            ClassId = class2.Id,
            IsApproved = true
        };

        // Course belonging to CSE 1st Year 1st Semester (Class ID 1 - LOWER semester)
        var lowerSemesterSubject = new Subject { Id = 101, Name = "Structured Programming", ClassId = class1.Id };

        context.Classes.AddRange(class1, class2);
        context.Users.Add(student);
        context.Subjects.Add(lowerSemesterSubject);
        await context.SaveChangesAsync();

        var service = new EnrollmentService(context);

        // Act
        var result = await service.RequestEnrollmentAsync(student.Id, lowerSemesterSubject.Id);

        // Assert
        result.Should().NotBeNull();
        result.SubjectId.Should().Be(lowerSemesterSubject.Id);
        result.StudentId.Should().Be(student.Id);
        result.IsApproved.Should().BeFalse(); // Pending teacher approval
    }
}
