using System.ComponentModel.DataAnnotations;
using AssignmentSystem.Api.Enums;

namespace AssignmentSystem.Api.Entities;

public class User
{
    public int Id { get; set; }

    [MaxLength(50)]
    public string? StudentId { get; set; }

    public string? IdCardUrl { get; set; }

    public bool IsApproved { get; set; } = true;

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public int? ClassId { get; set; }
    public Class? Class { get; set; }

    public ICollection<TeacherSubject> TeacherSubjects { get; set; } = new List<TeacherSubject>();
    public ICollection<Assignment> CreatedAssignments { get; set; } = new List<Assignment>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    public ICollection<Submission> GradedSubmissions { get; set; } = new List<Submission>();
}
