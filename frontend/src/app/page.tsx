'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'Admin') {
        router.push('/dashboard/admin');
      } else if (user.role === 'Teacher') {
        router.push('/dashboard/teacher');
      } else if (user.role === 'Student') {
        router.push('/dashboard/student');
      }
    }
  }, [user, loading, router]);

  return (
    <div style={{ display: 'flex', minHeight: '70vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-secondary)' }}>Redirecting to portal...</div>
    </div>
  );
}
