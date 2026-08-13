'use client';

import React, { useState, useEffect } from 'react';
import { CourseMarksheet } from '../lib/types';
import { api } from '../lib/api';

interface CourseMarksheetTableProps {
  subjectId: number;
  currentUserId?: number;
}

export const CourseMarksheetTable: React.FC<CourseMarksheetTableProps> = ({
  subjectId,
  currentUserId,
}) => {
  const [marksheet, setMarksheet] = useState<CourseMarksheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarksheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCourseMarksheet(subjectId);
      setMarksheet(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load course marksheet summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subjectId) {
      fetchMarksheet();
    }
  }, [subjectId]);

  if (loading) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading course marksheet summary...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!marksheet || marksheet.students.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
        No enrolled students or marks available for this course yet.
      </div>
    );
  }

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (!marksheet) return;

    const headers = [
      'Student ID',
      'Student Name',
      'Email',
      ...marksheet.assignments.map((a) => `A${a.sequenceNumber}: ${a.title} (Max ${a.maxMarks})`),
      'Total Obtained Marks',
      'Total Max Marks',
      'Average Percentage (%)',
    ];

    const rows = marksheet.students.map((st) => {
      const assignmentScores = marksheet.assignments.map((a) => {
        const mark = st.marksMap[a.id];
        return mark !== null && mark !== undefined ? mark : 'N/A';
      });

      return [
        `"${st.studentRegId}"`,
        `"${st.studentName}"`,
        `"${st.studentEmail}"`,
        ...assignmentScores,
        st.totalObtainedMarks,
        st.totalMaxMarks,
        `"${st.averagePercentage}%"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Course_Marksheet_${marksheet.subjectName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export / Print PDF View
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '1.25rem', marginBottom: '1.5rem' }}>
      {/* Header & Export Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#006633', margin: 0 }}>
            Course Marksheet & Grade Summary — {marksheet.subjectName}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Class: {marksheet.className} • Total Assignments: {marksheet.assignments.length} • Enrolled Students: {marksheet.students.length}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
            Export to Excel (.CSV)
          </button>
          <button onClick={handlePrintPDF} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Marksheet Matrix Table */}
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#006633', color: '#ffffff' }}>
              <th>Student ID</th>
              <th>Student Name</th>
              {marksheet.assignments.map((a) => (
                <th key={a.id} style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                  A{a.sequenceNumber}
                  <div style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.9 }}>Max: {a.maxMarks}</div>
                </th>
              ))}
              <th style={{ textAlign: 'center' }}>Total Marks</th>
              <th style={{ textAlign: 'center' }}>Avg Score (%)</th>
            </tr>
          </thead>
          <tbody>
            {marksheet.students.map((st) => {
              const isCurrentStudent = currentUserId && st.studentId === currentUserId;
              return (
                <tr
                  key={st.studentId}
                  style={{
                    background: isCurrentStudent ? '#e6f4ed' : undefined,
                    fontWeight: isCurrentStudent ? 700 : undefined,
                  }}
                >
                  <td style={{ fontWeight: 700, color: '#006633' }}>{st.studentRegId}</td>
                  <td>
                    {st.studentName}
                    {isCurrentStudent && <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: '#006633' }}>(You)</span>}
                  </td>
                  {marksheet.assignments.map((a) => {
                    const score = st.marksMap[a.id];
                    return (
                      <td key={a.id} style={{ textAlign: 'center' }}>
                        {score !== null && score !== undefined ? (
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{score}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>Pending</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    {st.totalObtainedMarks} / {st.totalMaxMarks}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        background: st.averagePercentage >= 50 ? '#dcfce7' : '#fee2e2',
                        color: st.averagePercentage >= 50 ? '#166534' : '#991b1b',
                      }}
                    >
                      {st.averagePercentage}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
