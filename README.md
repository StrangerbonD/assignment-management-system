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

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@cse.gstu.edu.bd` | `Admin123!` |
| **Teacher** | `teacher@cse.gstu.edu.bd` | `Teacher123!` |
| **Student** | `student@cse.gstu.edu.bd` | `Student123!` |
