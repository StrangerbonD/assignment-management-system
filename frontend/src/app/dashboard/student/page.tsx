'use client';

import React, { useState, useEffect } from 'react';
import { RoleGuard } from '../../../components/Protection/RoleGuard';
import { useAuth } from '../../../context/AuthContext';
import { Assignment, Submission, SubjectItem, Enrollment } from '../../../lib/types';
import { api } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import { Modal } from '../../../components/Modal';
import { CourseMarksheetTable } from '../../../components/CourseMarksheetTable';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | 'ALL'>('ALL');

  // Modal State for Retake Request
  const [isRetakeModalOpen, setIsRetakeModalOpen] = useState(false);
  const [targetRetakeSubjectId, setTargetRetakeSubjectId] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [retakeMsg, setRetakeMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [aRes, sRes, subRes, allSubRes, enrollRes] = await Promise.all([
        api.getAssignments(),
        api.getSubmissions(),
        api.getSubjects(),
        api.getSubjects(),
        api.getStudentEnrollments(),
      ]);
      setAssignments(aRes);
      setSubmissions(sRes);
      setSubjects(subRes);
      setAllSubjects(allSubRes);
      setEnrollments(enrollRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestRetake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRetakeSubjectId) return;

    try {
      setRequesting(true);
      setError(null);
      setRetakeMsg(null);
      await api.requestEnrollment(Number(targetRetakeSubjectId));
      setRetakeMsg('✓ Retake course request submitted! Awaiting Teacher approval.');
      setTargetRetakeSubjectId('');
      setIsRetakeModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit retake request.');
    } finally {
      setRequesting(false);
    }
  };

  // Map submissions to assignments for quick status lookup
  const submissionMap = new Map<number, Submission>();
  submissions.forEach((s) => submissionMap.set(s.assignmentId, s));

  // Filter assignments by selected course
  const filteredAssignments = selectedSubjectId === 'ALL'
    ? assignments
    : assignments.filter((a) => a.subjectId === selectedSubjectId);

  // Group assignments by subject/course
  const groupedAssignments: Record<string, Assignment[]> = {};
  filteredAssignments.forEach((a) => {
    const key = `${a.className} • ${a.subjectName}`;
    if (!groupedAssignments[key]) groupedAssignments[key] = [];
    groupedAssignments[key].push(a);
  });

  const pendingEnrollments = enrollments.filter((e) => !e.isApproved);
  const approvedEnrollments = enrollments.filter((e) => e.isApproved);
  const approvedSubjectIds = new Set(approvedEnrollments.map((e) => e.subjectId));

  // Enrolled subjects: Only subjects in student's primary class OR approved retake courses
  const enrolledSubjects = allSubjects.filter((s) => {
    const isPrimaryClassSubject = user?.classId ? s.classId === user.classId : true;
    const isApprovedRetake = user?.classId ? (s.classId < user.classId && approvedSubjectIds.has(s.id)) : approvedSubjectIds.has(s.id);
    return isPrimaryClassSubject || isApprovedRetake;
  });

  // Helper to extract year number from class name (e.g. "CSE 2nd Year 1st Semester" -> 2)
  const getYearNum = (className?: string | null) => {
    if (!className) return 0;
    if (className.includes('1st Year')) return 1;
    if (className.includes('2nd Year')) return 2;
    if (className.includes('3rd Year')) return 3;
    if (className.includes('4th Year')) return 4;
    return 0;
  };

  const studentYear = getYearNum(user?.className);

  // Available subjects for retake: STRICTLY LOWER SEMESTERS ONLY
  const availableRetakeSubjects = allSubjects.filter((s) => {
    const subjectYear = getYearNum(s.className);
    if (studentYear > 0 && subjectYear > 0) {
      if (subjectYear >= studentYear) return false; // Must be strictly lower semester year
    } else if (user?.classId) {
      if (s.classId >= user.classId) return false; // Must be strictly lower classId
    }

    if (enrollments.some((e) => e.subjectId === s.id)) return false; // Skip already requested/approved subjects
    return true;
  });

  return (
    <RoleGuard allowedRoles={['Student']}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#006633' }}>Student Portal</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Welcome, <span style={{ fontWeight: 700 }}>{user?.fullName}</span>! Enrolled Primary Semester: <span style={{ color: '#006633', fontWeight: 700 }}>{user?.className || 'Unassigned'}</span>
            </p>
          </div>
          <button onClick={() => setIsRetakeModalOpen(true)} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
            Apply for Retake / Backlog Course
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {retakeMsg && <div className="alert alert-success">{retakeMsg}</div>}

        {/* Pending Retake Requests Notice Banner */}
        {pendingEnrollments.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 800, color: '#92400e', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Pending Retake / Backlog Course Enrollment Requests ({pendingEnrollments.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {pendingEnrollments.map((pe) => (
                <div key={pe.id} style={{ fontSize: '0.85rem', color: '#78350f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef3c7', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                  <span>
                    <strong>{pe.subjectName}</strong> ({pe.subjectClassName}) — Submitted on {new Date(pe.requestedAt).toLocaleDateString()}
                  </span>
                  <span className="badge" style={{ background: '#d97706', color: '#fff', fontSize: '0.75rem' }}>
                    Awaiting Teacher Approval
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Selection & Filter Bar */}
        {enrolledSubjects.length > 0 && (
          <div style={{ background: '#ffffff', padding: '0.85rem 1.1rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#006633' }}>Your Enrolled Courses:</span>
            <button
              onClick={() => setSelectedSubjectId('ALL')}
              className={`btn btn-sm ${selectedSubjectId === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All Courses ({enrolledSubjects.length})
            </button>
            {enrolledSubjects.map((sub) => {
              const count = assignments.filter((a) => a.subjectId === sub.id).length;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`btn btn-sm ${selectedSubjectId === sub.id ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {sub.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Loading course assignments...</div>
        ) : Object.keys(groupedAssignments).length > 0 ? (
          <div>
            {Object.entries(groupedAssignments).map(([courseName, courseAssignments]) => (
              <div key={courseName} style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '2px solid #e6f4ed', paddingBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#006633' }}>
                    {courseName} ({courseAssignments.length} assignments)
                  </h2>
                </div>

                <div className="grid-2">
                  {courseAssignments.map((assignment) => {
                    const sub = submissionMap.get(assignment.id);
                    const formattedDeadline = new Date(assignment.deadline).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    });

                    return (
                      <div key={assignment.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#006633', fontWeight: 700 }}>
                              {assignment.className} • {assignment.subjectName}
                            </span>
                            {sub ? <StatusBadge status={sub.status} /> : <StatusBadge status="Pending" />}
                          </div>

                          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', color: 'var(--text-main)', fontWeight: 700, textAlign: 'left', wordBreak: 'break-word' }}>{assignment.title}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', textAlign: 'justify', textAlignLast: 'left', wordBreak: 'break-word' }}>
                            {assignment.description}
                          </p>
                        </div>

                        <div>
                          <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', marginBottom: '0.85rem', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Max Marks:</span>
                              <span style={{ fontWeight: 600 }}>{assignment.maxMarks}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Deadline:</span>
                              <span style={{ fontWeight: 600, color: assignment.isOverdue ? '#dc2626' : 'var(--text-main)' }}>
                                {formattedDeadline} {assignment.isOverdue && '(Expired)'}
                              </span>
                            </div>

                            {sub && sub.marks !== null && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid #e2e8f0' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Your Grade:</span>
                                <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem' }}>
                                  {sub.marks} / {sub.maxMarks}
                                </span>
                              </div>
                            )}

                            {sub && sub.feedback && (
                              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                                Teacher Feedback: &quot;{sub.feedback}&quot;
                              </div>
                            )}
                          </div>

                          <Link href={`/assignments/${assignment.id}`} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                            {sub ? 'View / Manage Submission' : 'Submit Answer'}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 📊 Course Marksheet & Grade Summary Table (Student View) */}
                {courseAssignments.length > 0 && (
                  <CourseMarksheetTable subjectId={courseAssignments[0].subjectId} currentUserId={user?.id} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No published assignments available for the selected course at this time.</p>
          </div>
        )}

        {/* Modal: Apply for Retake / Backlog Course */}
        <Modal isOpen={isRetakeModalOpen} onClose={() => setIsRetakeModalOpen(false)} title="Apply for Retake / Backlog Course">
          <form onSubmit={handleRequestRetake}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Select a course from a lower or different semester to apply for retake enrollment. Your request will be sent to the corresponding course Faculty Member for approval.
            </p>

            <div className="form-group">
              <label className="form-label">Select Retake Course *</label>
              <select
                className="form-select"
                value={targetRetakeSubjectId}
                onChange={(e) => setTargetRetakeSubjectId(e.target.value)}
                required
              >
                <option value="">Select course subject...</option>
                {availableRetakeSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.className} — {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {availableRetakeSubjects.length === 0 && (
              <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>
                No additional retake courses available or all courses have already been requested.
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.65rem' }}
              disabled={requesting || availableRetakeSubjects.length === 0}
            >
              {requesting ? 'Submitting Request...' : 'Submit Retake Request to Teacher'}
            </button>
          </form>
        </Modal>
      </div>
    </RoleGuard>
  );
}
