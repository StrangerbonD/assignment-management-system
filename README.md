# Assignment and Submission Management System

## Project Overview

The **Assignment and Submission Management System** is a full-stack, role-based academic evaluation application built for schools and universities. Developed for the Department of Computer Science and Engineering (CSE) at Gopalganj Science and Technology University (GSTU), the system facilitates seamless course administration, assignment publishing, student solution submission, automated attempt tracking, and faculty grading.

The application is architected with a **Next.js 14 (TypeScript)** Single Page Application frontend and an **ASP.NET Core 9 (C#)** RESTful Web API backend, utilizing **PostgreSQL** for relational data persistence.

---

## Source Code Repository

- **GitHub Repository**: `https://github.com/StrangerbonD/assignment-management-system`

---

## Key Features and Role Capabilities

### 1. Administrator Role
- **User Management**: Approve pending student registration requests based on uploaded Student ID Card proof. Update user details or delete accounts.
- **Academic Class & Semester Allocation**: Create and manage academic semesters (e.g., CSE 1st Year 1st Semester through CSE 4th Year 2nd Semester). Transfer student primary class assignments with automatic purging of invalid retake enrollments.
- **Subject & Teacher Allocation**: Manage course subjects and assign faculty members enforcing a strict **One Course = One Assigned Teacher** policy.
- **Account Recovery & System Audit**: Reset passwords for faculty or student accounts and inspect overall system statistics.

### 2. Teacher Role
- **Assignment Lifecycle Management**: Create, update, publish, or delete assignments for assigned subjects. Define assignment title, description, deadline, maximum marks, attempt limits, and question file attachments.
- **Submission Evaluation & Grading**: Review student solution text and uploaded attachments (images or PDFs) using an interactive preview modal. Assign scores ($0 \le \text{Marks} \le \text{MaxMarks}$) and construct written feedback.
- **Course Marksheet Matrix & Exporting**: View dynamic grade marksheets displaying student ID, student name, assignment scores, total marks, and average percentages. Export marksheets to CSV (Excel) or format for official PDF printing.
- **Retake Request Approval Hub**: Review, approve, or reject backlog/retake course applications submitted by students from higher semesters.

### 3. Student Role
- **Primary & Retake Course Dashboard**: Access core subjects belonging to the assigned primary semester class alongside approved backlog retake subjects.
- **Assignment Solution Submission**: View active assignments and deadlines. Submit written solutions and file attachments (images or PDFs) up to the allowed maximum attempts.
- **Resubmission & Attempt Control**: Update or overwrite previous submissions before the deadline. Attempt counters automatically track remaining submission allowances.
- **Performance & Grade Monitoring**: View submission status, marks awarded, and faculty feedback across semesters.

---

## System Architecture and Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router architecture with React and TypeScript)
- **Styling**: Vanilla CSS with custom design tokens (Clean, responsive human-interface design system)
- **HTTP Client**: Native Fetch API with central token handling in `src/lib/api.ts`

### Backend
- **Framework**: ASP.NET Core 9 Web API (.NET 9 Runtime)
- **Data Access**: Entity Framework Core 9 Code-First with Npgsql PostgreSQL Provider
- **Authentication**: JWT (JSON Web Token) authentication with HS256 signing and BCrypt password hashing
- **Error Handling**: Custom `ExceptionHandlingMiddleware` mapping domain exceptions to RFC 7807 problem details

### Database
- **Engine**: PostgreSQL Relational Database
- **Migration & Initialization**: Automated schema migration via `EnsureCreatedAsync()` on application startup alongside optional standalone `database_schema.sql` script.

### Automated Testing
- **Framework**: xUnit with FluentAssertions and EF Core In-Memory Database provider.

---

## Repository Structure

```
assignment-management-system/
├── backend/
│   ├── AssignmentSystem.Api/         # ASP.NET Core 9 Web API Project
│   │   ├── Controllers/              # Auth, Assignments, Submissions, Classes, Subjects, Users, Enrollments
│   │   ├── Data/                     # AppDbContext and DbInitializer
│   │   ├── Dtos/                     # Request and Response Data Transfer Objects
│   │   ├── Entities/                 # Domain Entities (User, Class, Subject, Assignment, Submission, etc.)
│   │   ├── Enums/                    # UserRole, AssignmentStatus, SubmissionStatus
│   │   ├── Exceptions/               # Custom Domain Exceptions
│   │   ├── Middleware/               # Global Exception Handling Middleware
│   │   ├── Services/                 # Business Logic Services and Interfaces
│   │   ├── database_schema.sql       # Standalone PostgreSQL SQL Initialization Script
│   │   └── Program.cs                # Application Entrypoint and Pipeline Configuration
│   └── Tests/                        # Unit Test Project
│       ├── Authorization/            # Role Authorization Tests
│       ├── BusinessRules/            # Marks, Deadline, Attempt Limit, and Policy Tests
│       └── TestHelpers/              # DbContext Mocks
├── frontend/                         # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/                      # Next.js App Router Pages and Dashboards
│   │   ├── components/               # Modal, StatusBadge, Navigation, and Layout Components
│   │   ├── context/                  # AuthContext Provider
│   │   ├── lib/                      # API Client and TypeScript Interfaces
│   ├── .env.example                  # Environment Variables Template
│   └── package.json                  # Dependencies and Scripts
├── DOCUMENTATION.md                  # System Technical Documentation
└── README.md                         # Project Master Documentation
```

---

## Environment Configuration

### Frontend Environment (`frontend/.env.example`)
Create a `.env.local` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend Configuration (`backend/AssignmentSystem.Api/appsettings.json`)
The API dynamically reads database connection parameters from environment variables or local appsettings:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=assignment_db;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Secret": "YourSuperSecretKeyWithMinimumLength32Chars!",
    "Issuer": "AssignmentSystemApi",
    "Audience": "AssignmentSystemClients"
  }
}
```

---

## Local Development Setup

### Prerequisites
- .NET 9.0 SDK
- Node.js (v18.0.0 or higher) and npm
- PostgreSQL Server running on `localhost:5432`

### Step 1: Database Setup
Create a local PostgreSQL database named `assignment_db`. You can either:
- Allow EF Core to automatically create tables on first run via `DbInitializer.cs`.
- Or execute the provided `backend/AssignmentSystem.Api/database_schema.sql` script in pgAdmin or psql.

### Step 2: Run Backend REST API (.NET 9)
```bash
cd backend/AssignmentSystem.Api
dotnet restore
dotnet run
```
The REST API will start listening on `http://localhost:5000`. OpenAPI Swagger documentation is available at `http://localhost:5000/swagger`.

