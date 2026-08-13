'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { ClassItem } from '../../lib/types';

export default function RegisterPage() {
  const router = useRouter();

  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // File Upload State for ID Card
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    // Fetch available classes / semesters for registration
    api.getClasses()
      .then((res) => setClasses(res))
      .catch(() => setError('Failed to load academic classes. Please refresh page.'));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIdCardFile(file);
    try {
      setIsUploading(true);
      setError(null);
      const res = await api.uploadFile(file);
      setIdCardUrl(res.url);
    } catch (err: any) {
      setError(`ID Card upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict validation: ALL fields including Student ID photo proof are mandatory
    if (!studentId.trim()) {
      setError('Student ID / Registration Roll is required.');
      return;
    }
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('CSE Institutional Email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (!classId) {
      setError('Please select your enrolled semester class.');
      return;
    }
    if (!idCardUrl) {
      setError('⚠️ Student ID Card photo proof is required! Please upload your Student ID Card photo before submitting.');
      return;
    }

    try {
      setLoading(true);
      await api.registerStudent({
        studentId: studentId.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        password: password,
        classId: Number(classId),
        idCardUrl: idCardUrl,
      });

      setSubmittedSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '2rem auto 4rem auto', padding: '0 1rem' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#006633', marginBottom: '0.25rem' }}>
            Student Registration
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Dept. of Computer Science & Engineering — GSTU
          </p>
        </div>

        {submittedSuccess ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⏳</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#006633', marginBottom: '0.75rem' }}>
              Registration Submitted!
            </h2>
            <div className="alert alert-success" style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '0.9rem' }}>
              Thank you, <strong>{fullName}</strong> (<code>{studentId}</code>). Your account registration request and Student ID Card proof have been submitted to the CSE Department Administrator for verification.
              <br /><br />
              You will be able to log in once the Admin approves your account.
            </div>

            <Link href="/login" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', display: 'inline-block' }}>
              Return to Login Portal
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="regStudentIdInput" className="form-label">Student ID / Registration Roll *</label>
                <input
                  id="regStudentIdInput"
                  name="studentId"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 20CSE045"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="regFullNameInput" className="form-label">Full Name *</label>
                <input
                  id="regFullNameInput"
                  name="fullName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Anik Rahman"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="regEmailInput" className="form-label">CSE Institutional Email *</label>
                <input
                  id="regEmailInput"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. anik@cse.gstu.edu.bd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="regPasswordInput" className="form-label">Password *</label>
                <input
                  id="regPasswordInput"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="regClassIdSelect" className="form-label">Enrolled Semester Class *</label>
                <select
                  id="regClassIdSelect"
                  name="classId"
                  className="form-select"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                >
                  <option value="">Select your semester class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 📷 Student ID Card Photo Upload (REQUIRED) */}
              <div className="form-group" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: idCardUrl ? '2px solid #166534' : '2px dashed #dc2626' }}>
                <label htmlFor="regIdCardInput" className="form-label" style={{ fontWeight: 700, color: '#0f172a' }}>
                  📷 Upload Student ID Card Photo (Required Proof) *
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Please upload a clear photo or scanned PDF of your GSTU CSE Student ID Card for Admin verification before submitting.
                </p>
                <input
                  id="regIdCardInput"
                  name="idCardFile"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  style={{ fontSize: '0.85rem' }}
                  required
                />
                {isUploading && (
                  <div style={{ fontSize: '0.8rem', color: '#006633', marginTop: '0.4rem', fontWeight: 600 }}>
                    Uploading ID card photo...
                  </div>
                )}
                {idCardUrl ? (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>
                    ✓ Student ID Card photo uploaded and attached!
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                    ⚠️ Photo attachment required to submit registration.
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
                disabled={loading || isUploading}
              >
                {loading ? 'Submitting Registration...' : 'Submit Student Registration'}
              </button>
            </form>

            <div style={{ marginTop: '1.75rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Already have an approved account?{' '}
                <Link href="/login" style={{ color: '#006633', fontWeight: 700, textDecoration: 'underline' }}>
                  Sign In to Portal
                </Link>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
