import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Loader2, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export function Login() {
  const { signInWithGoogle, error } = useAuth();
  const [email, setEmail] = useState('lucas.soares@grupodpg.com.br');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithGoogle(email);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dpg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-24 -left-24 w-96 h-96 bg-dpg-cyan/10 rounded-full blur-3xl" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-24 -right-24 w-96 h-96 bg-dpg-magenta/10 rounded-full blur-3xl" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-dpg-cyan shadow-[0_0_10px_rgba(41,171,226,0.5)]" />
              <div className="w-3 h-3 rounded-full bg-dpg-magenta shadow-[0_0_10px_rgba(236,0,140,0.5)]" />
              <div className="w-3 h-3 rounded-full bg-dpg-yellow shadow-[0_0_10px_rgba(255,242,0,0.5)]" />
            </div>
            <span className="font-black text-3xl tracking-tighter text-dpg-ink">
              dpg <span className="text-dpg-cyan">check</span>
            </span>
          </motion.div>
          <h1 className="text-xl font-bold text-dpg-ink/80">Auditoria Inteligente de Tarefas</h1>
          <p className="text-dpg-ink/40 mt-2 text-sm font-medium">Acesse com seu e-mail corporativo do Grupo DPG</p>
        </div>

        <div className="glass-card p-8 md:p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="label-micro">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-dpg-ink/20 group-focus-within:text-dpg-cyan transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="seu.nome@grupodpg.com.br"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600 text-sm font-medium"
              >
                <ShieldCheck className="shrink-0" size={18} />
                <p>{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-xs font-bold text-dpg-ink/20 uppercase tracking-widest">
          Exclusivo para Colaboradores Grupo DPG
        </p>
      </motion.div>
    </div>
  );
}
