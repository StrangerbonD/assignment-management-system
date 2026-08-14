'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RoleGuard } from '../../../components/Protection/RoleGuard';
import { useAuth } from '../../../context/AuthContext';
import { Assignment, Submission, SubjectItem, ClassItem, Enrollment } from '../../../lib/types';
import { api } from '../../../lib/api';
import { AssignmentCard } from '../../../components/AssignmentCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { GradeSubmissionModal } from '../../../components/GradeSubmissionModal';
import { CourseMarksheetTable } from '../../../components/CourseMarksheetTable';
import { Modal } from '../../../components/Modal';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<Enrollment[]>([]);

  // Filtering states
  const [selectedClassId, setSelectedClassId] = useState<number | 'ALL'>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | 'ALL'>('ALL');

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [viewingAnswerSubmission, setViewingAnswerSubmission] = useState<Submission | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'assignments' | 'submissions' | 'enrollments'>('courses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [aRes, sRes, subRes, cRes, enrollRes] = await Promise.all([
        api.getAssignments(),
        api.getSubmissions(),
        api.getSubjects(),
        api.getClasses(),
        api.getTeacherPendingEnrollments(),
      ]);
      const teacherAssignedSubjects = user
        ? subRes.filter((s) => s.assignedTeachers && s.assignedTeachers.some((t) => t.id === user.id))
        : subRes;

      setAssignments(aRes);
      setSubmissions(sRes);
      setSubjects(teacherAssignedSubjects);
      setClasses(cRes);
      setPendingEnrollments(enrollRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher dashboard data.');
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
  }, [user]);

  const handleApproveEnrollment = async (id: number) => {
    try {
      setActionSuccess(null);
      setError(null);
      await api.approveEnrollment(id);
      setActionSuccess('✓ Student retake course enrollment approved successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve enrollment.');
    }
  };

  const handleRejectEnrollment = async (id: number) => {
    if (!confirm('Are you sure you want to reject this retake enrollment request?')) return;
    try {
      setActionSuccess(null);
      setError(null);
      await api.rejectEnrollment(id);
      setActionSuccess('Retake enrollment request rejected.');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject enrollment.');
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.deleteAssignment(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenGradeModal = (sub: Submission) => {
    setSelectedSubmission(sub);
    setIsGradeModalOpen(true);
  };

  const pendingSubmissionsCount = submissions.filter((s) => s.status !== 'Graded').length;

  // Filter subjects by selected semester class
  const classFilteredSubjects = selectedClassId === 'ALL'
    ? subjects
    : subjects.filter((s) => s.classId === selectedClassId);

  // Filter subjects by selected course
  const finalFilteredSubjects = selectedSubjectId === 'ALL'
    ? classFilteredSubjects
    : classFilteredSubjects.filter((s) => s.id === selectedSubjectId);

  // Filter assignments by semester class & subject
  const filteredAssignments = assignments.filter((a) => {
    if (selectedClassId !== 'ALL' && a.classId !== selectedClassId) return false;
    if (selectedSubjectId !== 'ALL' && a.subjectId !== selectedSubjectId) return false;
    return true;
  });

  // Filter submissions by semester class & subject
  const filteredSubmissions = submissions.filter((s) => {
    const assignmentObj = assignments.find((a) => a.id === s.assignmentId);
    if (!assignmentObj) return false;
    if (selectedClassId !== 'ALL' && assignmentObj.classId !== selectedClassId) return false;
    if (selectedSubjectId !== 'ALL' && assignmentObj.subjectId !== selectedSubjectId) return false;
    return true;
  });

  return (
    <RoleGuard allowedRoles={['Teacher']}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#006633' }}>Teacher Academic Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Manage your course subjects, publish assignments, grade submissions, and approve student retake requests.
            </p>
          </div>
          <Link href="/assignments/create" className="btn btn-primary btn-sm">
            Create New Assignment
          </Link>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}

        {/* Overview Stats Bar */}
        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          <div className="glass-card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Courses / Subjects</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#006633', marginTop: '0.2rem' }}>
              {subjects.length} Courses
            </div>
          </div>
          <div className="glass-card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Assignments</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#006633', marginTop: '0.2rem' }}>
              {assignments.length} Created
            </div>
          </div>
          <div className="glass-card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Evaluations</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: pendingSubmissionsCount > 0 ? '#d97706' : '#166534', marginTop: '0.2rem' }}>
              {pendingSubmissionsCount} Pending
            </div>
          </div>
        </div>

        {/* 🏫 Semester-Wise Filter Selector Bar */}
        {classes.length > 0 && (
          <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#006633' }}>Filter by Semester Class:</span>
              <button
                onClick={() => {
                  setSelectedClassId('ALL');
                  setSelectedSubjectId('ALL');
                }}
                className={`btn btn-sm ${selectedClassId === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontWeight: 700 }}
              >
                All Semesters ({subjects.length} Courses)
              </button>

              {classes.map((cls) => {
                const classSubjectCount = subjects.filter((s) => s.classId === cls.id).length;
                const isSelected = selectedClassId === cls.id;
                return (
                  <button
                    key={cls.id}
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setSelectedSubjectId('ALL');
                    }}
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontWeight: isSelected ? 700 : 500 }}
                  >
                    {cls.name} ({classSubjectCount})
                  </button>
                );
              })}
            </div>

            {/* Course Filter Selector under selected Semester */}
            {classFilteredSubjects.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Course Filter:</span>
                <button
                  onClick={() => setSelectedSubjectId('ALL')}
                  className={`btn btn-sm ${selectedSubjectId === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                >
                  All Courses in Selected Semester
                </button>
                {classFilteredSubjects.map((sub) => {
                  const count = assignments.filter((a) => a.subjectId === sub.id).length;
                  const isSelected = selectedSubjectId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubjectId(sub.id)}
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', fontWeight: isSelected ? 700 : 500 }}
                    >
                      {sub.name} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('courses')}
            style={{
              padding: '0.6rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'courses' ? '3px solid #006633' : '3px solid transparent',
              color: activeTab === 'courses' ? '#006633' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            My Courses & Subjects ({finalFilteredSubjects.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            style={{
              padding: '0.6rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'assignments' ? '3px solid #006633' : '3px solid transparent',
              color: activeTab === 'assignments' ? '#006633' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Course Assignments ({filteredAssignments.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            style={{
              padding: '0.6rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'submissions' ? '3px solid #006633' : '3px solid transparent',
              color: activeTab === 'submissions' ? '#006633' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Student Submissions ({filteredSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('enrollments')}
            style={{
              padding: '0.6rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'enrollments' ? '3px solid #d97706' : '3px solid transparent',
              color: activeTab === 'enrollments' ? '#d97706' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Pending Retake Approvals ({pendingEnrollments.length})
            {pendingEnrollments.length > 0 && (
              <span className="badge" style={{ background: '#ef4444', color: '#fff', marginLeft: '0.4rem', borderRadius: '999px', fontSize: '0.7rem' }}>
                {pendingEnrollments.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Loading academic data...</div>
        ) : (
          <>
            {/* TAB 1: COURSES & SUBJECTS LIST */}
            {activeTab === 'courses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {finalFilteredSubjects.length > 0 ? (
                  finalFilteredSubjects.map((sub) => {
                    const subAssignments = assignments.filter((a) => a.subjectId === sub.id);
                    return (
                      <div key={sub.id} className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <span className="badge badge-role" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
                              Semester: {sub.className}
                            </span>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#006633' }}>{sub.name}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              Assigned Faculty Member for {sub.className} at CSE GSTU Department.
                            </p>
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#006633' }}>
                            {subAssignments.length} Assignments
                          </div>
                        </div>

                        {subAssignments.length > 0 ? (
                          <div className="grid-3" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                            {subAssignments.map((a) => (
                              <AssignmentCard key={a.id} assignment={a} role="Teacher" onDelete={handleDeleteAssignment} />
                            ))}
                          </div>
                        ) : (
                          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '6px', textAlign: 'center', border: '1px dashed #cbd5e1', marginBottom: '1.5rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                              No assignments published for {sub.name} yet.
                            </p>
                            <Link href={`/assignments/create?subjectId=${sub.id}`} className="btn btn-secondary btn-sm">
                              Create Assignment for {sub.name}
                            </Link>
                          </div>
                        )}

                        {/* 📊 Course Marksheet & Grade Summary Table (with CSV & PDF Export) */}
                        <CourseMarksheetTable subjectId={sub.id} />
                      </div>
                    );
                  })
                ) : (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No courses found for the selected semester filter.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ASSIGNMENTS LIST */}
            {activeTab === 'assignments' && (
              <div className="grid-3">
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((a) => (
                    <AssignmentCard key={a.id} assignment={a} role="Teacher" onDelete={handleDeleteAssignment} />
                  ))
                ) : (
                  <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No assignments found for the selected semester/course filter.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: STUDENT SUBMISSIONS LIST */}
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
                      <th>Marks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.length > 0 ? (
                      filteredSubmissions.map((s) => (
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
                          <td>
                            <button onClick={() => handleOpenGradeModal(s)} className="btn btn-primary btn-sm">
                              {s.status === 'Graded' ? 'Edit Grade' : 'Grade Submission'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No student submissions found matching the selected semester/course filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: PENDING RETAKE COURSE ENROLLMENT REQUESTS */}
            {activeTab === 'enrollments' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student Roll / ID</th>
                      <th>Student Name</th>
                      <th>Student Primary Semester</th>
                      <th>Requested Retake Course</th>
                      <th>Course Semester</th>
                      <th>Requested At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingEnrollments.length > 0 ? (
                      pendingEnrollments.map((e) => (
                        <tr key={e.id}>
                          <td style={{ fontWeight: 700, color: '#006633' }}>
                            {e.studentIdRoll || 'N/A'}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {e.studentName}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.studentEmail}</div>
                          </td>
                          <td>
                            <span className="badge badge-role">{e.studentClassName || 'Unassigned'}</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            {e.subjectName}
                          </td>
                          <td>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{e.subjectClassName}</span>
                          </td>
                          <td>{new Date(e.requestedAt).toLocaleString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button onClick={() => handleApproveEnrollment(e.id)} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
                                Approve Retake
                              </button>
                              <button onClick={() => handleRejectEnrollment(e.id)} className="btn btn-danger btn-sm">
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No pending retake course enrollment requests at this time.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Grade Submission Modal */}
        <GradeSubmissionModal
          isOpen={isGradeModalOpen}
          onClose={() => setIsGradeModalOpen(false)}
          submission={selectedSubmission}
          onGraded={() => {
            setIsGradeModalOpen(false);
            fetchData();
          }}
        />

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
