# Assignment and Submission Management System

## Project Overview

The **Assignment and Submission Management System** is a full-stack, role-based academic evaluation platform designed for the Department of Computer Science and Engineering (CSE) at Gopalganj Science and Technology University (GSTU). The system streamlines academic course administration, assignment creation and publishing, student solution submissions, automated attempt tracking, lower-semester retake course applications, and faculty grading.

The application is architected with a **Next.js 14 (TypeScript)** Single Page Application frontend and an **ASP.NET Core 9 (C#)** RESTful Web API backend, utilizing **PostgreSQL** for relational data persistence.

---

## Source Code Repository

- **GitHub Repository**: `https://github.com/StrangerbonD/assignment-management-system`

---

## Main Features

### 1. Admin Role
- **Student Account Approval**: Review pending student registration requests and verify uploaded Student ID Card proof images/PDFs.
- **Academic Class & Semester Management**: Create and manage 8 academic semesters (CSE 1st Year 1st Semester through CSE 4th Year 2nd Semester). Transfer student primary semester classes with automatic purging of invalid retake enrollments.
- **Subject & Teacher Allocation**: Create course subjects and allocate faculty teachers enforcing a strict **One Course = One Assigned Teacher** policy.
- **User Administration & Account Recovery**: Full control over Admin, Teacher, and Student user accounts, including password reset capabilities.

### 2. Teacher Role
- **Assignment Lifecycle Management**: Create, edit, publish, or delete assignments for assigned subjects. Configure assignment title, description, deadline, maximum marks, maximum submission attempt limits, and question file attachments.
- **Submission Evaluation & Grading**: Review student solution text and uploaded file attachments (images or PDFs) via an interactive modal. Award numerical marks ($0 \le \text{Marks} \le \text{MaxMarks}$) and provide detailed written feedback.
- **Course Marksheet Matrix & Exporting**: Access real-time grade marksheets displaying student IDs, names, individual assignment scores, total marks, and average percentages. Export marksheets to CSV (Excel) or print/save as official academic PDF reports.
- **Retake Application Hub**: Review, approve, or reject backlog/retake course enrollment requests submitted by students from higher semesters.

### 3. Student Role
- **Primary & Retake Course Dashboard**: View core subjects belonging to the enrolled primary semester class alongside approved backlog retake subjects.
- **Assignment Submission**: Submit written solutions and file attachments (images or PDFs) before deadlines, subject to configured maximum attempt limits.
- **Resubmission & Attempt Control**: Update or resubmit solutions before the deadline. Attempt counters automatically track remaining submission allowances.
- **Grade & Performance Tracking**: View submission status, awarded marks, and teacher feedback across all enrolled subjects.

---

## Technology Stack

- **Frontend**: Next.js 14 (App Router architecture with React 18 and TypeScript), Vanilla CSS (Design Tokens architecture), Native Fetch API.
- **Backend REST API**: ASP.NET Core 9 Web API (.NET 9 Runtime), Entity Framework Core 9 (Code-First), JWT Authentication (HS256) with BCrypt password hashing.
- **Database Engine**: PostgreSQL Relational Database (Npgsql provider).
- **Automated Testing**: xUnit Test Framework with FluentAssertions and EF Core In-Memory Database provider.

---

## Project Structure

```
assignment-management-system/
├── backend/
│   ├── AssignmentSystem.Api/         # ASP.NET Core 9 Web API Project
│   │   ├── Controllers/              # Auth, Assignments, Submissions, Classes, Subjects, Users, Enrollments, FileUpload
│   │   ├── Data/                     # AppDbContext and DbInitializer
│   │   ├── Dtos/                     # Request and Response Data Transfer Objects
│   │   ├── Entities/                 # Domain Entities (User, Class, Subject, Assignment, Submission, etc.)
│   │   ├── Enums/                    # UserRole, AssignmentStatus, SubmissionStatus
│   │   ├── Exceptions/               # Custom Domain Exceptions (UnauthorizedException, BusinessRuleException, etc.)
│   │   ├── Middleware/               # Global Exception Handling Middleware (HTTP 401/400/404/409 mapping)
│   │   ├── Services/                 # Business Logic Services and Interfaces
│   │   ├── database_schema.sql       # Standalone PostgreSQL SQL Initialization Script
│   │   └── Program.cs                # Application Entrypoint and Pipeline Configuration
│   └── Tests/                        # Unit Test Project (19 Automated xUnit Tests)
│       ├── Authorization/            # Role Authorization & HTTP 401 Invalid Login Tests
│       ├── BusinessRules/            # Marks, Deadline, Attempt Limit, Retake, 1:1 Teacher, File Upload Limit Tests
│       └── TestHelpers/              # DbContext Mocks
├── frontend/                         # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/                      # Next.js App Router Pages and Dashboards
│   │   ├── components/               # Modal, StatusBadge, Navbar, Footer, CourseMarksheetTable Components
│   │   ├── context/                  # AuthContext Provider
│   │   ├── lib/                      # API Client and TypeScript Interfaces
│   │   └── styles/                   # Design Tokens (globals.css)
│   ├── .env.example                  # Environment Variables Template
│   └── package.json                  # Dependencies and Scripts (dev, build, start, lint, test)
└── README.md                         # Master Project Documentation
```

---

## Environment Configuration

Do not upload real passwords, API keys, or sensitive credentials to the repository.

### Frontend Environment (`frontend/.env.example`)
Create a `.env.local` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend Configuration (`backend/AssignmentSystem.Api/appsettings.json`)
Database connection string and JWT signing secret settings:
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

## Easy Local Setup Instructions

### Prerequisites
- .NET 9.0 SDK installed
- Node.js (v18.0.0 or higher) and npm installed
- PostgreSQL Server running locally on `localhost:5432`

### Database Setup Instructions
The evaluator can set up the database without manually creating tables or collections. You can choose either method:
1. **Automated Setup (Recommended)**: Create a local PostgreSQL database named `assignment_db`. Running `dotnet run` in the backend project automatically creates all tables and seeds 8 semesters, 16 courses, 5 teacher accounts (4 primary faculty members + 1 backward-compatibility account), 16 students, and 32 assignments via EF Core `DbInitializer.cs`.
2. **Database Script Setup**: Alternatively, execute the provided `backend/AssignmentSystem.Api/database_schema.sql` script in pgAdmin or psql to create the schema and insert seed data manually.

### Instructions for Running the Backend (API)
```bash
cd backend/AssignmentSystem.Api
dotnet restore
dotnet run
```
The REST API starts on `http://localhost:5000`. Swagger API documentation is accessible at `http://localhost:5000/swagger`.

### Instructions for Running the Frontend (Web App)
```bash
cd frontend
npm install
npm run dev
```
The web application starts on `http://localhost:3000`.

---

## Instructions for Running the Tests

The repository includes 19 automated backend unit tests covering all core business rules, authentication HTTP 401 responses, resource authorization, attempt capping, retake policies, and file upload limits.

### Run Backend Unit Tests (xUnit)
```bash
cd backend/Tests
dotnet test
```

### Frontend Testing Note
Frontend UI testing is handled manually through user interaction testing on the Next.js interfaces. Running `npm run test` inside the `frontend/` directory outputs a test verification note stating that core business rules are covered by the 19 backend xUnit test suites.

### Test Suite Execution Summary (19/19 Tests Passing)
- `MarksValidationTests` (3 tests): Validates $0 \le \text{Marks} \le \text{MaxMarks}$ and rejects negative marks.
- `DeadlineEnforcementTests` (2 tests): Verifies solution creation and updates are locked post-deadline.
- `SubmissionAttemptLimitTests` (1 test): Validates submission attempt capping when maximum attempts are reached.
- `LowerSemesterRetakePolicyTests` (2 tests): Verifies that retake applications are allowed for lower-semester courses and denied for same/upper semester courses.
- `OneCourseOneTeacherPolicyTests` (1 test): Verifies allocating a new teacher replaces previous allocations for a subject.
- `StudentClassAssignmentTests` (1 test): Validates automatic enrollment purging when a student transfers primary semester classes.
- `FileUploadLimitTests` (2 tests): Enforces 5MB file upload limit and permits valid files.
- `RoleAuthorizationTests` (3 tests): Validates draft assignment access restrictions, published filtering, and verifies that invalid credentials return HTTP 401 Unauthorized via `UnauthorizedException`.
- `StudentClassAuthorizationTests` (2 tests): Validates cross-class submission blocking.
- `TeacherSubjectAuthorizationTests` (2 tests): Validates unassigned teacher evaluation blocking.

---

## Demo Credentials

Working login credentials for testing all three user roles (all seeded accounts share the same password `12345`):

### 1. Administrator Account
- **Email**: `admin@cse.gstu.edu.bd` | **Password**: `12345`

### 2. Faculty Teacher Accounts (5 Accounts)
- **Dr Mrinal Kanti Bawali**: `mrinal@gmail.com` | **Password**: `12345`
- **Dr Saleh Ahmed**: `saleh@gmail.com` | **Password**: `12345`
- **Md Ferdous**: `ferdous@gmail.com` | **Password**: `12345`
- **Md Abdullah**: `abdullah@gmail.com` | **Password**: `12345`
- **Dr. Rahman (Compatibility Account)**: `teacher@cse.gstu.edu.bd` | **Password**: `12345`

### 3. Sample Student Accounts (16 Accounts Across 8 Semesters)
- **CSE 1st Year 1st Sem**: `student10@cse.gstu.edu.bd` (`24CSE001`) / `student11@cse.gstu.edu.bd` (`24CSE002`) | **Password**: `12345`
- **CSE 1st Year 2nd Sem**: `student8@cse.gstu.edu.bd` (`23CSE001`) / `student9@cse.gstu.edu.bd` (`23CSE002`) | **Password**: `12345`
- **CSE 2nd Year 1st Sem**: `student6@cse.gstu.edu.bd` (`22CSE001`) / `student7@cse.gstu.edu.bd` (`22CSE002`) | **Password**: `12345`
- **CSE 2nd Year 2nd Sem**: `student12@cse.gstu.edu.bd` (`22CSE003`) / `student13@cse.gstu.edu.bd` (`22CSE004`) | **Password**: `12345`
- **CSE 3rd Year 1st Sem**: `student2@cse.gstu.edu.bd` (`21CSE036`) / `student3@cse.gstu.edu.bd` (`21CSE011`) | **Password**: `12345`
- **CSE 3rd Year 2nd Sem**: `student4@cse.gstu.edu.bd` (`21CSE001`) / `student14@cse.gstu.edu.bd` (`21CSE005`) | **Password**: `12345`
- **CSE 4th Year 1st Sem**: `student@cse.gstu.edu.bd` (`20CSE016`) / `student15@cse.gstu.edu.bd` (`20CSE020`) | **Password**: `12345`
- **CSE 4th Year 2nd Sem**: `student16@cse.gstu.edu.bd` (`20CSE025`) / `student17@cse.gstu.edu.bd` (`20CSE030`) | **Password**: `12345`

---

## Assumptions and Known Limitations

### Base64 Data URL File Storage Strategy
- **Context & Rationale**: Stateless hosting containers utilize an **ephemeral container filesystem**, where local disk uploads are erased upon container restarts.
- **Architectural Decision**: To ensure data persistence without requiring external paid cloud object storage dependencies (such as AWS S3), uploaded student ID cards, question papers, and submission attachments are encoded into **Base64 Data URLs** (`data:image/png;base64,...` / `data:application/pdf;base64,...`) and stored directly inside PostgreSQL database string columns.
- **Known Limitations & Mitigations**:
  - Base64 encoding increases binary file payload size by approximately ~33%.
  - Storing binary strings inside database rows increases database storage volume.
  - **Mitigation**: A strict **5MB file size limit** is programmatically enforced in `FileUploadController.cs` to prevent database bloat.
  - **Production Recommendation**: In enterprise production environments, storing binary files in dedicated Object Storage (AWS S3) while maintaining reference URLs in the relational database remains the industry standard architecture. Base64 database persistence was selected as a practical trade-off for zero-dependency local setup and execution.
