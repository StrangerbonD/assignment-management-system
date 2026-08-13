'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, UserRole } from '../lib/types';
import { api } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('jwt_token');
    const storedUser = localStorage.getItem('user_info');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user_info');
      }
      // Re-verify profile from backend
      api.getCurrentUser()
        .then((profile) => {
          setUser(profile);
          localStorage.setItem('user_info', JSON.stringify(profile));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem('jwt_token', res.token);

    const userProfile: UserProfile = {
      id: res.id,
      fullName: res.fullName,
      email: res.email,
      role: res.role,
      classId: res.classId,
      className: res.className
    };

    localStorage.setItem('user_info', JSON.stringify(userProfile));
    setToken(res.token);
    setUser(userProfile);
    setLoading(false);

    // Redirect to role dashboard
    if (res.role === 'Admin') {
      router.push('/dashboard/admin');
    } else if (res.role === 'Teacher') {
      router.push('/dashboard/teacher');
    } else if (res.role === 'Student') {
      router.push('/dashboard/student');
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
