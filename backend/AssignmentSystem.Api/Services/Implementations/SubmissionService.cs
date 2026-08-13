using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Exceptions;
using AssignmentSystem.Api.Services.Interfaces;

namespace AssignmentSystem.Api.Services.Implementations;

public class SubmissionService : ISubmissionService
{
    private readonly AppDbContext _context;

    public SubmissionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<SubmissionDto>> GetSubmissionsForUserAsync(User currentUser)
    {
        var query = _context.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .Include(s => s.Grader)
            .AsQueryable();

        if (currentUser.Role == UserRole.Student)
        {
            query = query.Where(s => s.StudentId == currentUser.Id);
        }
        else if (currentUser.Role == UserRole.Teacher)
        {
            var teacherSubjectIds = await _context.TeacherSubjects
                .Where(ts => ts.TeacherId == currentUser.Id)
                .Select(ts => ts.SubjectId)
                .ToListAsync();

            query = query.Where(s => teacherSubjectIds.Contains(s.Assignment.SubjectId) || s.Assignment.CreatedBy == currentUser.Id);
        }

        var list = await query.OrderByDescending(s => s.SubmittedAt).ToListAsync();
        return list.Select(MapToSubmissionDto).ToList();
    }

    public async Task<List<SubmissionDto>> GetSubmissionsForAssignmentAsync(int assignmentId, User currentUser)
    {
        var assignment = await _context.Assignments
            .Include(a => a.Subject)
            .FirstOrDefaultAsync(a => a.Id == assignmentId);

        if (assignment == null)
        {
            throw new NotFoundException("Assignment not found.");
        }

        if (currentUser.Role == UserRole.Teacher)
        {
            var isAssigned = await _context.TeacherSubjects
                .AnyAsync(ts => ts.TeacherId == currentUser.Id && ts.SubjectId == assignment.SubjectId);

            var isCreator = assignment.CreatedBy == currentUser.Id;

            if (!isAssigned && !isCreator)
            {
                throw new UnauthorizedAccessException("Teachers can only view submissions for subjects they are assigned to teach.");
            }
        }

        var query = _context.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .Include(s => s.Grader)
            .Where(s => s.AssignmentId == assignmentId);

        if (currentUser.Role == UserRole.Student)
        {
            query = query.Where(s => s.StudentId == currentUser.Id);
        }

        var list = await query.OrderByDescending(s => s.SubmittedAt).ToListAsync();
        return list.Select(MapToSubmissionDto).ToList();
    }

