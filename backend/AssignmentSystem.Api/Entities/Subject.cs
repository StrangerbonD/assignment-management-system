using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.Api.Entities;

public class Subject
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public int ClassId { get; set; }
    public Class Class { get; set; } = null!;

    public ICollection<TeacherSubject> TeacherSubjects { get; set; } = new List<TeacherSubject>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
