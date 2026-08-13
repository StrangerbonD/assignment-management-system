'use client';

import React from 'react';
import Link from 'next/link';
import { Assignment } from '../lib/types';
import { StatusBadge } from './StatusBadge';

interface AssignmentCardProps {
  assignment: Assignment;
  role: 'Admin' | 'Teacher' | 'Student';
  onDelete?: (id: number) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, role, onDelete }) => {
  const formattedDeadline = new Date(assignment.deadline).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <StatusBadge status={assignment.status} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {assignment.className} • {assignment.subjectName}
          </span>
        </div>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--text-main)', textAlign: 'left', wordBreak: 'break-word' }}>
          {assignment.title}
        </h3>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '1rem',
          lineClamp: 2,
          WebkitLineClamp: 2,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textAlign: 'justify',
          textAlignLast: 'left',
          wordBreak: 'break-word'
        }}>
          {assignment.description}
        </p>
      </div>

      <div>
        <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', marginBottom: '0.85rem', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Max Marks:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{assignment.maxMarks} Marks</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Deadline:</span>
            <span style={{ fontWeight: 600, color: assignment.isOverdue ? '#dc2626' : 'var(--text-main)' }}>
              {formattedDeadline} {assignment.isOverdue && '(Expired)'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link href={`/assignments/${assignment.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
            View Details
          </Link>

          {(role === 'Teacher' || role === 'Admin') && (
            <Link href={`/assignments/${assignment.id}/edit`} className="btn btn-secondary btn-sm" style={{ fontWeight: 700, borderColor: '#cbd5e1' }}>
              Edit
            </Link>
          )}

          {(role === 'Teacher' || role === 'Admin') && onDelete && (
            <button onClick={() => onDelete(assignment.id)} className="btn btn-danger btn-sm">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
