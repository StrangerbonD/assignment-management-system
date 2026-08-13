'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter your institutional email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '75vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderTop: '4px solid #006633' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>💻</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#006633', marginBottom: '0.2rem' }}>
            Assignment Portal
          </h1>
          <p style={{ color: '#006633', fontSize: '0.85rem', fontWeight: 700 }}>
            Dept. of Computer Science & Engineering
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
            Gopalganj Science and Technology University (GSTU)
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="loginEmailInput" className="form-label">Institutional Email</label>
            <input
              id="loginEmailInput"
              name="email"
              type="email"
              className="form-input"
              placeholder="user@cse.gstu.edu.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="loginPasswordInput" className="form-label">Password</label>
              <Link href="/forgot-password" style={{ fontSize: '0.75rem', color: '#006633', fontWeight: 600 }}>
                Forgot Password?
              </Link>
            </div>
            <input
              id="loginPasswordInput"
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem', background: '#006633' }} disabled={loading}>
            {loading ? 'Authenticating with GSTU Server...' : 'Sign In to Portal'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            New Student without an account?{' '}
            <Link href="/register" style={{ color: '#006633', fontWeight: 700, textDecoration: 'underline' }}>
              Register as Student
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
