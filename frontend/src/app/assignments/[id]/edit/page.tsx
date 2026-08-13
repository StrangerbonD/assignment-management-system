'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { RoleGuard } from '../../../../components/Protection/RoleGuard';
import { useAuth } from '../../../../context/AuthContext';
import { AssignmentStatus } from '../../../../lib/types';
import { api } from '../../../../lib/api';

export default function EditAssignmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assignmentId = Number(params?.id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    attachmentUrl: '',
    deadline: '',
    maxMarks: 100,
    maxSubmissionAttempts: 2,
    status: 'Published' as AssignmentStatus,
  });

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadAssignment = async () => {
      if (!assignmentId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.getAssignmentById(assignmentId);
        
        // Format ISO date to YYYY-MM-THH:mm for datetime-local input
        const deadlineDate = new Date(data.deadline);
        const formattedDeadline = new Date(deadlineDate.getTime() - deadlineDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);

        setForm({
          title: data.title,
          description: data.description,
          attachmentUrl: data.attachmentUrl || '',
          deadline: formattedDeadline,
          maxMarks: data.maxMarks,
          maxSubmissionAttempts: data.maxSubmissionAttempts || 2,
          status: data.status,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load assignment details for editing.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadAssignment();
    }
  }, [assignmentId, user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const res = await api.uploadFile(file);
      setForm((prev) => ({ ...prev, attachmentUrl: res.url }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload question file attachment.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.description.trim() || !form.deadline) {
      setError('Please fill in all required fields.');
      return;
    }

    if (form.maxMarks <= 0) {
      setError('Max Marks must be greater than zero.');
      return;
    }

    if (form.maxSubmissionAttempts < 1) {
      setError('Submission limit must be at least 1.');
      return;
    }

    try {
      setSubmitting(true);
      await api.updateAssignment(assignmentId, {
        title: form.title,
        description: form.description,
        attachmentUrl: form.attachmentUrl.trim() || undefined,
        deadline: new Date(form.deadline).toISOString(),
        maxMarks: Number(form.maxMarks),
        maxSubmissionAttempts: Number(form.maxSubmissionAttempts),
        status: form.status,
      });

      router.push(`/assignments/${assignmentId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['Teacher', 'Admin']}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.8rem', color: '#006633', fontWeight: 800 }}>Edit Assignment</h1>
          <p style={{ color: 'var(--text-muted)' }}>Update details, question paper attachment, deadline, or submission limits.</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="glass-card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading assignment configuration...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Database ER Diagram & Query Optimization"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description & Instructions</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the problem statement, submission criteria, format instructions..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              {/* Question Attachment Section (PDF / Image Upload or URL) */}
              <div className="form-group" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📎 Question File Attachment (PDF / Image)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileUpload}
                    className="form-input"
                    disabled={uploading}
                  />
                  {uploading && <div style={{ fontSize: '0.8rem', color: '#006633' }}>Uploading file to server...</div>}

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>- OR enter external document URL -</div>

                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/question_paper.pdf or image link"
                    value={form.attachmentUrl}
                    onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                  />
                </div>

                {form.attachmentUrl && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.8rem', background: '#e6f4ed', borderRadius: '4px', fontSize: '0.85rem', color: '#006633' }}>
                    ✅ Attached File: <a href={form.attachmentUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', fontWeight: 600 }}>{form.attachmentUrl}</a>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Submission Deadline</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Marks</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    className="form-input"
                    value={form.maxMarks}
                    onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Submission Limit</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="form-input"
                    value={form.maxSubmissionAttempts}
                    onChange={(e) => setForm({ ...form, maxSubmissionAttempts: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Publish Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as AssignmentStatus })}
                >
                  <option value="Published">Published (Visible to Students)</option>
                  <option value="Draft">Draft (Hidden from Students)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => router.back()} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting || uploading}>
                  {submitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
