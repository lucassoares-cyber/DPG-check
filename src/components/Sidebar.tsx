import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  FileSearch, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  FileText,
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function Sidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.perfil === 'administrador';
  const isSupervisorPlus = ['supervisor', 'gerente', 'ceo', 'administrador'].includes(user?.perfil || '');

  const navItems = [
    { label: 'Analisar Tarefa', icon: FileSearch, path: '/' },
    { label: 'Módulo Copy', icon: FileText, path: '/copy' },
    { label: 'Análise de Site', icon: Globe, path: '/site' },
    { label: 'Meu Histórico', icon: History, path: '/historico' },
    ...(isSupervisorPlus ? [{ label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }] : []),
    ...(isAdmin ? [{ label: 'Administração', icon: Settings, path: '/admin' }] : []),
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dpg-card text-dpg-ink rounded-lg shadow-md border border-dpg-border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 bg-dpg-card border-r border-dpg-border transition-all duration-500 ease-in-out flex flex-col",
        collapsed ? "w-20" : "w-72",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}>
        <div className="p-8 flex items-center justify-between">
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-dpg-cyan" />
                <div className="w-2 h-2 rounded-full bg-dpg-magenta" />
                <div className="w-2 h-2 rounded-full bg-dpg-yellow" />
              </div>
              <span className="font-black text-xl tracking-tighter text-dpg-ink">dpg <span className="text-dpg-cyan">check</span></span>
            </motion.div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 hover:bg-dpg-ink/5 rounded-xl text-dpg-ink/40 transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-2xl transition-all group relative",
                  isActive 
                    ? "bg-dpg-ink text-dpg-bg shadow-lg shadow-dpg-ink/10" 
                    : "text-dpg-ink/60 hover:bg-dpg-ink/5"
                )}
              >
                <item.icon size={20} className={cn(
                  "shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-dpg-cyan" : "text-dpg-ink/30 group-hover:text-dpg-ink"
                )} />
                {!collapsed && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-bold text-sm tracking-tight"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isActive && !collapsed && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute right-3 w-1.5 h-1.5 rounded-full bg-dpg-cyan"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-dpg-border">
          <div className={cn(
            "mb-6 p-3 rounded-2xl bg-dpg-ink/5 flex items-center gap-3",
            collapsed && "justify-center"
          )}>
            <div className="w-10 h-10 rounded-xl bg-dpg-ink flex items-center justify-center text-dpg-bg font-bold shrink-0">
              {user?.nome?.charAt(0)}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-dpg-ink truncate">{user?.nome}</p>
                <p className="text-[10px] font-bold text-dpg-ink/40 uppercase tracking-wider truncate">{user?.perfil}</p>
              </div>
            )}
          </div>

          <button 
            onClick={signOut}
            className={cn(
              "w-full flex items-center gap-3 p-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm",
              collapsed && "justify-center"
            )}
          >
            <LogOut size={20} />
            {!collapsed && <span>Sair da Conta</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
