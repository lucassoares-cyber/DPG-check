import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { History } from './pages/History';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { CopyModule } from './pages/CopyModule';
import { SiteModule } from './pages/SiteModule';
import { Unauthorized } from './pages/Unauthorized';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Home />} />
              <Route path="/historico" element={<History />} />
              <Route path="/copy" element={<CopyModule />} />
              <Route path="/site" element={<SiteModule />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['supervisor', 'gerente', 'ceo', 'administrador']}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['administrador']}>
                  <Admin />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  );
}
