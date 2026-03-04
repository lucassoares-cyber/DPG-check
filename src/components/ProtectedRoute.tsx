import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPerfil } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserPerfil[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, unauthorized } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dpg-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dpg-cyan"></div>
      </div>
    );
  }

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (unauthorized && location.pathname !== '/unauthorized') {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.perfil)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
