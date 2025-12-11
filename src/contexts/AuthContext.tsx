"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  phone: string;
  role: 'student' | 'teacher' | 'owner' | 'secretary';
  grade?: string;
  name: string;
  parentPhone?: string;
  centerName?: string;
  groupName?: string;
  subscriptionType?: string;
  email?: string;
  profileImage?: string;
  heroImage?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  phone: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'owner' | 'secretary';
  grade?: string;
  accessCode?: string;
  parentPhone?: string;
  centerName?: string;
  groupName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/users?id=${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [user?.id]);

  const login = async (phone: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const text = await response.text();
      
      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const error = JSON.parse(text);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let userData;
      try {
        userData = JSON.parse(text);
      } catch (error) {
        console.error('Failed to parse login response:', error);
        throw new Error('Invalid server response');
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const text = await response.text();

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const error = JSON.parse(text);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let userData;
      try {
        userData = JSON.parse(text);
      } catch (error) {
        console.error('Failed to parse register response:', error);
        throw new Error('Invalid server response');
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}