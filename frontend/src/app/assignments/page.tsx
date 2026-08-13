'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Assignment } from '../../lib/types';
import { api } from '../../lib/api';
import { AssignmentCard } from '../../components/AssignmentCard';
import { normalizeRole } from '../../lib/types';

export default function AssignmentsListPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = user ? normalizeRole(user.role) : 'Student';

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAssignments();
      setAssignments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.deleteAssignment(id);
      fetchAssignments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#006633' }}>
            Course Assignments
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Browse published academic assignments across university departments.
          </p>
        </div>

        {(role === 'Teacher' || role === 'Admin') && (
          <Link href="/assignments/create" className="btn btn-primary btn-sm">
            Create New Assignment
          </Link>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading course assignments...</div>
      ) : assignments.length > 0 ? (
        <div className="grid-3">
          {assignments.map((a) => (
            <AssignmentCard key={a.id} assignment={a} role={role} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No course assignments available at this moment.</p>
        </div>
      )}
    </div>
  );
}
