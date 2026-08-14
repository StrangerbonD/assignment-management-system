using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Exceptions;
using AssignmentSystem.Api.Services.Interfaces;

namespace AssignmentSystem.Api.Services.Implementations;

public class AssignmentService : IAssignmentService
{
    private readonly AppDbContext _context;

    public AssignmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AssignmentDto>> GetAssignmentsForUserAsync(User currentUser)
    {
        var query = _context.Assignments
            .Include(a => a.Subject)
                .ThenInclude(s => s.Class)
            .Include(a => a.Subject)
                .ThenInclude(s => s.TeacherSubjects)
                    .ThenInclude(ts => ts.Teacher)
            .Include(a => a.Creator)
            .Include(a => a.Submissions)
            .AsQueryable();

        if (currentUser.Role == UserRole.Student)
        {
            if (!currentUser.ClassId.HasValue)
            {
                return new List<AssignmentDto>();
            }

            var approvedRetakeSubjectIds = await _context.StudentSubjectEnrollments
                .Include(e => e.Subject)
                .Where(e => e.StudentId == currentUser.Id && e.IsApproved && e.Subject.ClassId < currentUser.ClassId.Value)
                .Select(e => e.SubjectId)
                .ToListAsync();

            // Student Rule: Only assignments for student's primary ClassId OR approved retake subjects from lower semesters & Status = Published
            query = query.Where(a => (a.Subject.ClassId == currentUser.ClassId.Value || approvedRetakeSubjectIds.Contains(a.SubjectId)) && a.Status == AssignmentStatus.Published);
        }
        else if (currentUser.Role == UserRole.Teacher)
        {
            // Teacher Rule: Assignments belonging to subjects the teacher is assigned to
            var teacherSubjectIds = await _context.TeacherSubjects
                .Where(ts => ts.TeacherId == currentUser.Id)
                .Select(ts => ts.SubjectId)
                .ToListAsync();

            query = query.Where(a => teacherSubjectIds.Contains(a.SubjectId));
        }
        // Admin gets all assignments without restriction

        var list = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return list.Select(MapToAssignmentDto).ToList();
    }

    public async Task<AssignmentDto> GetAssignmentByIdAsync(int id, User currentUser)
    {
        var assignment = await _context.Assignments
            .Include(a => a.Subject)
                .ThenInclude(s => s.Class)
            .Include(a => a.Subject)
                .ThenInclude(s => s.TeacherSubjects)
                    .ThenInclude(ts => ts.Teacher)
            .Include(a => a.Creator)
            .Include(a => a.Submissions)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assignment == null)
        {
            throw new NotFoundException("Assignment not found.");
        }

        // Resource-level authorization checks
        if (currentUser.Role == UserRole.Student)
        {
            if (assignment.Status != AssignmentStatus.Published)
            {
                throw new UnauthorizedAccessException("Students cannot view draft assignments.");
            }

            if (assignment.Subject.ClassId != currentUser.ClassId)
            {
                throw new UnauthorizedAccessException("Students cannot view assignments belonging to other classes.");
            }
        }
        else if (currentUser.Role == UserRole.Teacher)
        {
            var isAssignedToSubject = await _context.TeacherSubjects
                .AnyAsync(ts => ts.TeacherId == currentUser.Id && ts.SubjectId == assignment.SubjectId);

            if (!isAssignedToSubject)
            {
                throw new UnauthorizedAccessException("Teachers cannot view assignments for subjects they are not assigned to.");
            }
        }