    public async Task<SubmissionDto> GetSubmissionByIdAsync(int id, User currentUser)
    {
        var submission = await _context.Submissions
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Subject)
            .Include(s => s.Student)
            .Include(s => s.Grader)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null)
        {
            throw new NotFoundException("Submission not found.");
        }

        // Authorization checks
        if (currentUser.Role == UserRole.Student && submission.StudentId != currentUser.Id)
        {
            throw new UnauthorizedAccessException("Students cannot view submissions of other students.");
        }
        else if (currentUser.Role == UserRole.Teacher)
        {
            var isAssigned = await _context.TeacherSubjects
                .AnyAsync(ts => ts.TeacherId == currentUser.Id && ts.SubjectId == submission.Assignment.SubjectId);

            if (!isAssigned)
            {
                throw new UnauthorizedAccessException("Teachers can only view submissions for subjects they are assigned to teach.");
            }
        }

        return MapToSubmissionDto(submission);
    }

    public async Task<SubmissionDto> CreateSubmissionAsync(CreateSubmissionDto dto, User student)
    {
        if (student.Role != UserRole.Student)
        {
            throw new BusinessRuleException("Only students can submit assignments.");
        }

        var assignment = await _context.Assignments
            .Include(a => a.Subject)
            .FirstOrDefaultAsync(a => a.Id == dto.AssignmentId);

        if (assignment == null)
        {
            throw new NotFoundException("Assignment not found.");
        }

        // Business Rule: Student Class Scope Check
        if (student.ClassId != assignment.Subject.ClassId)
        {
            throw new UnauthorizedAccessException("You can only submit answers for assignments assigned to your class.");
        }

        // Business Rule: Published Assignment Only
        if (assignment.Status != AssignmentStatus.Published)
        {
            throw new BusinessRuleException("Cannot submit answer for a draft assignment.");
        }

        // Business Rule: Deadline Enforcement
        if (DateTime.UtcNow > assignment.Deadline)
        {
            throw new BusinessRuleException("Submission deadline has passed. Submissions are closed.");
        }

        // Check if student already submitted
        var existingSubmission = await _context.Submissions
            .FirstOrDefaultAsync(s => s.AssignmentId == dto.AssignmentId && s.StudentId == student.Id);

        if (existingSubmission != null)
        {
            throw new BusinessRuleException("You have already submitted an answer for this assignment. Please use update/resubmit endpoint instead.");
        }

        var submission = new Submission
        {
            AssignmentId = dto.AssignmentId,
            StudentId = student.Id,
            AnswerText = dto.AnswerText.Trim(),
            FileUrl = string.IsNullOrWhiteSpace(dto.FileUrl) ? null : dto.FileUrl.Trim(),
            AttemptCount = 1,
            Status = SubmissionStatus.Submitted,
            SubmittedAt = DateTime.UtcNow
        };

        _context.Submissions.Add(submission);
        await _context.SaveChangesAsync();

        return await GetSubmissionByIdAsync(submission.Id, student);
    }

    public async Task<SubmissionDto> UpdateSubmissionAsync(int id, UpdateSubmissionDto dto, User student)
    {
        var submission = await _context.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null)
        {
            throw new NotFoundException("Submission not found.");
        }

        if (submission.StudentId != student.Id)
        {
            throw new UnauthorizedAccessException("You can only update your own submissions.");
        }

        // Business Rule: Deadline Enforcement for updates
        if (DateTime.UtcNow > submission.Assignment.Deadline)
        {
            throw new BusinessRuleException("Submission deadline has passed. Submissions are now read-only.");
        }

        // Business Rule: Submission Attempt Limit Check
        var maxAttempts = submission.Assignment.MaxSubmissionAttempts > 0 ? submission.Assignment.MaxSubmissionAttempts : 2;
        if (submission.AttemptCount >= maxAttempts)
        {
            throw new BusinessRuleException($"You have reached the maximum allowed submission attempts ({maxAttempts}) for this assignment.");
        }

        // Update submission: increment attempt count and overwrite previous answer/file directly
        submission.AttemptCount += 1;
        submission.AnswerText = dto.AnswerText.Trim();
        submission.FileUrl = string.IsNullOrWhiteSpace(dto.FileUrl) ? null : dto.FileUrl.Trim();
        submission.SubmittedAt = DateTime.UtcNow;
        if (submission.Status != SubmissionStatus.Graded)
        {
            submission.Status = SubmissionStatus.Submitted;
        }

        await _context.SaveChangesAsync();

        return await GetSubmissionByIdAsync(submission.Id, student);
    }

    public async Task<SubmissionDto> GradeSubmissionAsync(int id, GradeSubmissionDto dto, User teacher)
    {
        var submission = await _context.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null)
        {
            throw new NotFoundException("Submission not found.");
        }

        // Teacher Subject Ownership Check
        var isAssignedToSubject = await _context.TeacherSubjects
            .AnyAsync(ts => ts.TeacherId == teacher.Id && ts.SubjectId == submission.Assignment.SubjectId);

        var isCreator = submission.Assignment.CreatedBy == teacher.Id;

        if (!isAssignedToSubject && !isCreator)
        {
            throw new UnauthorizedAccessException("You can only grade submissions for subjects you are assigned to teach.");
        }

        // Business Rule: Marks Limit Rule (Marks <= MaxMarks)
        if (dto.Marks < 0)
        {
            throw new BusinessRuleException("Marks cannot be negative.");
        }

        if (dto.Marks > submission.Assignment.MaxMarks)
        {
            throw new BusinessRuleException($"Marks ({dto.Marks}) cannot exceed the assignment's maximum marks ({submission.Assignment.MaxMarks}).");
        }

        submission.Marks = dto.Marks;
        submission.Feedback = string.IsNullOrWhiteSpace(dto.Feedback) ? null : dto.Feedback.Trim();
        submission.GradedBy = teacher.Id;
        submission.Status = SubmissionStatus.Graded;
        submission.GradedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetSubmissionByIdAsync(submission.Id, teacher);
    }

    private static SubmissionDto MapToSubmissionDto(Submission s)
    {
        var maxAttempts = s.Assignment?.MaxSubmissionAttempts > 0 ? s.Assignment.MaxSubmissionAttempts : 2;
        var attemptCount = s.AttemptCount > 0 ? s.AttemptCount : 1;
        var remainingAttempts = Math.Max(0, maxAttempts - attemptCount);

        return new SubmissionDto(
            Id: s.Id,
            AssignmentId: s.AssignmentId,
            AssignmentTitle: s.Assignment?.Title ?? string.Empty,
            MaxMarks: s.Assignment?.MaxMarks ?? 0,
            Deadline: s.Assignment?.Deadline ?? DateTime.MinValue,
            StudentId: s.StudentId,
            StudentName: s.Student?.FullName ?? string.Empty,
            StudentEmail: s.Student?.Email ?? string.Empty,
            AnswerText: s.AnswerText,
            FileUrl: s.FileUrl,
            AttemptCount: attemptCount,
            MaxSubmissionAttempts: maxAttempts,
            RemainingAttempts: remainingAttempts,
            Status: s.Status,
            Marks: s.Marks,
            Feedback: s.Feedback,
            GradedBy: s.GradedBy,
            GraderName: s.Grader?.FullName,
            SubmittedAt: s.SubmittedAt,
            GradedAt: s.GradedAt
        );
    }
}
