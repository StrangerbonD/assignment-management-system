# Full Implementation Documentation: Assignment Management System

## Executive Summary

The **Assignment Management System** is a full-stack, enterprise-grade web application built for the **Department of Computer Science & Engineering (CSE) at Gopalganj Science and Technology University (GSTU)**. It provides a multi-role workspace for **Administrators**, **Faculty Teachers**, and **Students** to manage course curricula, assignment lifecycles, student submissions, grading, semester retake applications, and academic performance marksheets.

---

## 1. Technology Stack & Deployment Architecture

### Frontend (User Interface)
- **Framework**: Next.js 14 (App Router architecture with TypeScript)
- **Styling**: Vanilla CSS tokens & Tailwind CSS with a strict human-code UI design system (zero decorative icons or fluff).
- **Hosting Platform**: Vercel Cloud Platform
- **Environment Integration**: `NEXT_PUBLIC_API_URL` pointing to live backend REST API.

### Backend (REST API)
- **Framework**: ASP.NET Core 9 Web API (.NET 9 runtime)
- **Data Access & ORM**: Entity Framework Core 9 with Npgsql PostgreSQL provider.
- **Security & Authentication**: JWT (JSON Web Tokens) with HS256 signing and BCrypt password hashing.
- **Containerization**: Multi-stage Dockerfile targeting `mcr.microsoft.com/dotnet/aspnet:9.0` with Linux container file watcher (`inotify`) optimization.
- **Hosting Platform**: Render Cloud Platform (Docker runtime).
- **Live API Endpoint**: `https://assignment-system-api-l6b5.onrender.com`

### Database System
- **Engine**: PostgreSQL Database instance on Render Cloud.
- **Connection Management**: Dynamic URI parser (`ConvertPostgresUrl`) in `Program.cs` supporting both standard key-value Npgsql strings and Render `postgres://` / `postgresql://` connection URLs.

---

## 2. Core Features & Business Rules

### A. Role-Based Access Control (RBAC)
1. **Admin**:
   - Manages academic classes/semesters and course subjects.
   - Assigns or reallocates course teachers.
   - Manages and approves student accounts.
   - Updates student primary semester class with automatic obsolete retake cleanup.
2. **Teacher**:
   - Creates, edits, publishes, and deletes assignments.
   - Evaluates student submissions with numerical marks and detailed written feedback.
   - Reviews and approves student retake/backlog course applications.
   - Accesses real-time Course Marksheets with CSV Export and Print/PDF export.
3. **Student**:
   - Views primary semester published assignments and pending deadlines.
   - Submits assignment solutions (text and file uploads) within maximum attempt limits.
   - Applies for Retake/Backlog courses from strictly lower semester classes.
   - Tracks personal grades and views course marksheet matrix.

### B. Special Academic Policies & Rules
- **One Course = One Teacher Policy**: Re-assigning a teacher to a subject cleanly replaces any historical allocations for that subject.
- **Strict Lower-Semester Retake Rule**: Students can ONLY apply for retake/backlog courses belonging to classes strictly lower than their current primary semester (`s.ClassId < currentUser.ClassId`).
- **Automatic Class Update Cleanup**: When a student's primary class is updated to a higher semester, obsolete retake enrollments from prior primary classes are automatically purged.
- **Human-Code Design System**: All icons, emojis, and decorative badges are omitted in favor of clear typography, structured data tables, and high-contrast status pills.

---

## 3. Database Schema & Data Models

### 1. `Users`
- `Id` (Int, Primary Key)
- `FullName` (String)
- `Email` (String, Unique)
- `PasswordHash` (String, BCrypt)
- `Role` (Enum: `Admin`, `Teacher`, `Student`)
- `StudentId` (String, Nullable, e.g., `20CSE016`)
- `IdCardUrl` (String, Nullable)
- `IsApproved` (Boolean)
- `ClassId` (Int, Foreign Key -> `Classes.Id`, Nullable)

### 2. `Classes`
- `Id` (Int, Primary Key)
- `Name` (String, e.g., "CSE 1st Year 1st Semester", "CSE 4th Year 1st Semester")

### 3. `Subjects`
- `Id` (Int, Primary Key)
- `Name` (String, e.g., "CSE353: Computer Networks")
- `ClassId` (Int, Foreign Key -> `Classes.Id`)

### 4. `TeacherSubjects`
- `Id` (Int, Primary Key)
- `TeacherId` (Int, Foreign Key -> `Users.Id`)
- `SubjectId` (Int, Foreign Key -> `Subjects.Id`)

### 5. `Assignments`
- `Id` (Int, Primary Key)
- `Title` (String)
- `Description` (String)
- `AttachmentUrl` (String, Nullable)
- `Deadline` (DateTime UTC)
- `MaxMarks` (Int)
- `MaxSubmissionAttempts` (Int, Default: 2)
- `Status` (Enum: `Draft`, `Published`)
- `SubjectId` (Int, Foreign Key -> `Subjects.Id`)
- `CreatedBy` (Int, Foreign Key -> `Users.Id`)
- `CreatedAt` (DateTime UTC)

