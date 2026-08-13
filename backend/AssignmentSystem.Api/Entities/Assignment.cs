using System.ComponentModel.DataAnnotations;
using AssignmentSystem.Api.Enums;

namespace AssignmentSystem.Api.Entities;

public class Assignment
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public string? AttachmentUrl { get; set; }

    public DateTime Deadline { get; set; }

    public int MaxMarks { get; set; }

    public int MaxSubmissionAttempts { get; set; } = 2;

    public AssignmentStatus Status { get; set; } = AssignmentStatus.Draft;

    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public int CreatedBy { get; set; }
    public User Creator { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
