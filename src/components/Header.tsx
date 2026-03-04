import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export function Header() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-dpg-card border-b border-dpg-border flex items-center justify-end px-8 sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-dpg-ink/5 text-dpg-ink/60 hover:text-dpg-ink transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-dpg-ink">{user?.nome}</p>
          <p className="text-xs text-dpg-ink/60 capitalize">{user?.perfil}</p>
        </div>
        {user?.foto_url ? (
          <img 
            src={user.foto_url} 
            alt={user.nome} 
            className="w-10 h-10 rounded-full border border-dpg-border"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-dpg-cyan flex items-center justify-center text-white font-bold">
            {user?.nome?.charAt(0)}
          </div>
        )}
      </div>
    </header>
  );
}