        return MapToAssignmentDto(assignment);
    }

    public async Task<AssignmentDto> CreateAssignmentAsync(CreateAssignmentDto dto, int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        if (user.Role == UserRole.Teacher)
        {
            // Teacher Subject Ownership Check
            var isAssignedToSubject = await _context.TeacherSubjects
                .AnyAsync(ts => ts.TeacherId == userId && ts.SubjectId == dto.SubjectId);

            if (!isAssignedToSubject)
            {
                throw new UnauthorizedAccessException("You can only create assignments for subjects you are assigned to teach.");
            }
        }

        if (dto.MaxMarks <= 0)
        {
            throw new BusinessRuleException("MaxMarks must be greater than zero.");
        }

        var assignment = new Assignment
        {
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            AttachmentUrl = dto.AttachmentUrl?.Trim(),
            Deadline = dto.Deadline.ToUniversalTime(),
            MaxMarks = dto.MaxMarks,
            MaxSubmissionAttempts = dto.MaxSubmissionAttempts > 0 ? dto.MaxSubmissionAttempts : 2,
            Status = dto.Status,
            SubjectId = dto.SubjectId,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        return await GetAssignmentByIdAsync(assignment.Id, user);
    }

    public async Task<AssignmentDto> UpdateAssignmentAsync(int id, UpdateAssignmentDto dto, int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        var assignment = await _context.Assignments
            .Include(a => a.Subject)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assignment == null)
        {
            throw new NotFoundException("Assignment not found.");
        }

        if (user.Role == UserRole.Teacher)
        {
            // Resource-level subject check
            var isAssignedToSubject = await _context.TeacherSubjects
                .AnyAsync(ts => ts.TeacherId == userId && ts.SubjectId == assignment.SubjectId);

            if (!isAssignedToSubject)
            {
                throw new UnauthorizedAccessException("You can only update assignments for subjects you are assigned to teach.");
            }
        }

        if (dto.MaxMarks <= 0)
        {
            throw new BusinessRuleException("MaxMarks must be greater than zero.");
        }

        assignment.Title = dto.Title.Trim();
        assignment.Description = dto.Description.Trim();
        assignment.AttachmentUrl = dto.AttachmentUrl?.Trim();
        assignment.Deadline = dto.Deadline.ToUniversalTime();
        assignment.MaxMarks = dto.MaxMarks;
        assignment.MaxSubmissionAttempts = dto.MaxSubmissionAttempts > 0 ? dto.MaxSubmissionAttempts : 2;
        assignment.Status = dto.Status;

        await _context.SaveChangesAsync();

        return await GetAssignmentByIdAsync(assignment.Id, user);
    }

    public async Task DeleteAssignmentAsync(int id, User currentUser)
    {
        var assignment = await _context.Assignments
            .Include(a => a.Submissions)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assignment == null)
        {
            throw new NotFoundException("Assignment not found.");
        }

        if (currentUser.Role == UserRole.Teacher)
        {
            var isAssignedToSubject = await _context.TeacherSubjects
                .AnyAsync(ts => ts.TeacherId == currentUser.Id && ts.SubjectId == assignment.SubjectId);

            if (!isAssignedToSubject)
            {
                throw new UnauthorizedAccessException("You can only delete assignments for subjects you are assigned to teach.");
            }
        }

        if (assignment.Submissions.Any())
        {
            throw new ConflictException("Cannot delete assignment because student submissions have already been submitted for it.");
        }

        _context.Assignments.Remove(assignment);
        await _context.SaveChangesAsync();
    }

    private static AssignmentDto MapToAssignmentDto(Assignment a)
    {
        var assignedTeacherName = a.Subject?.TeacherSubjects?.FirstOrDefault()?.Teacher?.FullName;
        var displayTeacherName = !string.IsNullOrWhiteSpace(assignedTeacherName)
            ? assignedTeacherName
            : (a.Creator?.FullName ?? string.Empty);

        return new(
            Id: a.Id,
            Title: a.Title,
            Description: a.Description,
            AttachmentUrl: a.AttachmentUrl,
            Deadline: a.Deadline,
            MaxMarks: a.MaxMarks,
            MaxSubmissionAttempts: a.MaxSubmissionAttempts > 0 ? a.MaxSubmissionAttempts : 2,
            Status: a.Status,
            SubjectId: a.SubjectId,
            SubjectName: a.Subject?.Name ?? string.Empty,
            ClassId: a.Subject?.ClassId ?? 0,
            ClassName: a.Subject?.Class?.Name ?? string.Empty,
            CreatedBy: a.CreatedBy,
            CreatorName: displayTeacherName,
            CreatedAt: a.CreatedAt,
            IsOverdue: DateTime.UtcNow > a.Deadline,
            TotalSubmissionsCount: a.Submissions?.Count ?? 0,
            GradedSubmissionsCount: a.Submissions?.Count(s => s.Status == SubmissionStatus.Graded) ?? 0
        );
    }
}
