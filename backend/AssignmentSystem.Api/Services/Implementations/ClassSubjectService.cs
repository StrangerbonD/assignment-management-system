using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Exceptions;
using AssignmentSystem.Api.Services.Interfaces;

namespace AssignmentSystem.Api.Services.Implementations;

public class ClassSubjectService : IClassSubjectService
{
    private readonly AppDbContext _context;

    public ClassSubjectService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClassDto>> GetAllClassesAsync()
    {
        var classes = await _context.Classes
            .Include(c => c.Students)
            .Include(c => c.Subjects)
            .OrderBy(c => c.Name)
            .ToListAsync();

        return classes.Select(c => new ClassDto(
            Id: c.Id,
            Name: c.Name,
            StudentCount: c.Students.Count,
            SubjectCount: c.Subjects.Count
        )).ToList();
    }

    public async Task<ClassDto> GetClassByIdAsync(int id)
    {
        var c = await _context.Classes
            .Include(c => c.Students)
            .Include(c => c.Subjects)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (c == null)
        {
            throw new NotFoundException("Class not found.");
        }

        return new ClassDto(
            Id: c.Id,
            Name: c.Name,
            StudentCount: c.Students.Count,
            SubjectCount: c.Subjects.Count
        );
    }

    public async Task<ClassDto> CreateClassAsync(CreateClassDto dto)
    {
        var exists = await _context.Classes.AnyAsync(c => c.Name.ToLower() == dto.Name.ToLower());
        if (exists)
        {
            throw new BusinessRuleException("A class with this name already exists.");
        }

        var newClass = new Class { Name = dto.Name.Trim() };
        _context.Classes.Add(newClass);
        await _context.SaveChangesAsync();

        return new ClassDto(newClass.Id, newClass.Name, 0, 0);
    }

    public async Task DeleteClassAsync(int id)
    {
        var c = await _context.Classes
            .Include(c => c.Students)
            .Include(c => c.Subjects)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (c == null)
        {
            throw new NotFoundException("Class not found.");
        }

        // Conflict check
        if (c.Students.Any() || c.Subjects.Any())
        {
            throw new ConflictException("Cannot delete class because it has associated students or subjects. Please reassign or delete them first.");
        }

        _context.Classes.Remove(c);
        await _context.SaveChangesAsync();
    }

    public async Task<List<SubjectDto>> GetAllSubjectsAsync(int? classId = null)
    {
        var query = _context.Subjects
            .Include(s => s.Class)
            .Include(s => s.TeacherSubjects)
                .ThenInclude(ts => ts.Teacher)
            .AsQueryable();

        if (classId.HasValue)
        {
            query = query.Where(s => s.ClassId == classId.Value);
        }

        var subjects = await query.OrderBy(s => s.Name).ToListAsync();

        return subjects.Select(MapToSubjectDto).ToList();
    }

    public async Task<SubjectDto> GetSubjectByIdAsync(int id)
    {
        var s = await _context.Subjects
            .Include(s => s.Class)
            .Include(s => s.TeacherSubjects)
                .ThenInclude(ts => ts.Teacher)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (s == null)
        {
            throw new NotFoundException("Subject not found.");
        }

        return MapToSubjectDto(s);
    }

    public async Task<SubjectDto> CreateSubjectAsync(CreateSubjectDto dto)
    {
        var classExists = await _context.Classes.AnyAsync(c => c.Id == dto.ClassId);
        if (!classExists)
        {
            throw new BusinessRuleException("Specified class does not exist.");
        }

        var exists = await _context.Subjects.AnyAsync(s => s.ClassId == dto.ClassId && s.Name.ToLower() == dto.Name.ToLower());
        if (exists)
        {
            throw new BusinessRuleException("A subject with this name already exists in this class.");
        }

        var subject = new Subject
        {
            Name = dto.Name.Trim(),
            ClassId = dto.ClassId
        };

        _context.Subjects.Add(subject);
        await _context.SaveChangesAsync();

        return await GetSubjectByIdAsync(subject.Id);
    }

    public async Task DeleteSubjectAsync(int id)
    {
        var subject = await _context.Subjects
            .Include(s => s.TeacherSubjects)
            .Include(s => s.Assignments)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (subject == null)
        {
            throw new NotFoundException("Subject not found.");
        }

        if (subject.TeacherSubjects.Any() || subject.Assignments.Any())
        {
            throw new ConflictException("Cannot delete subject because teachers or assignments are linked to it.");
        }

        _context.Subjects.Remove(subject);
        await _context.SaveChangesAsync();
    }

    public async Task<TeacherSubjectDto> AssignTeacherToSubjectAsync(AssignTeacherDto dto)
    {
        var teacher = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.TeacherId && u.Role == UserRole.Teacher);
        if (teacher == null)
        {
            throw new BusinessRuleException("Specified user is not a valid teacher.");
        }

        var subject = await _context.Subjects.Include(s => s.Class).FirstOrDefaultAsync(s => s.Id == dto.SubjectId);
        if (subject == null)
        {
            throw new NotFoundException("Specified subject does not exist.");
        }

        // ONE COURSE = ONE TEACHER ALLOCATION POLICY:
        // Remove any existing teacher allocations for this subject so re-assigning replaces the previous teacher cleanly.
        var previousAssignments = await _context.TeacherSubjects
            .Where(ts => ts.SubjectId == dto.SubjectId)
            .ToListAsync();

        if (previousAssignments.Any())
        {
            _context.TeacherSubjects.RemoveRange(previousAssignments);
        }

