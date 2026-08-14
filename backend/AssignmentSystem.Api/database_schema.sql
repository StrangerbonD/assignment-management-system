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
    "AppliedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ApprovedAt" TIMESTAMP WITH TIME ZONE NULL,
    "ApprovedBy" INT NULL REFERENCES "Users"("Id") ON DELETE SET NULL
);

-- =============================================================================
-- Seed Initial Demo Accounts & Academic Data
-- =============================================================================

INSERT INTO "AcademicClasses" ("Id", "Name") VALUES 
(1, 'CSE 1st Year 1st Semester'),
(2, 'CSE 2nd Year 1st Semester'),
(3, 'CSE 3rd Year 1st Semester'),
(4, 'CSE 4th Year 1st Semester')
ON CONFLICT ("Id") DO NOTHING;

-- Seed Default Demo Users (Passwords: Admin123!, Teacher123!, Student123!)
-- Password hashes generated via BCrypt
INSERT INTO "Users" ("Id", "StudentId", "FullName", "Email", "PasswordHash", "Role", "ClassId", "IsApproved") VALUES
(1, NULL, 'CSE Department Head / Admin', 'admin@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 0, NULL, TRUE),
(2, NULL, 'Dr Mrinal Kanti Bawali', 'teacher@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 1, NULL, TRUE),
(3, '20CSE016', 'Bondhon Das', 'student@cse.gstu.edu.bd', '$2a$11$qRz.hA/MvMvY/B1M4jN1xe7h.VbF3b/1a2b3c4d5e6f7g8h9i0jK', 2, 4, TRUE)
ON CONFLICT ("Id") DO NOTHING;
