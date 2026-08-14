using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Exceptions;
using AssignmentSystem.Api.Services.Interfaces;

namespace AssignmentSystem.Api.Services.Implementations;

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserDto>> GetAllUsersAsync(UserRole? roleFilter = null, int? classIdFilter = null)
    {
        var query = _context.Users
            .AsNoTracking()
            .Include(u => u.Class)
            .Include(u => u.TeacherSubjects)
                .ThenInclude(ts => ts.Subject)
                    .ThenInclude(s => s.Class)
            .AsQueryable();

        if (roleFilter.HasValue)
        {
            query = query.Where(u => u.Role == roleFilter.Value);
        }

        if (classIdFilter.HasValue)
        {
            query = query.Where(u => u.ClassId == classIdFilter.Value);
        }

        var users = await query.OrderBy(u => u.FullName).ToListAsync();

        return users.Select(MapToUserDto).ToList();
    }

    public async Task<UserDto> GetUserByIdAsync(int id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Class)
            .Include(u => u.TeacherSubjects)
                .ThenInclude(ts => ts.Subject)
                    .ThenInclude(s => s.Class)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        return MapToUserDto(user);
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
    {
        var existingEmail = await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (existingEmail)
        {
            throw new BusinessRuleException("A user with this email already exists.");
        }

        if (dto.Role == UserRole.Student && (!dto.ClassId.HasValue || !await _context.Classes.AnyAsync(c => c.Id == dto.ClassId.Value)))
        {
            throw new BusinessRuleException("Students must be assigned to a valid class.");
        }

        var user = new User
        {
            StudentId = dto.Role == UserRole.Student ? dto.StudentId?.Trim() : null,
            IdCardUrl = dto.IdCardUrl?.Trim(),
            IsApproved = true,
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            ClassId = dto.Role == UserRole.Student ? dto.ClassId : null
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<UserDto> RegisterStudentAsync(RegisterStudentDto dto)
    {
        var existingEmail = await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (existingEmail)
        {
            throw new BusinessRuleException("A user with this email already exists.");
        }

        if (!await _context.Classes.AnyAsync(c => c.Id == dto.ClassId))
        {
            throw new BusinessRuleException("Selected class/semester does not exist.");
        }

        if (string.IsNullOrWhiteSpace(dto.IdCardUrl))
        {
            throw new BusinessRuleException("Student ID Card photo proof is required before submitting your registration.");
        }

        var user = new User
        {
            StudentId = dto.StudentId.Trim(),
            IdCardUrl = dto.IdCardUrl?.Trim(),
            IsApproved = false, // Must be approved by Admin!
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.Student,
            ClassId = dto.ClassId
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<UserDto> ApproveUserAsync(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        user.IsApproved = true;
        await _context.SaveChangesAsync();

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<UserDto> ResetPasswordAsync(int id, string newPassword)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _context.SaveChangesAsync();

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<UserDto> UpdateUserAsync(int id, UpdateUserDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        var existingEmail = await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower() && u.Id != id);
        if (existingEmail)
        {
            throw new BusinessRuleException("A user with this email already exists.");
        }

        if (dto.Role == UserRole.Student && (!dto.ClassId.HasValue || !await _context.Classes.AnyAsync(c => c.Id == dto.ClassId.Value)))
        {
            throw new BusinessRuleException("Students must be assigned to a valid class.");
        }

        user.StudentId = dto.Role == UserRole.Student ? dto.StudentId?.Trim() : null;
        user.IdCardUrl = dto.IdCardUrl?.Trim();
        user.IsApproved = dto.IsApproved;
        user.FullName = dto.FullName.Trim();
        user.Email = dto.Email.Trim().ToLower();
        user.Role = dto.Role;

        if (dto.Role == UserRole.Student && dto.ClassId.HasValue)
        {
            var newClassId = dto.ClassId.Value;
            if (user.ClassId != newClassId)
            {
                // Purge prior enrollments from previous primary class when student moves to a new class
                var priorEnrollments = await _context.StudentSubjectEnrollments
                    .Where(se => se.StudentId == id)
                    .ToListAsync();

                if (priorEnrollments.Any())
                {
                    _context.StudentSubjectEnrollments.RemoveRange(priorEnrollments);
                }
            }

            user.ClassId = newClassId;
            user.Class = await _context.Classes.FirstOrDefaultAsync(c => c.Id == newClassId);
        }
        else
        {
            user.ClassId = null;
            user.Class = null;
        }

        await _context.SaveChangesAsync();

        return await GetUserByIdAsync(user.Id);
    }

    public async Task DeleteUserAsync(int id)
    {
        var user = await _context.Users
            .Include(u => u.TeacherSubjects)
            .Include(u => u.CreatedAssignments)
            .Include(u => u.Submissions)
            .Include(u => u.GradedSubmissions)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        // Conflict check for delete operation
        if (user.TeacherSubjects.Any() || user.CreatedAssignments.Any() || user.Submissions.Any() || user.GradedSubmissions.Any())
        {
            throw new ConflictException("Cannot delete user because they have active teaching assignments, created assignments, or student submissions associated with them.");
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
    }

    private static UserDto MapToUserDto(User u) => new(
        Id: u.Id,
        StudentId: u.StudentId,
        IdCardUrl: u.IdCardUrl,
        IsApproved: u.IsApproved,
        FullName: u.FullName,
        Email: u.Email,
        Role: u.Role,
        ClassId: u.ClassId,
        ClassName: u.Class?.Name,
        AssignedSubjects: u.TeacherSubjects?.Select(ts => new TeacherSubjectDto(
            ts.Id,
            ts.SubjectId,
            ts.Subject?.Name ?? string.Empty,
            ts.Subject?.ClassId ?? 0,
            ts.Subject?.Class?.Name ?? string.Empty
        )).ToList()
    );
}
