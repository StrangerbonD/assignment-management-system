'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Assignment, Submission } from '../../../lib/types';
import { api } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import { GradeSubmissionModal } from '../../../components/GradeSubmissionModal';
import { Modal } from '../../../components/Modal';

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = Number(params?.id);
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentSubmission, setStudentSubmission] = useState<Submission | null>(null);

  // Form states for Student submission
  const [answerText, setAnswerText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Teacher grading & viewing state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [viewingAnswerSubmission, setViewingAnswerSubmission] = useState<Submission | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!assignmentId) return;
    try {
      setLoading(true);
      setError(null);
      const aRes = await api.getAssignmentById(assignmentId);
      setAssignment(aRes);

      if (user?.role === 'Student') {
        const mySubmissions = await api.getSubmissionsForAssignment(assignmentId);
        if (mySubmissions.length > 0) {
          const mySub = mySubmissions[0];
          setStudentSubmission(mySub);
          setAnswerText(mySub.answerText);
          setFileUrl(mySub.fileUrl || '');
        }
      } else {
        const allSubs = await api.getSubmissionsForAssignment(assignmentId);
        setSubmissions(allSubs);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assignment details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [assignmentId, user]);

  const handleStudentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      setError(null);
      const res = await api.uploadFile(file);
      setFileUrl(res.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload answer file.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!answerText.trim()) {
      setError('Please write an answer before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      if (studentSubmission) {
        // Update submission
        await api.updateSubmission(studentSubmission.id, {
          answerText,
          fileUrl: fileUrl.trim() || undefined,
        });
        setSuccessMsg('Your submission has been updated and replaced in the database successfully!');
        setIsEditing(false);
      } else {
        // Create new submission
        await api.createSubmission({
          assignmentId,
          answerText,
          fileUrl: fileUrl.trim() || undefined,
        });
        setSuccessMsg('Your answer has been submitted successfully!');
      }
      loadData();
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const isImageFile = (url?: string | null) => {
    if (!url) return false;
    return url.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
  };

  const isPdfFile = (url?: string | null) => {
    if (!url) return false;
    return url.startsWith('data:application/pdf') || /\.pdf(\?.*)?$/i.test(url);
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading assignment details...</div>;
  }

  if (error || !assignment) {
    return <div className="alert alert-danger">{error || 'Assignment not found.'}</div>;
  }

  const isExpired = assignment.isOverdue;
  const maxAttempts = assignment.maxSubmissionAttempts || 2;
  const currentAttempts = studentSubmission?.attemptCount || 0;
  const remainingAttempts = studentSubmission ? studentSubmission.remainingAttempts : maxAttempts;
  const hasNoRemainingAttempts = studentSubmission ? studentSubmission.remainingAttempts <= 0 : false;

  return (
    <div>
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <StatusBadge status={assignment.status} />
              <span style={{ fontSize: '0.85rem', color: '#006633', fontWeight: 600 }}>
                {assignment.className} • {assignment.subjectName}
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', color: '#006633', fontWeight: 800, textAlign: 'left', wordBreak: 'break-word' }}>{assignment.title}</h1>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Course Teacher</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{assignment.creatorName}</div>
            </div>
            {(user?.role === 'Teacher' || user?.role === 'Admin') && (
              <a href={`/assignments/${assignment.id}/edit`} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
                Edit Assignment
              </a>
            )}
          </div>
        </div>

        <p style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap', marginBottom: '1.5rem', lineHeight: '1.6', textAlign: 'justify', textAlignLast: 'left', wordBreak: 'break-word' }}>
          {assignment.description}
        </p>

        {/* Question File Attachment Display */}
        {assignment.attachmentUrl && (
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: '#006633' }}>
              Question File Attachment
            </div>

            {isImageFile(assignment.attachmentUrl) ? (
              <div>
                <img
                  src={getFormattedUrl(assignment.attachmentUrl)}
                  alt="Question Attachment"
                  style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }}
                />
                <div>
                  <button type="button" onClick={() => handleOpenDocument(assignment.attachmentUrl)} className="btn btn-secondary btn-sm">
                    View Full Question Image
                  </button>
                </div>
              </div>
            ) : isPdfFile(assignment.attachmentUrl) ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Question Paper PDF Document</div>
                  <button type="button" onClick={() => handleOpenDocument(assignment.attachmentUrl)} className="btn btn-primary btn-sm" style={{ marginTop: '0.3rem' }}>
                    Open / Download Question PDF
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ overflowWrap: 'anywhere' }}>
                <button type="button" onClick={() => handleOpenDocument(assignment.attachmentUrl)} className="btn btn-secondary btn-sm">
                  Open Question File Attachment
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '2rem', background: '#f1f5f9', padding: '1rem', borderRadius: '6px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Max Marks: </span>
            <span style={{ fontWeight: 800, color: '#006633' }}>{assignment.maxMarks}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Submission Attempt Limit: </span>
            <span style={{ fontWeight: 800, color: '#006633' }}>{maxAttempts} attempts max</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Deadline: </span>
            <span style={{ fontWeight: 600, color: isExpired ? '#dc2626' : 'var(--text-main)' }}>
              {new Date(assignment.deadline).toLocaleString()} {isExpired && '(Past Deadline)'}
            </span>
          </div>
        </div>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Student View: Submission Form / Status */}
      {user?.role === 'Student' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#006633' }}>Your Submission</h2>
            
            {/* Submission Limit Badge */}
            <div style={{ background: remainingAttempts > 0 ? '#e6f4ed' : '#fef2f2', border: `1px solid ${remainingAttempts > 0 ? '#a3e0c0' : '#fecaca'}`, padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, color: remainingAttempts > 0 ? '#006633' : '#991b1b' }}>
              Submission Limit: {currentAttempts} / {maxAttempts} used ({remainingAttempts} remaining)
            </div>
          </div>

          {isExpired && !studentSubmission ? (
            <div className="alert alert-danger">
              The submission deadline has passed. Submissions are now closed for this assignment.
            </div>
          ) : studentSubmission && !isEditing ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <StatusBadge status={studentSubmission.status} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Submitted At: {new Date(studentSubmission.submittedAt).toLocaleString()}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Your Submitted Answer Text:</div>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>{studentSubmission.answerText}</div>
                
                {studentSubmission.fileUrl && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Attached Answer File (PDF / Image):
                    </div>
                    {isImageFile(studentSubmission.fileUrl) ? (
                      <div>
                        <img
                          src={studentSubmission.fileUrl}
                          alt="Student Submitted Answer"
                          style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.4rem' }}
                        />
                        <div>
                          <a href={studentSubmission.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                            View Submitted Image
                          </a>
                        </div>
                      </div>
                    ) : isPdfFile(studentSubmission.fileUrl) ? (
                      <a href={studentSubmission.fileUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                        View Submitted Answer PDF
                      </a>
                    ) : (
                      <a href={studentSubmission.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#006633', textDecoration: 'underline' }}>
                        Open Attached File Link
                      </a>
                    )}
                  </div>
                )}
              </div>

              {studentSubmission.marks !== null && (
                <div className="alert alert-success" style={{ display: 'block' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                    Score: {studentSubmission.marks} / {assignment.maxMarks}
                  </div>
                  {studentSubmission.feedback && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
                      Teacher Feedback: &quot;{studentSubmission.feedback}&quot; (Graded by {studentSubmission.graderName})
                    </div>
                  )}
                </div>
              )}

              {!isExpired && !hasNoRemainingAttempts && (
                <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                  Edit / Resubmit Answer ({remainingAttempts} attempt remaining)
                </button>
              )}

              {hasNoRemainingAttempts && (
                <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
                  You have reached the maximum allowed limit of {maxAttempts} submission attempts for this assignment. Your final submission is locked.
                </div>
              )}

              {isExpired && !hasNoRemainingAttempts && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                  Deadline has passed. Your submission is now read-only.
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleStudentSubmit}>
              {isExpired && (
                <div className="alert alert-danger">
                  Deadline has passed. Submissions are read-only.
                </div>
              )}

              {hasNoRemainingAttempts && (
                <div className="alert alert-danger">
                  You have reached the maximum limit of {maxAttempts} submission attempts. Resubmissions are closed.
                </div>
              )}

              <div className="form-group">
                <label htmlFor="answerText" className="form-label">Your Answer Text</label>
                <textarea
                  id="answerText"
                  name="answerText"
                  className="form-textarea"
                  placeholder="Type your response or assignment solution here..."
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  disabled={isExpired || hasNoRemainingAttempts}
                  required
                />
              </div>

              {/* Student File Upload (PDF or Image) */}
              <div className="form-group" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                <label htmlFor="answerFileInput" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📎 Answer File Attachment (PDF or Image)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <input
                    id="answerFileInput"
                    name="answerFileInput"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleStudentFileUpload}
                    className="form-input"
                    disabled={isExpired || hasNoRemainingAttempts || uploadingFile}
                  />
                  {uploadingFile && <div style={{ fontSize: '0.8rem', color: '#006633' }}>Uploading answer file...</div>}

                  <label htmlFor="answerFileUrl" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>- OR enter file / project repository URL -</label>

                  <input
                    id="answerFileUrl"
                    name="answerFileUrl"
                    type="text"
                    className="form-input"
                    placeholder="https://github.com/myrepo or Google Drive link"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    disabled={isExpired || hasNoRemainingAttempts}
                  />
                </div>

                {fileUrl && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: '#e6f4ed', borderRadius: '4px', fontSize: '0.85rem', color: '#006633', overflowWrap: 'anywhere' }}>
                    ✅ Attached File: {isImageFile(fileUrl) ? (
                      <div style={{ marginTop: '0.4rem' }}>
                        <img src={fileUrl} alt="Attached Preview" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    ) : isPdfFile(fileUrl) ? (
                      <a href={fileUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', fontWeight: 600 }}>
                        📄 View PDF Document Attachment
                      </a>
                    ) : (
                      <a href={fileUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', fontWeight: 600 }}>
                        📎 Open File Attachment ({fileUrl.length > 40 ? fileUrl.substring(0, 40) + '...' : fileUrl})
                      </a>
                    )}
                  </div>
                )}
              </div>

              {!isExpired && !hasNoRemainingAttempts && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                  {isEditing && (
                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={submitting || uploadingFile}>
                    {submitting ? 'Submitting...' : studentSubmission ? 'Update Submission (Final Attempt)' : 'Submit Answer'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* Teacher / Admin View: Submissions Table */}
      {(user?.role === 'Teacher' || user?.role === 'Admin') && (
        <div className="glass-card">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', color: '#006633' }}>Student Submissions ({submissions.length})</h2>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Submitted At</th>
                  <th>Answer & File Attachment</th>
                  <th>Attempts Used</th>
                  <th>Status</th>
                  <th>Marks</th>
                  <th>Actions</th>
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
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {s.attemptCount} / {s.maxSubmissionAttempts}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td>
                        {s.marks !== null ? (
                          <span style={{ fontWeight: 700, color: '#166534' }}>
                            {s.marks} / {assignment.maxMarks}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Not Graded</span>
                        )}
                      </td>
                      <td>
                        {user.role === 'Teacher' && (
                          <button
                            onClick={() => {
                              setSelectedSubmission(s);
                              setIsGradeModalOpen(true);
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            {s.status === 'Graded' ? 'Edit Grade' : 'Grade'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No student submissions received for this assignment yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <GradeSubmissionModal
            isOpen={isGradeModalOpen}
            onClose={() => setIsGradeModalOpen(false)}
            submission={selectedSubmission}
            onGraded={loadData}
          />

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
                      {isImageFile(viewingAnswerSubmission.fileUrl) ? (
                        <div>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <img src={getFormattedUrl(viewingAnswerSubmission.fileUrl)} alt="Submission Attachment" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          </div>
                          <button type="button" onClick={() => handleOpenDocument(viewingAnswerSubmission.fileUrl)} className="btn btn-primary btn-sm">
                            Open Original Image File
                          </button>
                        </div>
                      ) : isPdfFile(viewingAnswerSubmission.fileUrl) ? (
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
      )}
    </div>
  );
}
