'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../lib/types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const role = normalizeRole(user.role);
  const dashboardPath = role === 'Admin'
    ? '/dashboard/admin' 
    : role === 'Teacher' 
    ? '/dashboard/teacher' 
    : '/dashboard/student';

  const isDashboardActive = pathname.startsWith('/dashboard');
  const isAssignmentsActive = pathname.startsWith('/assignments');

  return (
    <header style={{
      background: '#006633',
      color: '#ffffff',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      width: '100%'
    }}>
      <div className="navbar-container">
        {/* Absolute Far Left: Brand Logo & Title */}
        <Link href={dashboardPath} style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', flexShrink: 0 }}>
          <span style={{
            background: '#ffffff',
            color: '#006633',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            fontWeight: 800,
            fontSize: '1rem',
            letterSpacing: '0.05em',
            boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
          }}>
            CSE GSTU
          </span>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Assignment Portal
          </span>
        </Link>

        {/* Absolute Far Right: Pushed to right edge with navbar-right */}
        <div className="navbar-right">
          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link
              href={dashboardPath}
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#ffffff',
                background: isDashboardActive ? 'rgba(255, 255, 255, 0.22)' : 'transparent',
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                borderBottom: isDashboardActive ? '3px solid #fcd34d' : '3px solid transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              Dashboard
            </Link>
            <Link
              href="/assignments"
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#ffffff',
                background: isAssignmentsActive ? 'rgba(255, 255, 255, 0.22)' : 'transparent',
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                borderBottom: isAssignmentsActive ? '3px solid #fcd34d' : '3px solid transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              Assignments
            </Link>
          </nav>

          {/* Vertical Separator Line */}
          <div style={{ height: '22px', width: '1px', background: 'rgba(255, 255, 255, 0.35)' }} />

          {/* User Profile Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(0, 0, 0, 0.22)',
            padding: '0.45rem 1.1rem',
            borderRadius: '24px',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
              {user.fullName}
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              background: '#fcd34d',
              color: '#004d26',
              padding: '3px 9px',
              borderRadius: '12px'
            }}>
              {role}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            className="btn"
            style={{
              background: '#ffffff',
              color: '#006633',
              fontWeight: 700,
              padding: '0.45rem 1.1rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};