        var ts = new TeacherSubject
        {
            TeacherId = dto.TeacherId,
            SubjectId = dto.SubjectId
        };

        _context.TeacherSubjects.Add(ts);
        await _context.SaveChangesAsync();

        return new TeacherSubjectDto(
            Id: ts.Id,
            SubjectId: subject.Id,
            SubjectName: subject.Name,
            ClassId: subject.ClassId,
            ClassName: subject.Class.Name
        );
    }

    public async Task UnassignTeacherFromSubjectAsync(int teacherSubjectId)
    {
        var ts = await _context.TeacherSubjects.FirstOrDefaultAsync(x => x.Id == teacherSubjectId);
        if (ts == null)
        {
            throw new NotFoundException("Teacher-subject assignment not found.");
        }

        _context.TeacherSubjects.Remove(ts);
        await _context.SaveChangesAsync();
    }

    public async Task<List<TeacherSubjectDto>> GetTeacherSubjectsAsync(int teacherId)
    {
        var list = await _context.TeacherSubjects
            .Include(ts => ts.Subject)
                .ThenInclude(s => s.Class)
            .Where(ts => ts.TeacherId == teacherId)
            .ToListAsync();

        return list.Select(ts => new TeacherSubjectDto(
            Id: ts.Id,
            SubjectId: ts.SubjectId,
            SubjectName: ts.Subject.Name,
            ClassId: ts.Subject.ClassId,
            ClassName: ts.Subject.Class.Name
        )).ToList();
    }

    private static SubjectDto MapToSubjectDto(Subject s)
    {
        // Enforce One Course = One Teacher Allocation Policy: Take at most 1 latest assigned teacher
        var latestTeacher = s.TeacherSubjects
            .OrderByDescending(ts => ts.Id)
            .Take(1)
            .Select(ts => new TeacherMiniDto(
                Id: ts.Teacher.Id,
                FullName: ts.Teacher.FullName,
                Email: ts.Teacher.Email
            ))
            .ToList();

        return new SubjectDto(
            Id: s.Id,
            Name: s.Name,
            ClassId: s.ClassId,
            ClassName: s.Class?.Name ?? string.Empty,
            AssignedTeachers: latestTeacher
        );
    }

    public async Task<CourseMarksheetDto> GetCourseMarksheetAsync(int subjectId)
    {
        var subject = await _context.Subjects
            .Include(s => s.Class)
            .FirstOrDefaultAsync(s => s.Id == subjectId);

        if (subject == null)
        {
            throw new NotFoundException("Subject not found.");
        }

        // 1. Get published assignments for this subject ordered chronologically
        var assignments = await _context.Assignments
            .Where(a => a.SubjectId == subjectId && a.Status == AssignmentStatus.Published)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync();

        var assignmentHeaders = assignments.Select((a, idx) => new MarksheetAssignmentHeaderDto(
            Id: a.Id,
            Title: a.Title,
            MaxMarks: a.MaxMarks,
            SequenceNumber: idx + 1
        )).ToList();

        var assignmentIds = assignments.Select(a => a.Id).ToList();

        // 2. Get all enrolled students (Primary Class students + Approved Retake students)
        var primaryStudents = await _context.Users
            .Where(u => u.Role == UserRole.Student && u.IsApproved && u.ClassId == subject.ClassId)
            .ToListAsync();

        var retakeStudentIds = await _context.StudentSubjectEnrollments
            .Where(se => se.SubjectId == subjectId && se.IsApproved)
            .Select(se => se.StudentId)
            .ToListAsync();

        var retakeStudents = await _context.Users
            .Where(u => u.Role == UserRole.Student && u.IsApproved && retakeStudentIds.Contains(u.Id))
            .ToListAsync();

        var allEnrolledStudents = primaryStudents
            .Concat(retakeStudents)
            .GroupBy(u => u.Id)
            .Select(g => g.First())
            .OrderBy(u => u.StudentId ?? u.FullName)
            .ToList();

        // 3. Get all submissions for these assignments
        var submissions = await _context.Submissions
            .Where(s => assignmentIds.Contains(s.AssignmentId) && s.Marks.HasValue)
            .ToListAsync();

        var studentRows = new List<StudentMarksheetRowDto>();

        foreach (var student in allEnrolledStudents)
        {
            var marksMap = new Dictionary<int, double?>();
            double totalObtained = 0;
            double totalMax = 0;

            foreach (var a in assignments)
            {
                var sub = submissions.FirstOrDefault(s => s.AssignmentId == a.Id && s.StudentId == student.Id);
                if (sub != null && sub.Marks.HasValue)
                {
                    marksMap[a.Id] = sub.Marks.Value;
                    totalObtained += sub.Marks.Value;
                }
                else
                {
                    marksMap[a.Id] = null;
                }
                totalMax += a.MaxMarks;
            }

            double avgPercentage = totalMax > 0 ? Math.Round((totalObtained / totalMax) * 100, 2) : 0;

            studentRows.Add(new StudentMarksheetRowDto(
                StudentId: student.Id,
                StudentRegId: student.StudentId ?? "-",
                StudentName: student.FullName,
                StudentEmail: student.Email,
                MarksMap: marksMap,
                TotalObtainedMarks: Math.Round(totalObtained, 2),
                TotalMaxMarks: totalMax,
                AveragePercentage: avgPercentage
            ));
        }

        return new CourseMarksheetDto(
            SubjectId: subject.Id,
            SubjectName: subject.Name,
            ClassId: subject.ClassId,
            ClassName: subject.Class?.Name ?? string.Empty,
            Assignments: assignmentHeaders,
            Students: studentRows
        );
    }
}
