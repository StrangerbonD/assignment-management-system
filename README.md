# Gopalganj Science and Technology University (GSTU)
## Department of Computer Science & Engineering (CSE)

# 🎓 Full-Stack University Assignment & Marksheet Management System

A robust, enterprise-grade, full-stack Academic Assignment & Evaluation System built using **Next.js 14 (TypeScript)** and **ASP.NET Core 9 (Web API)** backed by **PostgreSQL**.

---

## 🌟 Key Features

### 👨‍🎓 Student Portal
- **Primary Course Dashboard**: Automatically enrolled in all core subjects belonging to their assigned class.
- **Lower-Semester Retake Application Engine**: Apply for backlog/retake courses strictly restricted to lower semester classes (`s.ClassId < user.ClassId`).
- **Dynamic Enrolled Counter**: View accurate combined count of primary and approved retake courses.
- **Submission Attempt Control**: Configurable maximum submission limits per assignment with overdue deadline enforcement.
- **Marksheet Performance View**: Real-time view of assignment scores and average percentage progress across semesters.

### 👨‍🏫 Teacher Portal
- **Course Assignment Builder**: Create and publish assignments with deadline tracking, file attachments, max marks, and attempt limits.
- **Student Submission Evaluation**: Grade student answers, attach constructive feedback, and allow attempt resubmissions.
- **Retake Approval Hub**: Review, approve, or reject student backlog course enrollment applications.
- **Course Marksheet Matrix & Grade Summary**:
  - Dynamically expanding matrix table (`Student ID`, `Student Name`, `A1`, `A2`... `Total Marks`, `Average Score %`).
  - **📥 Export to Excel (.CSV)**: 1-click spreadsheet download.
  - **🖨️ Print / Save PDF**: Official academic grade reporting.

### 🛡️ Admin Portal
- **Department User Management**: Full control over Student, Teacher, and Admin accounts.
- **Class & Subject Allocation**: Add semester classes, subjects, and enforce **1 Course = 1 Assigned Teacher** policy.
- **Student Class Transfer**: Transfer student enrolled classes with automatic data persistence across server reloads.
- **Password Reset & ID Verification**: Admin password reset utility and student ID card photo verification modal.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Vanilla CSS (Design Tokens), Fetch API.
- **Backend API**: ASP.NET Core 9 (C#), Entity Framework Core, JWT Authentication, BCrypt Hashing.
- **Database**: PostgreSQL (Npgsql Provider).
- **Automated Testing**: xUnit Test Framework (10/10 Passing Unit Tests).

---

## 🚀 Local Development Setup

### 1. Backend API Setup (.NET 9)
```bash
cd backend/AssignmentSystem.Api
dotnet restore
dotnet run
```
*API running at `http://localhost:5000/api`*

### 2. Frontend Setup (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*Web App running at `http://localhost:3000`*

---

## 🔐 Default Seeded Test Credentials

*(All accounts share the password: `12345`)*

### 👑 Admin
- **Email**: `admin@cse.gstu.edu.bd` | **Password**: `12345`

### 👨‍🏫 Teachers
- **Dr Mrinal Kanti Bawali**: `mrinal@gmail.com` | **Password**: `12345`
- **Dr Saleh Ahmed**: `saleh@gmail.com` | **Password**: `12345`
- **Md Ferdous**: `ferdous@gmail.com` | **Password**: `12345`
- **Md Abdullah**: `abdullah@gmail.com` | **Password**: `12345`

### 👨‍🎓 Sample Students (2 Per Semester)
- **CSE 1st Year 1st Sem**: `student10@cse.gstu.edu.bd` (`24CSE001`) / `student11@cse.gstu.edu.bd` (`24CSE002`) | **Password**: `12345`
- **CSE 1st Year 2nd Sem**: `student8@cse.gstu.edu.bd` (`23CSE001`) / `student9@cse.gstu.edu.bd` (`23CSE002`) | **Password**: `12345`
- **CSE 2nd Year 1st Sem**: `student6@cse.gstu.edu.bd` (`22CSE001`) / `student7@cse.gstu.edu.bd` (`22CSE002`) | **Password**: `12345`
- **CSE 2nd Year 2nd Sem**: `student12@cse.gstu.edu.bd` (`22CSE003`) / `student13@cse.gstu.edu.bd` (`22CSE004`) | **Password**: `12345`
- **CSE 3rd Year 1st Sem**: `student2@cse.gstu.edu.bd` (`21CSE036`) / `student3@cse.gstu.edu.bd` (`21CSE011`) | **Password**: `12345`
- **CSE 3rd Year 2nd Sem**: `student4@cse.gstu.edu.bd` (`21CSE001`) / `student14@cse.gstu.edu.bd` (`21CSE005`) | **Password**: `12345`
- **CSE 4th Year 1st Sem**: `student@cse.gstu.edu.bd` (`20CSE016`) / `student15@cse.gstu.edu.bd` (`20CSE020`) | **Password**: `12345`
- **CSE 4th Year 2nd Sem**: `student16@cse.gstu.edu.bd` (`20CSE025`) / `student17@cse.gstu.edu.bd` (`20CSE030`) | **Password**: `12345`

---

## ⚠️ Assumptions & Architectural Trade-offs

### 💾 Base64 Data URL File Storage Strategy
- **Context & Rationale**: Free-tier cloud container hosting platforms (such as Render) operate on an **ephemeral filesystem**, where local container disk storage (`/uploads/`) is wiped upon container redeployment, restart, or scaling.
- **Architectural Choice**: To guarantee 100% data persistence without requiring external paid cloud object storage subscriptions (e.g., AWS S3, Google Cloud Storage), uploaded question attachments and student submission files are encoded into **Base64 Data URLs** (`data:image/png;base64,...` / `data:application/pdf;base64,...`) and stored directly within PostgreSQL database string columns.
- **Known Limitations & Mitigations**:
  - Base64 encoding increases binary file payload size by approximately ~33%.
  - Storing large binary payloads directly in relational database rows can increase database table size and impact query payload sizes.
  - **Mitigation**: To prevent database bloat, a strict **5MB file size limit** is programmatically enforced in `FileUploadController.cs`.
  - **Production Recommendation**: For production enterprise deployments, storing binary assets in dedicated Object Storage (AWS S3) while storing public CDN URLs in the relational database remains the industry best practice. Base64 DB storage was chosen as a deliberate, practical, self-contained trade-off for zero-dependency project execution.
