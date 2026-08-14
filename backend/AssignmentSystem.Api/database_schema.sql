-- =============================================================================
-- Assignment & Submission Management System
-- PostgreSQL Database Creation & Seed Data Script
-- Department of Computer Science & Engineering (CSE)
-- =============================================================================

-- 1. Create AcademicClasses Table
CREATE TABLE IF NOT EXISTS "AcademicClasses" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL
);

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" SERIAL PRIMARY KEY,
    "StudentId" VARCHAR(50) NULL,
    "FullName" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(150) NOT NULL UNIQUE,
    "PasswordHash" TEXT NOT NULL,
    "Role" INT NOT NULL, -- 0: Admin, 1: Teacher, 2: Student
    "ClassId" INT NULL REFERENCES "AcademicClasses"("Id") ON DELETE SET NULL,
    "IdCardUrl" TEXT NULL,
    "IsApproved" BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Create Subjects Table
CREATE TABLE IF NOT EXISTS "Subjects" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(150) NOT NULL,
    "ClassId" INT NOT NULL REFERENCES "AcademicClasses"("Id") ON DELETE CASCADE
);

-- 4. Create TeacherSubjects Table (1 Subject = 1 Assigned Teacher)
CREATE TABLE IF NOT EXISTS "TeacherSubjects" (
    "Id" SERIAL PRIMARY KEY,
    "TeacherId" INT NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "SubjectId" INT NOT NULL UNIQUE REFERENCES "Subjects"("Id") ON DELETE CASCADE
);