### Step 3: Run Frontend Web Application (Next.js 14)
```bash
cd frontend
npm install
npm run dev
```
The web application will start listening on `http://localhost:3000`.

---

## Automated Unit Testing

The repository contains a unit test suite covering critical business rules, authorization boundaries, and data policies.

### Run Unit Tests
```bash
cd backend/Tests
dotnet test
```

### Test Suite Summary (18/18 Tests Passing)
1. `MarksValidationTests` (3 tests): Verifies that awarded marks cannot exceed `MaxMarks`, allows valid marks, and rejects negative marks ($0 \le \text{Marks} \le \text{MaxMarks}$).
2. `DeadlineEnforcementTests` (2 tests): Verifies student submission create/update locks post-deadline.
3. `SubmissionAttemptLimitTests` (1 test): Validates submission attempt capping when max attempts are reached.
4. `LowerSemesterRetakePolicyTests` (2 tests): Verifies that retake applications are allowed for lower semester courses and denied for upper/same semester courses.
5. `OneCourseOneTeacherPolicyTests` (1 test): Enforces that assigning a new teacher replaces previous allocations for a course.
6. `StudentClassAssignmentTests` (1 test): Validates automatic enrollment purging upon student semester transfer.
7. `FileUploadLimitTests` (2 tests): Enforces 5MB file upload limit and permits valid uploads.
8. `RoleAuthorizationTests` (2 tests): Validates draft assignment access restrictions.
9. `StudentClassAuthorizationTests` (2 tests): Enforces cross-class access blocking.
10. `TeacherSubjectAuthorizationTests` (2 tests): Blocks unassigned teachers from evaluating submissions.

