using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Exceptions;
using AssignmentSystem.Api.Services.Interfaces;

namespace AssignmentSystem.Api.Services.Implementations;

public class EnrollmentService : IEnrollmentService
{
    private readonly AppDbContext _context;

    public EnrollmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<EnrollmentDto> RequestEnrollmentAsync(int studentId, int subjectId)
    {
        var student = await _context.Users
            .Include(u => u.Class)
            .FirstOrDefaultAsync(u => u.Id == studentId);

        if (student == null)
        {
            throw new NotFoundException("Student not found.");
        }

        var subject = await _context.Subjects
            .Include(s => s.Class)
            .FirstOrDefaultAsync(s => s.Id == subjectId);

        if (subject == null)
        {
            throw new NotFoundException("Subject not found.");
        }

        // Strict Academic Rule: Students can ONLY apply for backlog or retake courses from LOWER semester classes
        int GetClassYear(string? className)
        {
            if (string.IsNullOrWhiteSpace(className)) return 0;
            if (className.Contains("1st Year")) return 1;
            if (className.Contains("2nd Year")) return 2;
            if (className.Contains("3rd Year")) return 3;
            if (className.Contains("4th Year")) return 4;
            return 0;
        }

        int subjectYear = GetClassYear(subject.Class?.Name);
        int studentYear = GetClassYear(student.Class?.Name);

        bool isCurrentOrUpper = (subjectYear > 0 && studentYear > 0)
            ? (subjectYear >= studentYear)
            : (subject.ClassId >= student.ClassId);

        if (isCurrentOrUpper)
        {
            throw new BusinessRuleException("Students can only apply for backlog or retake courses from lower semester classes than their current enrolled class.");
        }

        // Check if request already exists
        var existing = await _context.StudentSubjectEnrollments
            .FirstOrDefaultAsync(se => se.StudentId == studentId && se.SubjectId == subjectId);

        if (existing != null)
        {
            if (existing.IsApproved)
            {
                throw new BusinessRuleException("You are already approved and enrolled in this backlog/retake course.");
            }
            throw new BusinessRuleException("You already have a pending retake enrollment request for this course awaiting Teacher approval.");
        }

        var enrollment = new StudentSubjectEnrollment
        {
            StudentId = studentId,
            SubjectId = subjectId,
            IsApproved = false,
            RequestedAt = DateTime.UtcNow
        };

        _context.StudentSubjectEnrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        return MapToDto(enrollment, student, subject);
    }

    public async Task<List<EnrollmentDto>> GetStudentEnrollmentsAsync(int studentId)
    {
        var enrollments = await _context.StudentSubjectEnrollments
            .Include(se => se.Student)
                .ThenInclude(u => u.Class)
            .Include(se => se.Subject)
                .ThenInclude(s => s.Class)
            .Where(se => se.StudentId == studentId)
            .OrderByDescending(se => se.RequestedAt)
            .ToListAsync();

        return enrollments.Select(se => MapToDto(se, se.Student, se.Subject)).ToList();
    }

    public async Task<List<EnrollmentDto>> GetTeacherPendingEnrollmentsAsync(int teacherId)
    {
        // Get all subjects taught by this teacher
        var teacherSubjectIds = await _context.TeacherSubjects
            .Where(ts => ts.TeacherId == teacherId)
            .Select(ts => ts.SubjectId)
            .ToListAsync();

        var enrollments = await _context.StudentSubjectEnrollments
            .Include(se => se.Student)
                .ThenInclude(u => u.Class)
            .Include(se => se.Subject)
                .ThenInclude(s => s.Class)
            .Where(se => teacherSubjectIds.Contains(se.SubjectId) && !se.IsApproved)
            .OrderByDescending(se => se.RequestedAt)
            .ToListAsync();

        return enrollments.Select(se => MapToDto(se, se.Student, se.Subject)).ToList();
    }

    public async Task<EnrollmentDto> ApproveEnrollmentAsync(int teacherId, int enrollmentId)
    {
        var enrollment = await _context.StudentSubjectEnrollments
            .Include(se => se.Student)
                .ThenInclude(u => u.Class)
            .Include(se => se.Subject)
                .ThenInclude(s => s.Class)
            .FirstOrDefaultAsync(se => se.Id == enrollmentId);

        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment request not found.");
        }

        // Verify teacher teaches this subject
        var teachesSubject = await _context.TeacherSubjects
            .AnyAsync(ts => ts.TeacherId == teacherId && ts.SubjectId == enrollment.SubjectId);

        if (!teachesSubject)
        {
            throw new BusinessRuleException("You do not have permission to approve enrollments for this subject.");
        }

        enrollment.IsApproved = true;
        enrollment.ApprovedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToDto(enrollment, enrollment.Student, enrollment.Subject);
    }

    public async Task RejectEnrollmentAsync(int teacherId, int enrollmentId)
    {
        var enrollment = await _context.StudentSubjectEnrollments
            .FirstOrDefaultAsync(se => se.Id == enrollmentId);

        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment request not found.");
        }

        var teachesSubject = await _context.TeacherSubjects
            .AnyAsync(ts => ts.TeacherId == teacherId && ts.SubjectId == enrollment.SubjectId);

        if (!teachesSubject)
        {
            throw new BusinessRuleException("You do not have permission to reject enrollments for this subject.");
        }

        _context.StudentSubjectEnrollments.Remove(enrollment);
        await _context.SaveChangesAsync();
    }

    private static EnrollmentDto MapToDto(StudentSubjectEnrollment se, User student, Subject subject)
    {
        return new EnrollmentDto(
            se.Id,
            se.StudentId,
            student.FullName,
            student.Email,
            student.StudentId,
            student.Class?.Name,
            se.SubjectId,
            subject.Name,
            subject.Class?.Name ?? "",
            se.IsApproved,
            se.RequestedAt,
            se.ApprovedAt
        );
    }
}