-- 5. Create Assignments Table
CREATE TABLE IF NOT EXISTS "Assignments" (
    "Id" SERIAL PRIMARY KEY,
    "Title" VARCHAR(200) NOT NULL,
    "Description" TEXT NOT NULL,
    "AttachmentUrl" TEXT NULL,
    "Deadline" TIMESTAMP WITH TIME ZONE NOT NULL,
    "MaxMarks" INT NOT NULL DEFAULT 100,
    "MaxSubmissionAttempts" INT NOT NULL DEFAULT 2,
    "Status" INT NOT NULL DEFAULT 1, -- 0: Draft, 1: Published, 2: Closed
    "SubjectId" INT NOT NULL REFERENCES "Subjects"("Id") ON DELETE CASCADE,
    "CreatedBy" INT NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Submissions Table
CREATE TABLE IF NOT EXISTS "Submissions" (
    "Id" SERIAL PRIMARY KEY,
    "AssignmentId" INT NOT NULL REFERENCES "Assignments"("Id") ON DELETE CASCADE,
    "StudentId" INT NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "AnswerText" TEXT NOT NULL,
    "FileUrl" TEXT NULL,
    "AttemptCount" INT NOT NULL DEFAULT 1,
    "Status" INT NOT NULL DEFAULT 0, -- 0: Submitted, 1: Graded
    "Marks" INT NULL,
    "Feedback" TEXT NULL,
    "GradedBy" INT NULL REFERENCES "Users"("Id") ON DELETE SET NULL,
    "SubmittedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "GradedAt" TIMESTAMP WITH TIME ZONE NULL
);

-- 7. Create StudentSubjectEnrollments Table (Retake Applications)
CREATE TABLE IF NOT EXISTS "StudentSubjectEnrollments" (
    "Id" SERIAL PRIMARY KEY,
    "StudentId" INT NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "SubjectId" INT NOT NULL REFERENCES "Subjects"("Id") ON DELETE CASCADE,
    "IsApproved" BOOLEAN NOT NULL DEFAULT FALSE,
    "RequestedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ApprovedAt" TIMESTAMP WITH TIME ZONE NULL
);

-- =============================================================================
-- Seed Initial Demo Accounts & Academic Data
-- =============================================================================

-- Seed 8 Semesters
INSERT INTO "AcademicClasses" ("Id", "Name") VALUES 
(1, 'CSE 1st Year 1st Semester'),
(2, 'CSE 1st Year 2nd Semester'),
(3, 'CSE 2nd Year 1st Semester'),
(4, 'CSE 2nd Year 2nd Semester'),
(5, 'CSE 3rd Year 1st Semester'),
(6, 'CSE 3rd Year 2nd Semester'),
(7, 'CSE 4th Year 1st Semester'),
(8, 'CSE 4th Year 2nd Semester')
ON CONFLICT ("Id") DO NOTHING;

-- Seed Admin (Password: 12345)
INSERT INTO "Users" ("Id", "StudentId", "FullName", "Email", "PasswordHash", "Role", "ClassId", "IsApproved") VALUES
(1, NULL, 'CSE Department Head / Admin', 'admin@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 0, NULL, TRUE)
ON CONFLICT ("Id") DO NOTHING;

-- Seed 4 Teachers (Password: 12345)
INSERT INTO "Users" ("Id", "StudentId", "FullName", "Email", "PasswordHash", "Role", "ClassId", "IsApproved") VALUES
(2, NULL, 'Dr Mrinal Kanti Bawali', 'mrinal@gmail.com', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 1, NULL, TRUE),
(3, NULL, 'Dr Saleh Ahmed', 'saleh@gmail.com', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 1, NULL, TRUE),
(4, NULL, 'Md Ferdous', 'ferdous@gmail.com', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 1, NULL, TRUE),
(5, NULL, 'Md Abdullah', 'abdullah@gmail.com', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 1, NULL, TRUE)
ON CONFLICT ("Id") DO NOTHING;

-- Seed 16 Students (Password: 12345)
INSERT INTO "Users" ("Id", "StudentId", "FullName", "Email", "PasswordHash", "Role", "ClassId", "IsApproved") VALUES
(6, '24CSE001', 'Tanzim Ahmed', 'student10@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 1, TRUE),
(7, '24CSE002', 'Rafiul Islam', 'student11@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 1, TRUE),
(8, '23CSE001', 'Arif Hossain', 'student8@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 2, TRUE),
(9, '23CSE002', 'Jannatul Ferdous', 'student9@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 2, TRUE),
(10, '22CSE001', 'Rakib Hasan', 'student6@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 3, TRUE),
(11, '22CSE002', 'Nusrat Jahan', 'student7@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 3, TRUE),
(12, '22CSE003', 'Fahim Rahman', 'student12@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 4, TRUE),
(13, '22CSE004', 'Sadia Akter', 'student13@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 4, TRUE),
(14, '21CSE036', 'Iftekhar Siddiq Tanvir', 'student2@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 5, TRUE),
(15, '21CSE011', 'Masum Reza', 'student3@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 5, TRUE),
(16, '21CSE001', 'Abdullah Al Mamun', 'student4@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 6, TRUE),
(17, '21CSE005', 'Mim Akter', 'student14@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 6, TRUE),
(18, '20CSE016', 'Bondhon Das', 'student@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 7, TRUE),
(19, '20CSE020', 'Shakil Ahmed', 'student15@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 7, TRUE),
(20, '20CSE025', 'Mehedi Hasan', 'student16@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 8, TRUE),
(21, '20CSE030', 'Sumaiya Islam', 'student17@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 8, TRUE)
ON CONFLICT ("Id") DO NOTHING;

-- Seed 16 Courses
INSERT INTO "Subjects" ("Id", "Name", "ClassId") VALUES
(1, 'CSE101: Introduction to Computer Systems', 1),
(2, 'CSE102: Structured Programming', 1),
(3, 'CSE151: Discrete Mathematics', 2),
(4, 'CSE152: Digital Logic Design', 2),
(5, 'CSE201: Object Oriented Programming', 3),
(6, 'CSE202: Object Oriented Programming Lab', 3),
(7, 'CSE251: Algorithm Design and Analysis', 4),
(8, 'CSE252: Algorithm Design and Analysis Lab', 4),
(9, 'CSE301: Computer Architecture', 5),
(10, 'CSE302: Operating Systems', 5),
(11, 'CSE351: Computer Networks', 6),
(12, 'CSE352: Computer Networks Lab', 6),
(13, 'CSE401: Artificial Intelligence', 7),
(14, 'CSE402: Artificial Intelligence Lab', 7),
(15, 'CSE451: Machine Learning', 8),
(16, 'CSE452: Machine Learning Lab', 8)
ON CONFLICT ("Id") DO NOTHING;

-- Seed Teacher-Course Assignments
INSERT INTO "TeacherSubjects" ("Id", "TeacherId", "SubjectId") VALUES
(1, 2, 1), (2, 2, 2), (3, 2, 5), (4, 2, 6), -- Dr Mrinal Kanti Bawali
(5, 3, 3), (6, 3, 4), (7, 3, 7), (8, 3, 8), -- Dr Saleh Ahmed
(9, 4, 9), (10, 4, 10), (11, 4, 11), (12, 4, 12), -- Md Ferdous
(13, 5, 13), (14, 5, 14), (15, 5, 15), (16, 5, 16) -- Md Abdullah
ON CONFLICT ("Id") DO NOTHING;