---

## Seed Test Credentials

The system seeds demo accounts for testing all three user roles. All seeded accounts use the password: `12345`.

### 1. Administrator Account
- **Email**: `admin@cse.gstu.edu.bd`
- **Password**: `12345`

### 2. Faculty Teacher Accounts
- **Dr Mrinal Kanti Bawali**: `mrinal@gmail.com` | Password: `12345`
- **Dr Saleh Ahmed**: `saleh@gmail.com` | Password: `12345`
- **Md Ferdous**: `ferdous@gmail.com` | Password: `12345`
- **Md Abdullah**: `abdullah@gmail.com` | Password: `12345`

### 3. Sample Student Accounts (2 Per Semester)
- **CSE 1st Year 1st Sem**: `student10@cse.gstu.edu.bd` (`24CSE001`) / `student11@cse.gstu.edu.bd` (`24CSE002`) | Password: `12345`
- **CSE 1st Year 2nd Sem**: `student8@cse.gstu.edu.bd` (`23CSE001`) / `student9@cse.gstu.edu.bd` (`23CSE002`) | Password: `12345`
- **CSE 2nd Year 1st Sem**: `student6@cse.gstu.edu.bd` (`22CSE001`) / `student7@cse.gstu.edu.bd` (`22CSE002`) | Password: `12345`
- **CSE 2nd Year 2nd Sem**: `student12@cse.gstu.edu.bd` (`22CSE003`) / `student13@cse.gstu.edu.bd` (`22CSE004`) | Password: `12345`
- **CSE 3rd Year 1st Sem**: `student2@cse.gstu.edu.bd` (`21CSE036`) / `student3@cse.gstu.edu.bd` (`21CSE011`) | Password: `12345`
- **CSE 3rd Year 2nd Sem**: `student4@cse.gstu.edu.bd` (`21CSE001`) / `student14@cse.gstu.edu.bd` (`21CSE005`) | Password: `12345`
- **CSE 4th Year 1st Sem**: `student@cse.gstu.edu.bd` (`20CSE016`) / `student15@cse.gstu.edu.bd` (`20CSE020`) | Password: `12345`
- **CSE 4th Year 2nd Sem**: `student16@cse.gstu.edu.bd` (`20CSE025`) / `student17@cse.gstu.edu.bd` (`20CSE030`) | Password: `12345`

---

## Assumptions and Architectural Trade-offs

### Base64 Data URL File Storage Strategy

#### Context and Rationale
Stateless hosting containers utilize an **ephemeral container filesystem**, where local disk uploads are erased upon container restarts.

#### Architectural Decision
To ensure data persistence without requiring external paid cloud object storage dependencies (such as AWS S3), uploaded student ID cards, question papers, and submission attachments are encoded into **Base64 Data URLs** (`data:image/png;base64,...` / `data:application/pdf;base64,...`) and stored directly inside PostgreSQL database text columns.

#### Trade-offs and Mitigations
- **Trade-off**: Base64 encoding increases raw binary payload sizes by approximately 33%. Storing binary strings directly inside database rows increases database size.
- **Mitigation**: A strict **5MB file size limit** is programmatically enforced in `FileUploadController.cs` to prevent database bloat.
- **Production Recommendation**: In enterprise production environments, storing binary files in dedicated Object Storage (AWS S3) while maintaining reference URLs in the database remains the standard architecture. Base64 database persistence was selected as a practical, self-contained trade-off for zero-dependency local setup.
