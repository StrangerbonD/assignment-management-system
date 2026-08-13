using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;

namespace AssignmentSystem.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context, ILogger? logger = null)
    {
        try
        {
            await context.Database.EnsureCreatedAsync();

            // Raw SQL schema migrations for existing PostgreSQL databases
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Assignments\" ADD COLUMN IF NOT EXISTS \"AttachmentUrl\" text NULL;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Assignments\" ADD COLUMN IF NOT EXISTS \"MaxSubmissionAttempts\" integer NOT NULL DEFAULT 2;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Submissions\" ADD COLUMN IF NOT EXISTS \"AttemptCount\" integer NOT NULL DEFAULT 1;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"StudentId\" text NULL;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"IdCardUrl\" text NULL;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"IsApproved\" boolean NOT NULL DEFAULT TRUE;");
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"PostgreSQL database connection failed. Ensure PostgreSQL is running on localhost:5432 and password in appsettings.json is correct. Details: {ex.Message}", ex);
        }

        // Ensure CSE GSTU Classes (Semesters) exist
        var cseClass1 = await context.Classes.FirstOrDefaultAsync(c => c.Name == "CSE 1st Year 1st Semester");
        if (cseClass1 == null)
        {
            cseClass1 = new Class { Name = "CSE 1st Year 1st Semester" };
            await context.Classes.AddAsync(cseClass1);
        }

        var cseClass2 = await context.Classes.FirstOrDefaultAsync(c => c.Name == "CSE 2nd Year 1st Semester");
        if (cseClass2 == null)
        {
            cseClass2 = new Class { Name = "CSE 2nd Year 1st Semester" };
            await context.Classes.AddAsync(cseClass2);
        }

        var cseClass3 = await context.Classes.FirstOrDefaultAsync(c => c.Name == "CSE 3rd Year 1st Semester");
        if (cseClass3 == null)
        {
            cseClass3 = new Class { Name = "CSE 3rd Year 1st Semester" };
            await context.Classes.AddAsync(cseClass3);
        }

        var cseClass4 = await context.Classes.FirstOrDefaultAsync(c => c.Name == "CSE 4th Year 1st Semester");
        if (cseClass4 == null)
        {
            cseClass4 = new Class { Name = "CSE 4th Year 1st Semester" };
            await context.Classes.AddAsync(cseClass4);
        }

        await context.SaveChangesAsync();

        // Ensure Official GSTU CSE Course Subjects exist
        async Task<Subject> EnsureSubject(string name, int classId)
        {
            var existing = await context.Subjects.FirstOrDefaultAsync(s => s.Name == name);
            if (existing == null)
            {
                existing = new Subject { Name = name, ClassId = classId };
                await context.Subjects.AddAsync(existing);
                await context.SaveChangesAsync();
            }
            return existing;
        }

        var subOop = await EnsureSubject("CSE156: Object Oriented Programming", cseClass1.Id);
        var subOopLab = await EnsureSubject("CSE157: Object Oriented Programming Lab", cseClass1.Id);

        var subAlgo = await EnsureSubject("CSE251: Algorithm Design and Analysis", cseClass2.Id);
        var subAlgoLab = await EnsureSubject("CSE252: Algorithm Design and Analysis Lab", cseClass2.Id);

        var subNet = await EnsureSubject("CSE353: Computer Networks", cseClass3.Id);
        var subNetLab = await EnsureSubject("CSE354: Computer Networks Lab", cseClass3.Id);

        var subMl = await EnsureSubject("CSE451: Machine Learning", cseClass4.Id);
        var subMlLab = await EnsureSubject("CSE452: Machine Learning Lab", cseClass4.Id);

        // Remove old non-standard subjects if present
        var officialSubjectIds = new[] { subOop.Id, subOopLab.Id, subAlgo.Id, subAlgoLab.Id, subNet.Id, subNetLab.Id, subMl.Id, subMlLab.Id };
        var obsoleteSubjects = await context.Subjects.Where(s => !officialSubjectIds.Contains(s.Id)).ToListAsync();
        if (obsoleteSubjects.Any())
        {
            context.Subjects.RemoveRange(obsoleteSubjects);
            await context.SaveChangesAsync();
        }

        async Task EnsureUserExists(string email, string fullName, UserRole role, string password, int? classId, string? studentId)
        {
            var bcryptHash = BCrypt.Net.BCrypt.HashPassword(password);
            var existing = await context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            if (existing == null)
            {
                var newUser = new User
                {
                    StudentId = studentId,
                    IsApproved = true,
                    FullName = fullName,
                    Email = email.ToLower(),
                    PasswordHash = bcryptHash,
                    Role = role,
                    ClassId = classId
                };
                await context.Users.AddAsync(newUser);
            }
            else
            {
                existing.StudentId = studentId;
                existing.IsApproved = true;
                existing.PasswordHash = bcryptHash;
                existing.FullName = fullName;
                existing.Role = role;
                if (!existing.ClassId.HasValue && classId.HasValue)
                {
                    existing.ClassId = classId;
                }
            }
        }

        // Seed CSE GSTU Accounts with Student IDs
        await EnsureUserExists("admin@cse.gstu.edu.bd", "CSE Department Head / Admin", UserRole.Admin, "Admin123!", null, null);
        await EnsureUserExists("teacher@cse.gstu.edu.bd", "Dr. Rahman (CSE Faculty)", UserRole.Teacher, "Teacher123!", null, null);
        await EnsureUserExists("student@cse.gstu.edu.bd", "Bondhon Das", UserRole.Student, "Student123!", cseClass3.Id, "20CSE016");
        await EnsureUserExists("student2@cse.gstu.edu.bd", "Iftekhar Siddiq Tanvir", UserRole.Student, "Student123!", cseClass3.Id, "20CSE036");
        await EnsureUserExists("student3@cse.gstu.edu.bd", "Masum Reza", UserRole.Student, "Student123!", cseClass3.Id, "20CSE011");

        await context.SaveChangesAsync();

        // Explicit Raw SQL Updates for PostgreSQL
        await context.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""StudentSubjectEnrollments"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""StudentId"" INT NOT NULL REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
                ""SubjectId"" INT NOT NULL REFERENCES ""Subjects""(""Id"") ON DELETE CASCADE,
                ""IsApproved"" BOOLEAN NOT NULL DEFAULT FALSE,
                ""RequestedAt"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ""ApprovedAt"" TIMESTAMP WITH TIME ZONE NULL
            );
        ");

        await context.Database.ExecuteSqlRawAsync("UPDATE \"Users\" SET \"StudentId\" = '20CSE016', \"FullName\" = 'Bondhon Das', \"IsApproved\" = TRUE WHERE LOWER(\"Email\") = 'student@cse.gstu.edu.bd';");
        await context.Database.ExecuteSqlRawAsync("UPDATE \"Users\" SET \"StudentId\" = '20CSE036', \"FullName\" = 'Iftekhar Siddiq Tanvir', \"IsApproved\" = TRUE WHERE LOWER(\"Email\") = 'student2@cse.gstu.edu.bd';");
        await context.Database.ExecuteSqlRawAsync("UPDATE \"Users\" SET \"StudentId\" = '20CSE011', \"FullName\" = 'Masum Reza', \"IsApproved\" = TRUE WHERE LOWER(\"Email\") = 'student3@cse.gstu.edu.bd';");

        var mainTeacher = await context.Users.FirstAsync(u => u.Email == "teacher@cse.gstu.edu.bd");
        var mainStudent = await context.Users.FirstAsync(u => u.Email == "student@cse.gstu.edu.bd");

        // Purge all @school.com legacy users completely
        await context.Database.ExecuteSqlRawAsync("DELETE FROM \"TeacherSubjects\" WHERE \"TeacherId\" IN (SELECT \"Id\" FROM \"Users\" WHERE LOWER(\"Email\") LIKE '%@school.com');");
        await context.Database.ExecuteSqlRawAsync($"UPDATE \"Assignments\" SET \"CreatedBy\" = {mainTeacher.Id} WHERE \"CreatedBy\" IN (SELECT \"Id\" FROM \"Users\" WHERE LOWER(\"Email\") LIKE '%@school.com');");
        await context.Database.ExecuteSqlRawAsync($"UPDATE \"Submissions\" SET \"StudentId\" = {mainStudent.Id} WHERE \"StudentId\" IN (SELECT \"Id\" FROM \"Users\" WHERE LOWER(\"Email\") LIKE '%@school.com');");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Users\" WHERE LOWER(\"Email\") LIKE '%@school.com';");

        // Enforce 1 Course = 1 Teacher Policy: Clean up duplicate teacher allocations per subject
        await context.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""TeacherSubjects""
            WHERE ""Id"" NOT IN (
                SELECT MAX(""Id"")
                FROM ""TeacherSubjects""
                GROUP BY ""SubjectId""
            );
        ");

        // Assign Teacher to all 8 CSE courses if unassigned
        var allSubjects = new[] { subOop, subOopLab, subAlgo, subAlgoLab, subNet, subNetLab, subMl, subMlLab };
        foreach (var s in allSubjects)
        {
            if (!await context.TeacherSubjects.AnyAsync(ts => ts.SubjectId == s.Id))
            {
                await context.TeacherSubjects.AddAsync(new TeacherSubject { TeacherId = mainTeacher.Id, SubjectId = s.Id });
            }
        }
        await context.SaveChangesAsync();

        // Ensure Sample Assignments exist for CSE courses
        async Task EnsureAssignment(string title, string desc, int subjectId)
        {
            if (!await context.Assignments.AnyAsync(a => a.Title == title))
            {
                await context.Assignments.AddAsync(new Assignment
                {
                    Title = title,
                    Description = desc,
                    Deadline = DateTime.UtcNow.AddDays(7),
                    MaxMarks = 100,
                    MaxSubmissionAttempts = 2,
                    Status = AssignmentStatus.Published,
                    SubjectId = subjectId,
                    CreatedBy = mainTeacher.Id,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await EnsureAssignment("Lab Assignment 01: Socket Programming & Packet Sniffing", "Implement TCP/UDP socket server and analyze packet headers in Python or C++.", subNet.Id);
        await EnsureAssignment("Lab Assignment 02: Network Topology & Wireshark Analysis", "Capture TCP handshake packets using Wireshark and prepare a report.", subNetLab.Id);
        await EnsureAssignment("Lab Assignment 01: Supervised Model Training", "Implement Decision Trees and Logistic Regression using Python scikit-learn.", subMl.Id);
        await EnsureAssignment("Lab Assignment 01: C++ OOP Class Hierarchy & Inheritance", "Design a Banking Management System utilizing Virtual Functions and Encapsulation.", subOop.Id);
        await EnsureAssignment("Lab Assignment 01: Dynamic Programming & Graph Traversal", "Implement Dijkstra's Algorithm and Knapsack DP solution in C++.", subAlgo.Id);

        await context.SaveChangesAsync();

        logger?.LogInformation("Cleaned legacy users. CSE GSTU Student IDs (20CSE016, 20CSE036, 20CSE011) ensured successfully.");
    }
}
