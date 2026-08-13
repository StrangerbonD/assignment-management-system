'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { UserRole, normalizeRole } from '../../lib/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const userRole = user ? normalizeRole(user.role) : null;
  const isRoleAllowed = !!userRole && allowedRoles.includes(userRole);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isRoleAllowed) {
        if (userRole === 'Admin') router.push('/dashboard/admin');
        else if (userRole === 'Teacher') router.push('/dashboard/teacher');
        else if (userRole === 'Student') router.push('/dashboard/student');
      }
    }
  }, [user, loading, allowedRoles, router, isRoleAllowed, userRole]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Loading access control...</div>
      </div>
    );
  }

  if (!user || !isRoleAllowed) {
    return null;
  }

  return <>{children}</>;
};