### 6. `Submissions`
- `Id` (Int, Primary Key)
- `AssignmentId` (Int, Foreign Key -> `Assignments.Id`)
- `StudentId` (Int, Foreign Key -> `Users.Id`)
- `AnswerText` (String)
- `FileUrl` (String, Nullable)
- `AttemptCount` (Int, Default: 1)
- `Marks` (Int, Nullable)
- `Feedback` (String, Nullable)
- `Status` (Enum: `Submitted`, `Graded`)
- `SubmittedAt` (DateTime UTC)
- `GradedAt` (DateTime UTC, Nullable)

### 7. `StudentSubjectEnrollments` (Retake / Backlog Courses)
- `Id` (Int, Primary Key)
- `StudentId` (Int, Foreign Key -> `Users.Id`)
- `SubjectId` (Int, Foreign Key -> `Subjects.Id`)
- `IsApproved` (Boolean, Default: False)
- `RequestedAt` (DateTime UTC)
- `ApprovedAt` (DateTime UTC, Nullable)

---

## 4. Key REST API Endpoints

| HTTP Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticates user & returns JWT Token + User Profile | No |
| `GET` | `/api/auth/profile` | Returns authenticated user details | Yes |
| `GET` | `/api/classes` | Lists all GSTU CSE semester classes | Yes |
| `POST` | `/api/classes` | Creates new class (Admin) | Admin |
| `GET` | `/api/subjects` | Lists subjects with teacher allocations | Yes |
| `GET` | `/api/subjects/{id}/marksheet` | Generates student x assignment grade matrix | Yes |
| `POST` | `/api/subjects/assign-teacher` | Allocates teacher to subject (Enforces 1 Course = 1 Teacher) | Admin |
| `GET` | `/api/assignments` | Fetches published assignments (Filtered by role & class) | Yes |
| `POST` | `/api/assignments` | Creates assignment (Teacher/Admin) | Teacher/Admin |
| `GET` | `/api/submissions` | Lists submissions for grading or student review | Yes |
| `POST` | `/api/submissions` | Submits assignment solution | Student |
| `POST` | `/api/submissions/{id}/grade` | Evaluates student submission with marks & feedback | Teacher/Admin |
| `GET` | `/api/enrollments/student` | Lists retake course enrollments | Student |
| `POST` | `/api/enrollments/request` | Requests lower-semester retake course | Student |
| `POST` | `/api/enrollments/{id}/approve` | Approves student retake request | Teacher/Admin |

---

## 5. Default Seed Accounts

The application automatically initializes default demo accounts upon database setup:

| Role | Name | Institutional Email | Password | Assigned Semester | Student ID |
|---|---|---|---|---|---|
| **Admin** | CSE Department Head / Admin | `admin@cse.gstu.edu.bd` | `Admin123!` | N/A | N/A |
| **Teacher** | Dr. Rahman (CSE Faculty) | `teacher@cse.gstu.edu.bd` | `Teacher123!` | N/A | N/A |
| **Student** | Bondhon Das | `student@cse.gstu.edu.bd` | `Student123!` | CSE 4th Year 1st Semester | `20CSE016` |
| **Student** | Iftekhar Siddiq Tanvir | `student2@cse.gstu.edu.bd` | `Student123!` | CSE 3rd Year 1st Semester | `20CSE036` |
| **Student** | Masum Reza | `student3@cse.gstu.edu.bd` | `Student123!` | CSE 3rd Year 1st Semester | `20CSE011` |

---

## 6. Automated Testing & Verification Suite

The project includes an **xUnit Automated Testing Suite** located in `backend/Tests/AssignmentSystem.Tests.csproj`. The test suite targets .NET 9 and uses `Entity Framework Core InMemory Database` and `Moq` to validate core business rules, resource-level authorization, and submission workflows.

### Test Execution Command
```bash
dotnet test backend/Tests/AssignmentSystem.Tests.csproj
```

### Verified Test Cases (10/10 Passed)
1. **`MarksValidationTests`**: Verifies that marks assigned to student submissions cannot exceed `MaxMarks` or be negative.
2. **`DeadlineEnforcementTests`**: Verifies that student submissions submitted past the deadline date/time are rejected or flagged.
3. **`SubmissionAttemptLimitTests`**: Validates that student submission attempts are strictly capped by `MaxSubmissionAttempts`.
4. **`LowerSemesterRetakePolicyTests`**: Enforces that retake applications for same-semester or upper-semester courses throw a `BadRequestException`.
5. **`OneCourseOneTeacherPolicyTests`**: Validates that allocating a new teacher to a course replaces any previous teacher allocations for that course.
6. **`RoleAuthorizationTests`**: Validates that students cannot create assignments or grade submissions.
7. **`StudentClassAssignmentTests`**: Validates that updating a student's primary class purges invalid/obsolete enrollments from prior primary classes.

---

## 7. Development & Deployment Procedures

### Running Backend Locally
```bash
cd backend/AssignmentSystem.Api
dotnet run
```
*Runs on `http://localhost:5000` with Swagger UI at `http://localhost:5000/swagger`.*

### Running Frontend Locally
```bash
cd frontend
npm run dev
```
*Runs on `http://localhost:3000`.*

### Deploying Updates to Production
Simply push commits to the `main` branch on GitHub (`StrangerbonD/assignment-management-system`). Both Render (Backend Docker Container) and Vercel (Frontend Next.js App) will trigger automated CI/CD builds and deploy within 60 seconds.
