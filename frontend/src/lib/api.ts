import {
  AuthResponse,
  UserProfile,
  User,
  ClassItem,
  SubjectItem,
  TeacherSubject,
  Assignment,
  Submission,
  UserRole,
  AssignmentStatus,
  CourseMarksheet,
  Enrollment
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getAuthHeader(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMessage = data?.message;
    if (!errorMessage && data?.errors && typeof data.errors === 'object') {
      const errorList = Object.entries(data.errors)
        .map(([key, msgs]: [string, any]) => `${key}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join(' | ');
      if (errorList) errorMessage = errorList;
    }
    if (!errorMessage && data?.title) {
      errorMessage = data.title;
    }
    if (!errorMessage) {
      errorMessage = `API Error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  // File Upload Endpoint
  uploadFile: async (file: File): Promise<{ url: string; fileName: string; fileType: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const headers = getAuthHeader(); // Do NOT set Content-Type header manually for FormData

    const response = await fetch(`${API_BASE_URL}/fileupload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'File upload failed');
    }
    return data;
  },

  // Auth
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  registerStudent: (data: { studentId: string; fullName: string; email: string; password: string; classId: number; idCardUrl?: string | null }) =>
    apiFetch<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () => apiFetch<UserProfile>('/auth/me'),

  // Users (Admin)
  getUsers: (role?: UserRole, classId?: number) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (classId) params.append('classId', classId.toString());
    return apiFetch<User[]>(`/users?${params.toString()}`);
  },

  createUser: (userData: { studentId?: string | null; idCardUrl?: string | null; fullName: string; email: string; password: string; role: UserRole; classId?: number | null }) =>
    apiFetch<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  approveUser: (id: number) =>
    apiFetch<User>(`/users/${id}/approve`, {
      method: 'PUT',
    }),

  resetPassword: (id: number, newPassword: string) =>
    apiFetch<User>(`/users/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    }),

  updateUser: (id: number, userData: { studentId?: string | null; idCardUrl?: string | null; isApproved?: boolean; fullName: string; email: string; role: UserRole; classId?: number | null }) =>
    apiFetch<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  deleteUser: (id: number) =>
    apiFetch<void>(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Classes (Admin)
  getClasses: () => apiFetch<ClassItem[]>('/classes'),

  createClass: (name: string) =>
    apiFetch<ClassItem>('/classes', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  deleteClass: (id: number) =>
    apiFetch<void>(`/classes/${id}`, {
      method: 'DELETE',
    }),

  // Subjects (Admin)
  getSubjects: (classId?: number) => {
    const query = classId ? `?classId=${classId}` : '';
    return apiFetch<SubjectItem[]>(`/subjects${query}`);
  },

  createSubject: (name: string, classId: number) =>
    apiFetch<SubjectItem>('/subjects', {
      method: 'POST',
      body: JSON.stringify({ name, classId }),
    }),

  deleteSubject: (id: number) =>
    apiFetch<void>(`/subjects/${id}`, {
      method: 'DELETE',
    }),

  assignTeacher: (teacherId: number, subjectId: number) =>
    apiFetch<TeacherSubject>('/subjects/assign-teacher', {
      method: 'POST',
      body: JSON.stringify({ teacherId, subjectId }),
    }),

  unassignTeacher: (teacherSubjectId: number) =>
    apiFetch<void>(`/subjects/unassign-teacher/${teacherSubjectId}`, {
      method: 'DELETE',
    }),

  getCourseMarksheet: (subjectId: number) =>
    apiFetch<CourseMarksheet>(`/subjects/${subjectId}/marksheet`),

  // Assignments (Teacher & Student)
  getAssignments: (subjectId?: number, classId?: number, status?: AssignmentStatus) => {
    const params = new URLSearchParams();
    if (subjectId) params.append('subjectId', subjectId.toString());
    if (classId) params.append('classId', classId.toString());
    if (status) params.append('status', status);
    return apiFetch<Assignment[]>(`/assignments?${params.toString()}`);
  },

  getAssignmentById: (id: number) => apiFetch<Assignment>(`/assignments/${id}`),

  createAssignment: (assignmentData: {
    title: string;
    description: string;
    attachmentUrl?: string | null;
    deadline: string;
    maxMarks: number;
    maxSubmissionAttempts?: number;
    status: AssignmentStatus;
    subjectId: number;
  }) =>
    apiFetch<Assignment>('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    }),

  updateAssignment: (
    id: number,
    assignmentData: {
      title: string;
      description: string;
      attachmentUrl?: string | null;
      deadline: string;
      maxMarks: number;
      maxSubmissionAttempts?: number;
      status: AssignmentStatus;
      subjectId?: number;
    }
  ) =>
    apiFetch<Assignment>(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assignmentData),
    }),

  deleteAssignment: (id: number) =>
    apiFetch<void>(`/assignments/${id}`, {
      method: 'DELETE',
    }),

  // Submissions (Student & Teacher)
  getSubmissions: (assignmentId?: number, studentId?: number) => {
    const params = new URLSearchParams();
    if (assignmentId) params.append('assignmentId', assignmentId.toString());
    if (studentId) params.append('studentId', studentId.toString());
    return apiFetch<Submission[]>(`/submissions?${params.toString()}`);
  },

  getSubmissionsForAssignment: (assignmentId: number) => {
    return apiFetch<Submission[]>(`/submissions/assignment/${assignmentId}`);
  },

  getSubmissionById: (id: number) => apiFetch<Submission>(`/submissions/${id}`),

  createSubmission: (submissionData: { assignmentId: number; answerText: string; fileUrl?: string | null }) =>
    apiFetch<Submission>('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    }),

  submitAssignment: (assignmentId: number, answerText: string, fileUrl?: string | null) =>
    apiFetch<Submission>('/submissions', {
      method: 'POST',
      body: JSON.stringify({ assignmentId, answerText, fileUrl }),
    }),

  updateSubmission: (id: number, submissionData: { answerText: string; fileUrl?: string | null }) =>
    apiFetch<Submission>(`/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(submissionData),
    }),

  gradeSubmission: (submissionId: number, gradeData: { marks: number; feedback?: string }) =>
    apiFetch<Submission>(`/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify(gradeData),
    }),

  // Retake / Backlog Course Enrollments
  requestEnrollment: (subjectId: number) =>
    apiFetch<Enrollment>('/enrollments/request', {
      method: 'POST',
      body: JSON.stringify({ subjectId }),
    }),

  getStudentEnrollments: () => apiFetch<Enrollment[]>('/enrollments/my'),

  getTeacherPendingEnrollments: () => apiFetch<Enrollment[]>('/enrollments/teacher-pending'),

  approveEnrollment: (id: number) =>
    apiFetch<Enrollment>(`/enrollments/${id}/approve`, {
      method: 'PUT',
    }),

  rejectEnrollment: (id: number) =>
    apiFetch<void>(`/enrollments/${id}`, {
      method: 'DELETE',
    }),
};
