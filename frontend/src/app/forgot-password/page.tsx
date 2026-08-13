'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ display: 'flex', minHeight: '75vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem', borderTop: '4px solid #006633' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🔑</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#006633', marginBottom: '0.2rem' }}>
            Password Recovery
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Dept. of Computer Science & Engineering — GSTU
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div className="alert alert-success" style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '0.9rem' }}>
              <strong>Password Reset Request Noted!</strong>
              <br /><br />
              For security reasons, institutional accounts (<code>{email}</code>) require Administrator verification.
              <br /><br />
              <strong>Next Steps:</strong>
              <ol style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
                <li>Contact the CSE Department Administrator (<code>admin@cse.gstu.edu.bd</code>).</li>
                <li>Provide your <strong>Student ID</strong> (<code>{studentId || 'N/A'}</code>) and <strong>Full Name</strong>.</li>
                <li>The Admin will reset your password directly from the Admin Dashboard.</li>
              </ol>
            </div>

            <Link href="/login" className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem', display: 'inline-block' }}>
              Return to Login Page
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">CSE Institutional Email *</label>
              <input
                type="email"
                className="form-input"
                placeholder="user@cse.gstu.edu.bd"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student ID / Staff ID (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 20CSE016"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem' }}>
              Request Password Reset Instructions
            </button>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Remembered your password?{' '}
                <Link href="/login" style={{ color: '#006633', fontWeight: 700, textDecoration: 'underline' }}>
                  Sign In to CSE Portal
                </Link>
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
