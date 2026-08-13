export type UserRole = 'Admin' | 'Teacher' | 'Student';
export type AssignmentStatus = 'Draft' | 'Published';
export type SubmissionStatus = 'Pending' | 'Submitted' | 'Graded';

export function normalizeRole(role: any): UserRole {
  if (role === 0 || role === '0' || String(role).toLowerCase() === 'admin') return 'Admin';
  if (role === 1 || role === '1' || String(role).toLowerCase() === 'teacher') return 'Teacher';
  if (role === 2 || role === '2' || String(role).toLowerCase() === 'student') return 'Student';
  return 'Student';
}

export interface AuthResponse {
  token: string;
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  classId: number | null;
  className: string | null;
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  classId: number | null;
  className: string | null;
}

export interface TeacherSubject {
  id: number;
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
}

export interface User {
  id: number;
  studentId?: string | null;
  idCardUrl?: string | null;
  isApproved?: boolean;
  fullName: string;
  email: string;
  role: UserRole;
  classId: number | null;
  className: string | null;
  assignedSubjects?: TeacherSubject[];
}

export interface ClassItem {
  id: number;
  name: string;
  studentCount: number;
  subjectCount: number;
}

export interface TeacherMini {
  id: number;
  fullName: string;
  email: string;
}

export interface SubjectItem {
  id: number;
  name: string;
  classId: number;
  className: string;
  assignedTeachers: TeacherMini[];
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  attachmentUrl?: string | null;
  deadline: string;
  maxMarks: number;
  maxSubmissionAttempts: number;
  status: AssignmentStatus;
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
  createdBy: number;
  creatorName: string;
  createdAt: string;
  isOverdue: boolean;
  totalSubmissionsCount: number;
  gradedSubmissionsCount: number;
}

export interface Submission {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  maxMarks: number;
  deadline: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  answerText: string;
  fileUrl: string | null;
  attemptCount: number;
  maxSubmissionAttempts: number;
  remainingAttempts: number;
  status: SubmissionStatus;
  marks: number | null;
  feedback: string | null;
  gradedBy: number | null;
  graderName: string | null;
  submittedAt: string;
  gradedAt: string | null;
}

export interface Enrollment {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentIdRoll: string | null;
  studentClassName: string | null;
  subjectId: number;
  subjectName: string;
  subjectClassName: string;
  isApproved: boolean;
  requestedAt: string;
  approvedAt: string | null;
}

export interface MarksheetAssignmentHeader {
  id: number;
  title: string;
  maxMarks: number;
  sequenceNumber: number;
}

export interface StudentMarksheetRow {
  studentId: number;
  studentRegId: string;
  studentName: string;
  studentEmail: string;
  marksMap: Record<number, number | null>;
  totalObtainedMarks: number;
  totalMaxMarks: number;
  averagePercentage: number;
}

export interface CourseMarksheet {
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
  assignments: MarksheetAssignmentHeader[];
  students: StudentMarksheetRow[];
}

export interface ApiError {
  status: number;
  message: string;
}
