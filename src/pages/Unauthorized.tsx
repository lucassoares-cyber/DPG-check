import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ShieldAlert } from 'lucide-react';

export function Unauthorized() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-dpg-bg p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="text-red-500" size={40} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Não Autorizado</h1>
        
        {user?.status === 'aguardando_perfil' ? (
          <p className="text-gray-600 mb-8">
            Olá, <span className="font-semibold">{user.nome}</span>! Seu cadastro foi recebido e está aguardando aprovação de um administrador. Por favor, tente novamente mais tarde.
          </p>
        ) : (
          <p className="text-gray-600 mb-8">
            Sua conta está inativa ou você não tem permissão para acessar este sistema. Entre em contato com o suporte.
          </p>
        )}

        <button 
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          <LogOut size={20} />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
