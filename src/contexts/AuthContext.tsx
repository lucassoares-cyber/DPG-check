import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { Usuario } from '../types';

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  unauthorized: boolean;
  error: string | null;
  signOut: () => void;
  signInWithGoogle: (email?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const data = await api.getMe();
      if (!data) {
        setUnauthorized(true);
      } else {
        setUser(data);
        setUnauthorized(false);
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setUnauthorized(true);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (email?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = email ? `/api/me?email=${email}` : '/api/me';
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Erro ao realizar login');
        return;
      }

      if (data) {
        setUser(data);
        setUnauthorized(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, unauthorized, error, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
