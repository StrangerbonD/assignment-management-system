'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Submission } from '../../../lib/types';
import { api } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import { GradeSubmissionModal } from '../../../components/GradeSubmissionModal';

export default function SubmissionDetailPage() {
  const params = useParams();
  const submissionId = Number(params?.id);
  const { user } = useAuth();
  const router = useRouter();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

  const fetchSubmission = async () => {
    if (!submissionId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSubmissionById(submissionId);
      setSubmission(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load submission details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading submission details...</div>;
  }

  if (error || !submission) {
    return <div className="alert alert-danger">{error || 'Submission not found.'}</div>;
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Submission Details</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Assignment: {submission.assignmentTitle}</p>
        </div>
        <button onClick={() => router.back()} className="btn btn-secondary btn-sm">
          ← Back
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{submission.studentName}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{submission.studentEmail}</div>
          </div>
          <StatusBadge status={submission.status} />
        </div>

        <div style={{ background: 'rgba(15,23,42,0.6)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Submitted Response:</div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{submission.answerText}</div>
          {submission.fileUrl && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Attached File Link: </span>
              <a href={submission.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)', textDecoration: 'underline' }}>
                {submission.fileUrl}
              </a>
            </div>
          )}
        </div>

        {submission.marks !== null ? (
          <div className="alert alert-success" style={{ display: 'block' }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>
              Grade: {submission.marks} / {submission.maxMarks}
            </div>
            {submission.feedback && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>
                Teacher Feedback: &quot;{submission.feedback}&quot;
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Evaluated by {submission.graderName || 'Teacher'} on {submission.gradedAt ? new Date(submission.gradedAt).toLocaleString() : '-'}
            </div>
          </div>
        ) : (
          <div className="alert alert-danger">Pending evaluation by teacher.</div>
        )}

        {user?.role === 'Teacher' && (
          <button onClick={() => setIsGradeModalOpen(true)} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            {submission.status === 'Graded' ? 'Edit Grade' : 'Grade Submission'}
          </button>
        )}
      </div>

      <GradeSubmissionModal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        submission={submission}
        onGraded={fetchSubmission}
      />
    </div>
  );
}
