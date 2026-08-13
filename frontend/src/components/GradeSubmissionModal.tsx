'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Submission } from '../lib/types';
import { api } from '../lib/api';

interface GradeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  onGraded: () => void;
}

export const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = ({
  isOpen,
  onClose,
  submission,
  onGraded,
}) => {
  const [marks, setMarks] = useState<number>(submission?.marks ?? 0);
  const [feedback, setFeedback] = useState<string>(submission?.feedback ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!submission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client Validation
    if (marks < 0) {
      setError('Marks cannot be negative.');
      return;
    }

    if (marks > submission.maxMarks) {
      setError(`Marks cannot exceed maximum marks (${submission.maxMarks}).`);
      return;
    }

    try {
      setLoading(true);
      await api.gradeSubmission(submission.id, { marks, feedback });
      onGraded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to grade submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Grade Submission: ${submission.studentName}`}>
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Student Answer:</div>
          <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{submission.answerText}</div>
          {submission.fileUrl && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Attached File Link: </span>
              <a href={submission.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)', textDecoration: 'underline' }}>
                {submission.fileUrl}
              </a>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="gradeMarksInput" className="form-label">Marks (Max: {submission.maxMarks})</label>
          <input
            id="gradeMarksInput"
            name="marks"
            type="number"
            min={0}
            max={submission.maxMarks}
            className="form-input"
            value={marks}
            onChange={(e) => setMarks(Number(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="gradeFeedbackInput" className="form-label">Feedback / Remarks</label>
          <textarea
            id="gradeFeedbackInput"
            name="feedback"
            className="form-textarea"
            placeholder="Write constructive feedback for the student..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Submit Grade'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
