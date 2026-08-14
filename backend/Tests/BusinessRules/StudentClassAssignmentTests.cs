using FluentAssertions;
using Xunit;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Services.Implementations;
using AssignmentSystem.Tests.TestHelpers;

namespace AssignmentSystem.Tests.BusinessRules;

public class StudentClassAssignmentTests
{
    [Fact]
    public async Task UpdateUser_ShouldPurgeObsoleteRetakeEnrollments_WhenStudentClassChanges()
    {
        // Arrange
        using var context = DbContextMock.CreateInMemoryDbContext(nameof(UpdateUser_ShouldPurgeObsoleteRetakeEnrollments_WhenStudentClassChanges));

        var class1 = new Class { Id = 1, Name = "CSE 1st Year 1st Semester" };
        var class2 = new Class { Id = 2, Name = "CSE 1st Year 2nd Semester" };
        var class3 = new Class { Id = 3, Name = "CSE 2nd Year 1st Semester" };

        var subject1 = new Subject { Id = 10, Name = "Course 1", ClassId = class1.Id };
        var subject2 = new Subject { Id = 20, Name = "Course 2", ClassId = class2.Id };

        // Student initially in Class 2 (CSE 1st Year 2nd Semester)
        var student = new User
        {
            Id = 50,
            FullName = "Promoted Student",
            Email = "promoted@test.com",
            Role = UserRole.Student,
            ClassId = class2.Id,
            IsApproved = true
        };

        // Student had retake request for Class 1 (Subject 10)
        var retakeEnrollment = new StudentSubjectEnrollment
        {
            Id = 100,
            StudentId = student.Id,
            SubjectId = subject1.Id,
            IsApproved = true
        };

        context.Classes.AddRange(class1, class2, class3);
        context.Subjects.AddRange(subject1, subject2);
        context.Users.Add(student);
        context.StudentSubjectEnrollments.Add(retakeEnrollment);
        await context.SaveChangesAsync();

        var service = new UserService(context);

        // Act - Transfer student to Class 1 (CSE 1st Year 1st Semester)
        // Now subject1 belongs to Class 1, so retake enrollment for subject1 is obsolete and must be purged!
        var updateDto = new UpdateUserDto(
            StudentId: "24CSE050",
            IdCardUrl: null,
            IsApproved: true,
            FullName: "Promoted Student",
            Email: "promoted@test.com",
            Role: UserRole.Student,
            ClassId: class1.Id
        );

        var updatedUser = await service.UpdateUserAsync(student.Id, updateDto);

        // Assert
        updatedUser.ClassId.Should().Be(class1.Id);

        // Obsolete retake enrollment for subject1 should be purged because subject1 is now in student's primary class
        var remainingEnrollments = context.StudentSubjectEnrollments.Where(e => e.StudentId == student.Id).ToList();
        remainingEnrollments.Should().BeEmpty();
    }
}
