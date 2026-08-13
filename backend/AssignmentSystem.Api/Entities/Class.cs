using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.Api.Entities;

public class Class
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public ICollection<User> Students { get; set; } = new List<User>();
    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
}
