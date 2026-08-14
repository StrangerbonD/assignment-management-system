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

            // Schema column migrations
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Assignments\" ADD COLUMN IF NOT EXISTS \"AttachmentUrl\" text NULL;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Assignments\" ADD COLUMN IF NOT EXISTS \"MaxSubmissionAttempts\" integer NOT NULL DEFAULT 2;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Submissions\" ADD COLUMN IF NOT EXISTS \"AttemptCount\" integer NOT NULL DEFAULT 1;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"StudentId\" text NULL;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"IdCardUrl\" text NULL;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"IsApproved\" boolean NOT NULL DEFAULT TRUE;");
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "Database schema check warning: {Message}", ex.Message);
        }

        // 1. Seed 8 Academic Semesters (Classes)
        async Task<Class> EnsureClass(string name)
        {
            var existing = await context.Classes.FirstOrDefaultAsync(c => c.Name == name);
            if (existing == null)
            {
                existing = new Class { Name = name };
                await context.Classes.AddAsync(existing);
                await context.SaveChangesAsync();
            }
            return existing;
        }

        var sem1 = await EnsureClass("CSE 1st Year 1st Semester");
        var sem2 = await EnsureClass("CSE 1st Year 2nd Semester");
        var sem3 = await EnsureClass("CSE 2nd Year 1st Semester");
        var sem4 = await EnsureClass("CSE 2nd Year 2nd Semester");
        var sem5 = await EnsureClass("CSE 3rd Year 1st Semester");
        var sem6 = await EnsureClass("CSE 3rd Year 2nd Semester");
        var sem7 = await EnsureClass("CSE 4th Year 1st Semester");
        var sem8 = await EnsureClass("CSE 4th Year 2nd Semester");

        // 2. Seed 16 Courses (2 per semester)
        async Task<Subject> EnsureSubject(string name, int classId)
        {
            var existing = await context.Subjects.FirstOrDefaultAsync(s => s.Name == name);
            if (existing == null)
            {
                existing = new Subject { Name = name, ClassId = classId };
                await context.Subjects.AddAsync(existing);
                await context.SaveChangesAsync();
            }
            else if (existing.ClassId != classId)
            {
                existing.ClassId = classId;
                await context.SaveChangesAsync();
            }
            return existing;
        }

        // Sem 1
        var cse101 = await EnsureSubject("CSE101: Introduction to Computer Systems", sem1.Id);
        var cse102 = await EnsureSubject("CSE102: Structured Programming", sem1.Id);

        // Sem 2
        var cse151 = await EnsureSubject("CSE151: Discrete Mathematics", sem2.Id);
        var cse152 = await EnsureSubject("CSE152: Digital Logic Design", sem2.Id);

        // Sem 3
        var cse201 = await EnsureSubject("CSE201: Object Oriented Programming", sem3.Id);
        var cse202 = await EnsureSubject("CSE202: Object Oriented Programming Lab", sem3.Id);

        // Sem 4
        var cse251 = await EnsureSubject("CSE251: Algorithm Design and Analysis", sem4.Id);
        var cse252 = await EnsureSubject("CSE252: Algorithm Design and Analysis Lab", sem4.Id);

        // Sem 5
        var cse301 = await EnsureSubject("CSE301: Computer Architecture", sem5.Id);
        var cse302 = await EnsureSubject("CSE302: Operating Systems", sem5.Id);

        // Sem 6
        var cse351 = await EnsureSubject("CSE351: Computer Networks", sem6.Id);
        var cse352 = await EnsureSubject("CSE352: Computer Networks Lab", sem6.Id);

        // Sem 7
        var cse401 = await EnsureSubject("CSE401: Artificial Intelligence", sem7.Id);
        var cse402 = await EnsureSubject("CSE402: Artificial Intelligence Lab", sem7.Id);

        // Sem 8
        var cse451 = await EnsureSubject("CSE451: Machine Learning", sem8.Id);
        var cse452 = await EnsureSubject("CSE452: Machine Learning Lab", sem8.Id);

        // 3. Helper to Seed Accounts
        async Task<User> EnsureUserExists(string email, string fullName, UserRole role, string password, int? classId, string? studentId)
        {
            var bcryptHash = BCrypt.Net.BCrypt.HashPassword(password);
            var existing = await context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            if (existing == null)
            {
                existing = new User
                {
                    StudentId = studentId,
                    IsApproved = true,
                    FullName = fullName,
                    Email = email.ToLower(),
                    PasswordHash = bcryptHash,
                    Role = role,
                    ClassId = classId
                };
                await context.Users.AddAsync(existing);
                await context.SaveChangesAsync();
            }
            else
            {
                existing.StudentId = studentId;
                existing.IsApproved = true;
                existing.PasswordHash = bcryptHash;
                existing.FullName = fullName;
                existing.Role = role;
                existing.ClassId = classId;
                await context.SaveChangesAsync();
            }
            return existing;
        }

        // Admin Account
        var admin = await EnsureUserExists("admin@cse.gstu.edu.bd", "CSE Department Head / Admin", UserRole.Admin, "12345", null, null);

        // 4 Teachers
        var t1 = await EnsureUserExists("mrinal@gmail.com", "Dr Mrinal Kanti Bawali", UserRole.Teacher, "12345", null, null);
        var t2 = await EnsureUserExists("saleh@gmail.com", "Dr Saleh Ahmed", UserRole.Teacher, "12345", null, null);
        var t3 = await EnsureUserExists("ferdous@gmail.com", "Md Ferdous", UserRole.Teacher, "12345", null, null);
        var t4 = await EnsureUserExists("abdullah@gmail.com", "Md Abdullah", UserRole.Teacher, "12345", null, null);

        // Also ensure teacher@cse.gstu.edu.bd exists for backwards compatibility
        await EnsureUserExists("teacher@cse.gstu.edu.bd", "Dr Mrinal Kanti Bawali", UserRole.Teacher, "12345", null, null);

        // 16 Students (2 per semester)
        // Sem 1 Students
        await EnsureUserExists("student10@cse.gstu.edu.bd", "Tanzim Ahmed", UserRole.Student, "12345", sem1.Id, "24CSE001");
        await EnsureUserExists("student11@cse.gstu.edu.bd", "Rafiul Islam", UserRole.Student, "12345", sem1.Id, "24CSE002");

        // Sem 2 Students
        await EnsureUserExists("student8@cse.gstu.edu.bd", "Arif Hossain", UserRole.Student, "12345", sem2.Id, "23CSE001");
        await EnsureUserExists("student9@cse.gstu.edu.bd", "Jannatul Ferdous", UserRole.Student, "12345", sem2.Id, "23CSE002");

        // Sem 3 Students
        await EnsureUserExists("student6@cse.gstu.edu.bd", "Rakib Hasan", UserRole.Student, "12345", sem3.Id, "22CSE001");
        await EnsureUserExists("student7@cse.gstu.edu.bd", "Nusrat Jahan", UserRole.Student, "12345", sem3.Id, "22CSE002");

        // Sem 4 Students
        await EnsureUserExists("student12@cse.gstu.edu.bd", "Fahim Rahman", UserRole.Student, "12345", sem4.Id, "22CSE003");
        await EnsureUserExists("student13@cse.gstu.edu.bd", "Sadia Akter", UserRole.Student, "12345", sem4.Id, "22CSE004");

        // Sem 5 Students
        await EnsureUserExists("student2@cse.gstu.edu.bd", "Iftekhar Siddiq Tanvir", UserRole.Student, "12345", sem5.Id, "21CSE036");
        await EnsureUserExists("student3@cse.gstu.edu.bd", "Masum Reza", UserRole.Student, "12345", sem5.Id, "21CSE011");

        // Sem 6 Students
        await EnsureUserExists("student4@cse.gstu.edu.bd", "Abdullah Al Mamun", UserRole.Student, "12345", sem6.Id, "21CSE001");
        await EnsureUserExists("student14@cse.gstu.edu.bd", "Mim Akter", UserRole.Student, "12345", sem6.Id, "21CSE005");

        // Sem 7 Students
        await EnsureUserExists("student@cse.gstu.edu.bd", "Bondhon Das", UserRole.Student, "12345", sem7.Id, "20CSE016");
        await EnsureUserExists("student15@cse.gstu.edu.bd", "Shakil Ahmed", UserRole.Student, "12345", sem7.Id, "20CSE020");

        // Sem 8 Students
        await EnsureUserExists("student16@cse.gstu.edu.bd", "Mehedi Hasan", UserRole.Student, "12345", sem8.Id, "20CSE025");
        await EnsureUserExists("student17@cse.gstu.edu.bd", "Sumaiya Islam", UserRole.Student, "12345", sem8.Id, "20CSE030");

        // 4. Teacher-Course Allocations
        async Task AssignTeacher(int teacherId, int subjectId)
        {
            var existing = await context.TeacherSubjects.FirstOrDefaultAsync(ts => ts.SubjectId == subjectId);
            if (existing == null)
            {
                await context.TeacherSubjects.AddAsync(new TeacherSubject { TeacherId = teacherId, SubjectId = subjectId });
            }
            else if (existing.TeacherId != teacherId)
            {
                existing.TeacherId = teacherId;
            }
            await context.SaveChangesAsync();
        }

        // Dr Mrinal Kanti Bawali
        await AssignTeacher(t1.Id, cse101.Id);
        await AssignTeacher(t1.Id, cse102.Id);
        await AssignTeacher(t1.Id, cse201.Id);
        await AssignTeacher(t1.Id, cse202.Id);

        // Dr Saleh Ahmed
        await AssignTeacher(t2.Id, cse151.Id);
        await AssignTeacher(t2.Id, cse152.Id);
        await AssignTeacher(t2.Id, cse251.Id);
        await AssignTeacher(t2.Id, cse252.Id);

        // Md Ferdous
        await AssignTeacher(t3.Id, cse301.Id);
        await AssignTeacher(t3.Id, cse302.Id);
        await AssignTeacher(t3.Id, cse351.Id);
        await AssignTeacher(t3.Id, cse352.Id);

        // Md Abdullah
        await AssignTeacher(t4.Id, cse401.Id);
        await AssignTeacher(t4.Id, cse402.Id);
        await AssignTeacher(t4.Id, cse451.Id);
        await AssignTeacher(t4.Id, cse452.Id);

        // 5. Seed 32 Assignments (2 per course)
        async Task EnsureAssignment(string title, string desc, int subjectId, int createdById)
        {
            var existing = await context.Assignments.FirstOrDefaultAsync(a => a.SubjectId == subjectId && a.Title == title);
            if (existing == null)
            {
                await context.Assignments.AddAsync(new Assignment
                {
                    Title = title,
                    Description = desc,
                    Deadline = DateTime.UtcNow.AddDays(14),
                    MaxMarks = 100,
                    MaxSubmissionAttempts = 2,
                    Status = AssignmentStatus.Published,
                    SubjectId = subjectId,
                    CreatedBy = createdById,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
        }

        // CSE101
        await EnsureAssignment("Assignment 01: Computer System Components", "Analyze hardware components, bus architecture, and system peripherals.", cse101.Id, t1.Id);
        await EnsureAssignment("Assignment 02: CPU, Memory and I/O Analysis", "Compare RISC vs CISC architecture and memory hierarchy levels.", cse101.Id, t1.Id);

        // CSE102
        await EnsureAssignment("Assignment 01: C Programming Fundamentals", "Write C programs demonstrating control flow, loops, and conditional logic.", cse102.Id, t1.Id);
        await EnsureAssignment("Assignment 02: Functions, Arrays and Pointers", "Implement dynamic memory allocation using malloc/calloc and pointer arithmetic.", cse102.Id, t1.Id);

        // CSE151
        await EnsureAssignment("Assignment 01: Set Theory and Logic", "Solve propositional logic proofs and set theory operations.", cse151.Id, t2.Id);
        await EnsureAssignment("Assignment 02: Graph Theory and Relations", "Analyze equivalence relations, Hasse diagrams, and Eulerian graphs.", cse151.Id, t2.Id);

        // CSE152
        await EnsureAssignment("Assignment 01: Boolean Algebra and Logic Gates", "Simplify Boolean expressions using Karnaugh Maps (K-Maps).", cse152.Id, t2.Id);
        await EnsureAssignment("Assignment 02: Combinational Circuit Design", "Design 4-bit Binary Adder, Multiplexer, and Decoder circuits.", cse152.Id, t2.Id);

        // CSE201
        await EnsureAssignment("Assignment 01: C++ OOP Class Hierarchy", "Design C++ classes utilizing Encapsulation, Constructor overloading, and Destructors.", cse201.Id, t1.Id);
        await EnsureAssignment("Assignment 02: Inheritance and Polymorphism", "Implement Virtual Functions, Abstract base classes, and Runtime Polymorphism.", cse201.Id, t1.Id);

        // CSE202
        await EnsureAssignment("Assignment 01: C++ Class and Object Implementation", "Build a Student Information System using C++ Classes and File I/O.", cse202.Id, t1.Id);
        await EnsureAssignment("Assignment 02: Inheritance Based Application", "Implement a Banking Account hierarchy using Inheritance and Exception Handling.", cse202.Id, t1.Id);

        // CSE251
        await EnsureAssignment("Assignment 01: Dynamic Programming and Graph Traversal", "Implement 0/1 Knapsack DP solution and Breadth-First Search (BFS).", cse251.Id, t2.Id);
        await EnsureAssignment("Assignment 02: Dijkstra and Bellman-Ford Implementation", "Compare Dijkstra's Single Source Shortest Path with Bellman-Ford Algorithm.", cse251.Id, t2.Id);

        // CSE252
        await EnsureAssignment("Assignment 01: Sorting Algorithm Comparison", "Benchmark QuickSort, MergeSort, and HeapSort time complexities in C++.", cse252.Id, t2.Id);
        await EnsureAssignment("Assignment 02: Graph Algorithm Implementation", "Implement Kruskal's Minimum Spanning Tree using Disjoint Set Union (DSU).", cse252.Id, t2.Id);

        // CSE301
        await EnsureAssignment("Assignment 01: CPU Architecture Analysis", "Analyze instruction pipeline stages, data hazards, and branch prediction.", cse301.Id, t3.Id);
        await EnsureAssignment("Assignment 02: Cache Memory Simulation", "Simulate Direct-Mapped, Set-Associative, and Fully-Associative Cache Mapping.", cse301.Id, t3.Id);

        // CSE302
        await EnsureAssignment("Assignment 01: Process Scheduling Algorithms", "Implement FCFS, SJF, Round Robin, and Priority Process Scheduling.", cse302.Id, t3.Id);
        await EnsureAssignment("Assignment 02: Deadlock Detection and Avoidance", "Implement Banker's Algorithm for Resource Allocation and Deadlock Avoidance.", cse302.Id, t3.Id);

        // CSE351
        await EnsureAssignment("Assignment 01: Socket Programming and Packet Sniffing", "Implement TCP/UDP socket server and analyze IP header structures.", cse351.Id, t3.Id);
        await EnsureAssignment("Assignment 02: Network Topology and Wireshark Analysis", "Capture TCP handshake packets using Wireshark and analyze throughput.", cse351.Id, t3.Id);

        // CSE352
        await EnsureAssignment("Assignment 01: TCP Client-Server Communication", "Build a Multi-threaded Chat Client-Server using C++ or Python sockets.", cse352.Id, t3.Id);
        await EnsureAssignment("Assignment 02: Network Configuration and Analysis", "Configure VLANs, Static Routing, and Subnetting in Cisco Packet Tracer.", cse352.Id, t3.Id);

        // CSE401
        await EnsureAssignment("Assignment 01: Search Algorithms in AI", "Compare Uninformed (BFS, DFS) vs Informed (A*, Greedy Best-First) Search.", cse401.Id, t4.Id);
        await EnsureAssignment("Assignment 02: Knowledge Representation", "Represent domain knowledge using First-Order Logic and Semantic Networks.", cse401.Id, t4.Id);

        // CSE402
        await EnsureAssignment("Assignment 01: BFS and DFS Implementation", "Implement Breadth-First Search and Depth-First Search for maze solving.", cse402.Id, t4.Id);
        await EnsureAssignment("Assignment 02: A* Search Algorithm Implementation", "Implement A* Search Algorithm using Manhattan Distance heuristic.", cse402.Id, t4.Id);

        // CSE451
        await EnsureAssignment("Assignment 01: Supervised Model Training", "Train Decision Trees, Random Forest, and Support Vector Machines (SVM).", cse451.Id, t4.Id);
        await EnsureAssignment("Assignment 02: Classification Using Machine Learning", "Evaluate Model Accuracy, Precision, Recall, F1-Score, and Confusion Matrix.", cse451.Id, t4.Id);

        // CSE452
        await EnsureAssignment("Assignment 01: Linear Regression Implementation", "Implement Linear & Polynomial Regression from scratch using NumPy.", cse452.Id, t4.Id);
        await EnsureAssignment("Assignment 02: Decision Tree Classification", "Build a Decision Tree Classifier using Python scikit-learn and plot tree diagrams.", cse452.Id, t4.Id);

        logger?.LogInformation("Database seeded successfully with 8 Semesters, 16 Courses, 4 Teachers, 16 Students, and 32 Assignments!");
    }
}
