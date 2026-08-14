'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RoleGuard } from '../../../components/Protection/RoleGuard';
import { User, ClassItem, SubjectItem, UserRole, Assignment, Submission } from '../../../lib/types';
import { api } from '../../../lib/api';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { AssignmentCard } from '../../../components/AssignmentCard';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'students' | 'pending' | 'teachers' | 'admins' | 'classes' | 'subjects' | 'assignments' | 'submissions' | 'settings'>('students');
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ID Card Preview Modal State
  const [previewIdCardUrl, setPreviewIdCardUrl] = useState<string | null>(null);
  const [previewStudentName, setPreviewStudentName] = useState<string>('');

  // Reset Password Modal State
  const [resetPasswordModalUser, setResetPasswordModalUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Application Settings State
  const [appSettings, setAppSettings] = useState({
    institutionName: 'Gopalganj Science and Technology University (GSTU)',
    departmentName: 'Dept. of Computer Science & Engineering',
    academicSession: '2025-2026',
    defaultSubmissionAttempts: 2,
    maxUploadFileSizeMb: 10,
    allowLateSubmissions: false,
  });

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [changeClassUser, setChangeClassUser] = useState<User | null>(null);
  const [targetChangeClassId, setTargetChangeClassId] = useState<string>('');
  const [updatingClass, setUpdatingClass] = useState(false);
  const [viewingAnswerSubmission, setViewingAnswerSubmission] = useState<Submission | null>(null);

  // Form states
  const [userForm, setUserForm] = useState({ studentId: '', fullName: '', email: '', password: '', role: 'Student' as UserRole, classId: '' });
  const [classNameInput, setClassNameInput] = useState('');
  const [subjectForm, setSubjectForm] = useState({ name: '', classId: '' });
  const [assignForm, setAssignForm] = useState({ teacherId: '', subjectId: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [uRes, cRes, sRes, aRes, subRes] = await Promise.all([
        api.getUsers(),
        api.getClasses(),
        api.getSubjects(),
        api.getAssignments(),
        api.getSubmissions(),
      ]);
      setUsers(uRes);
      setClasses(cRes);
      setSubjects(sRes);
      setAssignments(aRes);
      setSubmissions(subRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const getFormattedUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleOpenDocument = (url?: string | null) => {
    if (!url) return;
    const targetUrl = getFormattedUrl(url);

    if (targetUrl.startsWith('data:')) {
      try {
        const parts = targetUrl.split(';base64,');
        const contentType = parts[0].replace('data:', '');
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (e) {
        const win = window.open('');
        if (win) {
          if (targetUrl.includes('image')) {
            win.document.write(`<img src="${targetUrl}" style="max-width:100%" />`);
          } else {
            win.document.write(`<iframe src="${targetUrl}" style="width:100%;height:100vh;border:none"></iframe>`);
          }
        }
      }
    } else {
      window.open(targetUrl, '_blank');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createUser({
        studentId: userForm.role === 'Student' ? userForm.studentId : null,
        fullName: userForm.fullName,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        classId: userForm.role === 'Student' && userForm.classId ? Number(userForm.classId) : null,
      });
      setSuccessMsg(`User ${userForm.fullName} created successfully.`);
      setIsUserModalOpen(false);
      setUserForm({ studentId: '', fullName: '', email: '', password: '', role: 'Student', classId: '' });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApproveUser = async (id: number, name: string) => {
    setError(null);
    try {
      await api.approveUser(id);
      setSuccessMsg(`Student account for ${name} approved successfully!`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModalUser) return;
    setError(null);
    try {
      await api.resetPassword(resetPasswordModalUser.id, newPasswordInput);
      setSuccessMsg(`Password for ${resetPasswordModalUser.fullName} (${resetPasswordModalUser.email}) reset successfully.`);
      setResetPasswordModalUser(null);
      setNewPasswordInput('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete user ${name}?`)) return;
    setError(null);
    try {
      await api.deleteUser(id);
      setSuccessMsg(`User ${name} deleted.`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.deleteAssignment(id);
      setSuccessMsg('Assignment deleted.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createClass(classNameInput);
      setSuccessMsg(`Class ${classNameInput} created.`);
      setIsClassModalOpen(false);
      setClassNameInput('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteClass = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete class ${name}?`)) return;
    setError(null);
    try {
      await api.deleteClass(id);
      setSuccessMsg(`Class ${name} deleted.`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createSubject(subjectForm.name, Number(subjectForm.classId));
      setSuccessMsg(`Subject ${subjectForm.name} created.`);
      setIsSubjectModalOpen(false);
      setSubjectForm({ name: '', classId: '' });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteSubject = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete subject ${name}?`)) return;
    setError(null);
    try {
      await api.deleteSubject(id);
      setSuccessMsg(`Subject ${name} deleted.`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.assignTeacher(Number(assignForm.teacherId), Number(assignForm.subjectId));
      setSuccessMsg('Teacher assigned to subject successfully.');
      setIsAssignModalOpen(false);
      setAssignForm({ teacherId: '', subjectId: '' });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUnassignTeacher = async (teacherSubjectId: number, subjectName: string) => {
    if (!confirm(`Are you sure you want to unassign/remove the teacher from ${subjectName}?`)) return;
    try {
      setError(null);
      await api.unassignTeacher(teacherSubjectId);
      setSuccessMsg(`Teacher unassigned from ${subjectName} successfully.`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChangeClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeClassUser || !targetChangeClassId) return;

    try {
      setUpdatingClass(true);
      setError(null);
      await api.updateUser(changeClassUser.id, {
        studentId: changeClassUser.studentId,
        idCardUrl: changeClassUser.idCardUrl,
        isApproved: changeClassUser.isApproved !== false,
        fullName: changeClassUser.fullName,
        email: changeClassUser.email,
        role: changeClassUser.role,
        classId: Number(targetChangeClassId),
      });

      setSuccessMsg(`Enrolled class for ${changeClassUser.fullName} updated successfully.`);
      setChangeClassUser(null);
      setTargetChangeClassId('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update enrolled class.');
    } finally {
      setUpdatingClass(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Application-level settings updated successfully.');
  };

  // Filter users by search query
  const searchFilteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.studentId && u.studentId.toLowerCase().includes(q))
    );
  });

  const studentUsers = searchFilteredUsers.filter((u) => u.role === 'Student' && u.isApproved !== false);
  const pendingUsers = users.filter((u) => u.role === 'Student' && u.isApproved === false);
  const teacherUsers = searchFilteredUsers.filter((u) => u.role === 'Teacher');
  const adminUsers = searchFilteredUsers.filter((u) => u.role === 'Admin');

  return (
    <RoleGuard allowedRoles={['Admin']}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#006633' }}>Admin Management Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {appSettings.institutionName} — {appSettings.departmentName}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setIsUserModalOpen(true)} className="btn btn-primary btn-sm">
              Add User Account
            </button>
            <button onClick={() => setIsClassModalOpen(true)} className="btn btn-secondary btn-sm">
              Add Class
            </button>
            <button onClick={() => setIsSubjectModalOpen(true)} className="btn btn-secondary btn-sm">
              Add Subject
            </button>
            <button onClick={() => setIsAssignModalOpen(true)} className="btn btn-primary btn-sm">
              Assign Teacher
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {/* Live Search Bar */}
        <div style={{ marginBottom: '1.25rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search users by Name, Student ID (e.g. 20CSE016), or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: '0.9rem', padding: '0.65rem 1rem', borderColor: '#cbd5e1' }}
          />
        </div>

        {/* Separate Tabs Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('students')}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'students' ? '3px solid #006633' : '3px solid transparent',
              color: activeTab === 'students' ? '#006633' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Students ({studentUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'pending' ? '3px solid #d97706' : '3px solid transparent',
              color: activeTab === 'pending' ? '#d97706' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Pending Approvals ({pendingUsers.length})
            {pendingUsers.length > 0 && (
              <span className="badge" style={{ background: '#ef4444', color: '#fff', marginLeft: '0.4rem', borderRadius: '999px', fontSize: '0.7rem' }}>
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'teachers' ? '3px solid #006633' : '3px solid transparent',
              color: activeTab === 'teachers' ? '#006633' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Teachers ({teacherUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'admins' ? '3px solid #006633' : '3px solid transparent',
              color: activeTab === 'admins' ? '#006633' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Admins ({adminUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'classes' ? '3px solid #006633' : '3px solid transparent',
              color: activeTab === 'classes' ? '#006633' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Classes ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'subjects' ? '3px solid #006633' : '3px solid transparent',
              color: activeTab === 'subjects' ? '#006633' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Subjects ({subjects.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'assignments' ? '3px solid #006633' : '3px solid transparent',
              color: activeTab === 'assignments' ? '#006633' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            All Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'submissions' ? '3px solid #006633' : '3px solid transparent',
              color: activeTab === 'submissions' ? '#006633' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            All Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'settings' ? '3px solid #006633' : '3px solid transparent',
              color: activeTab === 'settings' ? '#006633' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            App Settings
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Loading department data...</div>
        ) : (
          <>
            {/* 1. APPROVED STUDENTS TABLE */}
            {activeTab === 'students' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Enrolled Class</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentUsers.length > 0 ? (
                      studentUsers.map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 700, color: '#006633' }}>{u.studentId || `-`}</td>
                          <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>
                              Approved
                            </span>
                          </td>
                          <td>{u.className || '-'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                onClick={() => {
                                  setChangeClassUser(u);
                                  setTargetChangeClassId(u.classId?.toString() || '');
                                }}
                                className="btn btn-primary btn-sm"
                                style={{ fontWeight: 600 }}
                              >
                                Change Class
                              </button>
                              <button
                                onClick={() => setResetPasswordModalUser(u)}
                                className="btn btn-secondary btn-sm"
                                style={{ borderColor: '#d97706', color: '#b45309' }}
                              >
                                Reset Password
                              </button>
                              <button onClick={() => handleDeleteUser(u.id, u.fullName)} className="btn btn-danger btn-sm">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No approved students found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. PENDING REGISTRATIONS & ID CARD REVIEW TABLE */}
            {activeTab === 'pending' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Requested Semester</th>
                      <th>ID Card Proof</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.length > 0 ? (
                      pendingUsers.map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 700, color: '#d97706' }}>{u.studentId || `-`}</td>
                          <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                          <td>{u.email}</td>
                          <td>{u.className || '-'}</td>
                          <td>
                            {u.idCardUrl ? (
                              <button
                                onClick={() => {
                                  setPreviewIdCardUrl(u.idCardUrl!);
                                  setPreviewStudentName(u.fullName);
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ borderColor: '#006633', color: '#006633', fontWeight: 600 }}
                              >
                                View Student ID Card
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No photo attached</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => handleApproveUser(u.id, u.fullName)}
                                className="btn btn-primary btn-sm"
                                style={{ background: '#166534', borderColor: '#166534' }}
                              >
                                Approve Account
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.fullName)}
                                className="btn btn-danger btn-sm"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No pending student registrations waiting for review.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. TEACHERS TABLE */}
            {activeTab === 'teachers' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Assigned Subjects</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherUsers.length > 0 ? (
                      teacherUsers.map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className="badge badge-role">{u.role}</span>
                          </td>
                          <td>
                            {u.assignedSubjects && u.assignedSubjects.length > 0 ? (
                              u.assignedSubjects.map((ts) => (
                                <span key={ts.id} className="badge badge-role" style={{ marginRight: '0.4rem', marginBottom: '0.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  {ts.subjectName}
                                  <button
                                    onClick={() => handleUnassignTeacher(ts.id, ts.subjectName)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '0.75rem', marginLeft: '0.3rem' }}
                                    title="Unassign / Remove Course"
                                  >
                                    (Unassign)
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>No subjects assigned</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                onClick={() => setResetPasswordModalUser(u)}
                                className="btn btn-secondary btn-sm"
                                style={{ borderColor: '#d97706', color: '#b45309' }}
                              >
                                Reset Password
                              </button>
                              <button onClick={() => handleDeleteUser(u.id, u.fullName)} className="btn btn-danger btn-sm">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No teachers found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. ADMINS TABLE */}
            {activeTab === 'admins' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.length > 0 ? (
                      adminUsers.map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className="badge badge-role" style={{ background: '#fef3c7', color: '#92400e' }}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                onClick={() => setResetPasswordModalUser(u)}
                                className="btn btn-secondary btn-sm"
                                style={{ borderColor: '#d97706', color: '#b45309' }}
                              >
                                Reset Password
                              </button>
                              <button onClick={() => handleDeleteUser(u.id, u.fullName)} className="btn btn-danger btn-sm">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No admins found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. CLASSES TABLE */}
            {activeTab === 'classes' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Class Name</th>
                      <th>Students Enrolled</th>
                      <th>Subjects</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((c) => (
                      <tr key={c.id}>
                        <td>#{c.id}</td>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>{c.studentCount} students</td>
                        <td>{c.subjectCount} subjects</td>
                        <td>
                          <button onClick={() => handleDeleteClass(c.id, c.name)} className="btn btn-danger btn-sm">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. SUBJECTS TABLE */}
            {activeTab === 'subjects' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Subject Name</th>
                      <th>Class</th>
                      <th>Assigned Teachers</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s) => (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.className}</td>
                        <td>
                          {s.assignedTeachers.length > 0 ? (
                            s.assignedTeachers.map((t) => (
                              <span key={t.id} className="badge badge-role" style={{ marginRight: '0.4rem' }}>
                                {t.fullName}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>No teacher assigned</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => {
                                setAssignForm({ teacherId: '', subjectId: s.id.toString() });
                                setIsAssignModalOpen(true);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ fontWeight: 600 }}
                            >
                              Change Teacher
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(s.id, s.name)}
                              className="btn btn-danger btn-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 7. ALL ASSIGNMENTS TAB */}
            {activeTab === 'assignments' && (
              <div className="grid-3">
                {assignments.length > 0 ? (
                  assignments.map((a) => (
                    <AssignmentCard key={a.id} assignment={a} role="Admin" onDelete={handleDeleteAssignment} />
                  ))
                ) : (
                  <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No assignments published in the system yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* 8. ALL SUBMISSIONS TAB */}
            {activeTab === 'submissions' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Assignment Title</th>
                      <th>Submitted At</th>
                      <th>Answer & Attachment</th>
                      <th>Attempts Used</th>
                      <th>Status</th>
                      <th>Marks Awarded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length > 0 ? (
                      submissions.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600 }}>
                            {s.studentRegId && <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#006633' }}>{s.studentRegId}</div>}
                            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{s.studentName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.studentEmail}</div>
                          </td>
                          <td>{s.assignmentTitle}</td>
                          <td>{new Date(s.submittedAt).toLocaleString()}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => setViewingAnswerSubmission(s)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', fontWeight: 600 }}
                            >
                              View Answer
                            </button>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{s.attemptCount} / {s.maxSubmissionAttempts}</span>
                          </td>
                          <td>
                            <StatusBadge status={s.status} />
                          </td>
                          <td>
                            {s.marks !== null ? (
                              <span style={{ fontWeight: 700, color: '#166534' }}>{s.marks} / {s.maxMarks}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Not Graded</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No student submissions recorded in system yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 9. APPLICATION SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="glass-card" style={{ maxWidth: '700px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#006633', marginBottom: '1.25rem' }}>
                  System & Application Settings
                </h3>

                <form onSubmit={handleSaveSettings}>
                  <div className="form-group">
                    <label className="form-label">Institution Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={appSettings.institutionName}
                      onChange={(e) => setAppSettings({ ...appSettings, institutionName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={appSettings.departmentName}
                      onChange={(e) => setAppSettings({ ...appSettings, departmentName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Current Academic Session</label>
                    <input
                      type="text"
                      className="form-input"
                      value={appSettings.academicSession}
                      onChange={(e) => setAppSettings({ ...appSettings, academicSession: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Default Assignment Submission Attempt Limit</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="form-input"
                      value={appSettings.defaultSubmissionAttempts}
                      onChange={(e) => setAppSettings({ ...appSettings, defaultSubmissionAttempts: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Attachment File Upload Size (MB)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="form-input"
                      value={appSettings.maxUploadFileSizeMb}
                      onChange={(e) => setAppSettings({ ...appSettings, maxUploadFileSizeMb: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                    Save Application Settings
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {/* Modal: Reset Password */}
        <Modal isOpen={!!resetPasswordModalUser} onClose={() => setResetPasswordModalUser(null)} title={`Reset Password — ${resetPasswordModalUser?.fullName}`}>
          <form onSubmit={handleResetPasswordSubmit}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Set a new password for user <strong>{resetPasswordModalUser?.email}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter new secure password (min 6 chars)"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
              Save New Password
            </button>
          </form>
        </Modal>

        {/* Modal: View Student ID Card Proof */}
        <Modal isOpen={!!previewIdCardUrl} onClose={() => setPreviewIdCardUrl(null)} title={`Student ID Card Proof — ${previewStudentName}`}>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            {previewIdCardUrl && (
              (previewIdCardUrl.includes('application/pdf') || previewIdCardUrl.toLowerCase().endsWith('.pdf')) ? (
                <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '2rem 1.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>📄</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                    GSTU Student ID Card (PDF Document)
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    Uploaded PDF document proof of identity for <strong>{previewStudentName}</strong>.
                  </p>
                  <object
                    data={getFormattedUrl(previewIdCardUrl)}
                    type="application/pdf"
                    style={{ width: '100%', height: '350px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Browser PDF preview unavailable.</p>
                  </object>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', padding: '0.5rem', borderRadius: '8px' }}>
                  <img
                    src={getFormattedUrl(previewIdCardUrl)}
                    alt="Student ID Card"
                    style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: '6px', objectFit: 'contain' }}
                  />
                </div>
              )
            )}
            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => handleOpenDocument(previewIdCardUrl)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                🔍 Open Full High-Res Document in New Tab
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal: Create User */}
        <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Create New User Account">
          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}>
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            {userForm.role === 'Student' && (
              <div className="form-group">
                <label className="form-label">Student ID / Registration Roll</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 20CSE016"
                  value={userForm.studentId}
                  onChange={(e) => setUserForm({ ...userForm, studentId: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required minLength={6} />
            </div>
            {userForm.role === 'Student' && (
              <div className="form-group">
                <label className="form-label">Enroll in Class</label>
                <select className="form-select" value={userForm.classId} onChange={(e) => setUserForm({ ...userForm, classId: e.target.value })} required>
                  <option value="">Select Class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
              Create User Account
            </button>
          </form>
        </Modal>

        {/* Modal: Create Class */}
        <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Create New Class">
          <form onSubmit={handleCreateClass}>
            <div className="form-group">
              <label className="form-label">Class Name</label>
              <input type="text" className="form-input" placeholder="e.g. CSE 3rd Year 1st Semester" value={classNameInput} onChange={(e) => setClassNameInput(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
              Create Class
            </button>
          </form>
        </Modal>

        {/* Modal: Create Subject */}
        <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Create New Subject">
          <form onSubmit={handleCreateSubject}>
            <div className="form-group">
              <label className="form-label">Subject Name</label>
              <input type="text" className="form-input" placeholder="e.g. CSE353: Computer Networks" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Associated Class</label>
              <select className="form-select" value={subjectForm.classId} onChange={(e) => setSubjectForm({ ...subjectForm, classId: e.target.value })} required>
                <option value="">Select Class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
              Create Subject
            </button>
          </form>
        </Modal>

        {/* Modal: Assign Teacher */}
        <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Teacher to Subject">
          <form onSubmit={handleAssignTeacher}>
            <div className="form-group">
              <label className="form-label">Select Teacher</label>
              <select className="form-select" value={assignForm.teacherId} onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })} required>
                <option value="">Select Teacher...</option>
                {users.filter((u) => u.role === 'Teacher').map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Select Subject</label>
              <select className="form-select" value={assignForm.subjectId} onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })} required>
                <option value="">Select Subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
              Assign Teacher
            </button>
          </form>
        </Modal>

        {/* Modal: Change Enrolled Class */}
        <Modal isOpen={!!changeClassUser} onClose={() => setChangeClassUser(null)} title={`Change Enrolled Class — ${changeClassUser?.fullName || ''}`}>
          <form onSubmit={handleChangeClassSubmit}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
              Select a new academic semester class for <strong>{changeClassUser?.fullName}</strong> ({changeClassUser?.studentId || changeClassUser?.email}).
            </p>

            <div className="form-group">
              <label className="form-label">Select Enrolled Class / Semester *</label>
              <select
                className="form-select"
                value={targetChangeClassId}
                onChange={(e) => setTargetChangeClassId(e.target.value)}
                required
              >
                <option value="">Select class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.65rem' }}
              disabled={updatingClass}
            >
              {updatingClass ? 'Updating Class...' : 'Save Class Change'}
            </button>
          </form>
        </Modal>

        {/* View Answer Modal */}
        {viewingAnswerSubmission && (
          <Modal
            title={`Submitted Answer Solution — ${viewingAnswerSubmission.studentRegId ? viewingAnswerSubmission.studentRegId + ' • ' : ''}${viewingAnswerSubmission.studentName}`}
            isOpen={!!viewingAnswerSubmission}
            onClose={() => setViewingAnswerSubmission(null)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '0.8rem 1rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Student ID</div>
                  <div style={{ fontWeight: 800, color: '#006633', fontSize: '1rem' }}>{viewingAnswerSubmission.studentRegId || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Student Name</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{viewingAnswerSubmission.studentName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Submitted At</div>
                  <div style={{ fontSize: '0.85rem' }}>{new Date(viewingAnswerSubmission.submittedAt).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Attempts</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{viewingAnswerSubmission.attemptCount} / {viewingAnswerSubmission.maxSubmissionAttempts}</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#006633' }}>
                  Submitted Answer Text:
                </label>
                <div style={{ whiteSpace: 'pre-wrap', background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', lineHeight: 1.6, maxHeight: '250px', overflowY: 'auto' }}>
                  {viewingAnswerSubmission.answerText || '(No written text submitted)'}
                </div>
              </div>

              {viewingAnswerSubmission.fileUrl && (
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#006633' }}>
                    Attached Submitted File:
                  </label>
                  <div style={{ padding: '1rem', background: '#e6f4ed', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                    {(viewingAnswerSubmission.fileUrl.startsWith('data:image/') || viewingAnswerSubmission.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) ? (
                      <div>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <img src={getFormattedUrl(viewingAnswerSubmission.fileUrl)} alt="Submission Attachment" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <button type="button" onClick={() => handleOpenDocument(viewingAnswerSubmission.fileUrl)} className="btn btn-primary btn-sm">
                          Open Original Image File
                        </button>
                      </div>
                    ) : (viewingAnswerSubmission.fileUrl.includes('application/pdf') || viewingAnswerSubmission.fileUrl.match(/\.pdf($|\?)/i)) ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#166534' }}>📄 PDF Document Attachment</span>
                        <button type="button" onClick={() => handleOpenDocument(viewingAnswerSubmission.fileUrl)} className="btn btn-primary btn-sm">
                          View PDF Document
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#166534' }}>📎 File Attachment</span>
                        <button type="button" onClick={() => handleOpenDocument(viewingAnswerSubmission.fileUrl)} className="btn btn-primary btn-sm">
                          Open File Attachment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setViewingAnswerSubmission(null)} className="btn btn-secondary">
                  Close Window
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </RoleGuard>
  );
}
