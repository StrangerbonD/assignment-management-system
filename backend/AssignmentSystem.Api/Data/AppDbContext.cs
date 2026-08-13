using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Entities;

namespace AssignmentSystem.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<TeacherSubject> TeacherSubjects => Set<TeacherSubject>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<StudentSubjectEnrollment> StudentSubjectEnrollments => Set<StudentSubjectEnrollment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();

            entity.HasOne(u => u.Class)
                .WithMany(c => c.Students)
                .HasForeignKey(u => u.ClassId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Class Configuration
        modelBuilder.Entity<Class>(entity =>
        {
            entity.HasIndex(c => c.Name).IsUnique();
        });

        // Subject Configuration
        modelBuilder.Entity<Subject>(entity =>
        {
            entity.HasOne(s => s.Class)
                .WithMany(c => c.Subjects)
                .HasForeignKey(s => s.ClassId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TeacherSubject Junction Table Configuration
        modelBuilder.Entity<TeacherSubject>(entity =>
        {
            entity.HasIndex(ts => new { ts.TeacherId, ts.SubjectId }).IsUnique();

            entity.HasOne(ts => ts.Teacher)
                .WithMany(u => u.TeacherSubjects)
                .HasForeignKey(ts => ts.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ts => ts.Subject)
                .WithMany(s => s.TeacherSubjects)
                .HasForeignKey(ts => ts.SubjectId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // StudentSubjectEnrollment Configuration
        modelBuilder.Entity<StudentSubjectEnrollment>(entity =>
        {
            entity.HasIndex(se => new { se.StudentId, se.SubjectId }).IsUnique();

            entity.HasOne(se => se.Student)
                .WithMany()
                .HasForeignKey(se => se.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(se => se.Subject)
                .WithMany()
                .HasForeignKey(se => se.SubjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Assignment Configuration
        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.Property(a => a.Status).HasConversion<string>();

            entity.HasOne(a => a.Subject)
                .WithMany(s => s.Assignments)
                .HasForeignKey(a => a.SubjectId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.Creator)
                .WithMany(u => u.CreatedAssignments)
                .HasForeignKey(a => a.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Submission Configuration
        modelBuilder.Entity<Submission>(entity =>
        {
            entity.HasIndex(s => new { s.AssignmentId, s.StudentId }).IsUnique();
            entity.Property(s => s.Status).HasConversion<string>();

            entity.HasOne(s => s.Assignment)
                .WithMany(a => a.Submissions)
                .HasForeignKey(s => s.AssignmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.Student)
                .WithMany(u => u.Submissions)
                .HasForeignKey(s => s.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.Grader)
                .WithMany(u => u.GradedSubmissions)
                .HasForeignKey(s => s.GradedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
