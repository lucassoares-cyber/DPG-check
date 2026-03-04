import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Analise } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Search, Filter, Eye, Download, FileText, ImageIcon, Globe, Share2 } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';

export function History() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      const data = await api.getAnalises();
      setAnalises(data);
    } catch (err: any) {
      console.error('Error fetching history:', err);
      showToast('Erro ao carregar histórico', 'error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalises = analises.filter(a => 
    a.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.tipo_analise?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'texto': return <FileText size={18} />;
      case 'imagem': return <ImageIcon size={18} />;
      case 'site': return <Globe size={18} />;
      case 'social': return <Share2 size={18} />;
      default: return <FileText size={18} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-dpg-ink tracking-tighter">Histórico de Auditorias</h1>
          <p className="text-dpg-ink/40 font-medium mt-1">Acompanhe todas as revisões realizadas pelo seu perfil.</p>
        </div>
        
        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dpg-ink/20 group-focus-within:text-dpg-cyan transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Filtrar por categoria, tipo ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-dpg-card border border-dpg-border rounded-2xl focus:ring-4 focus:ring-dpg-cyan/10 outline-none transition-all font-bold text-dpg-ink placeholder:text-dpg-ink/20 shadow-premium"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dpg-ink/[0.02] border-b border-dpg-ink/5">
                <th className="p-6 label-micro">Data & Hora</th>
                <th className="p-6 label-micro">Módulo / Tipo</th>
                <th className="p-6 label-micro">Categoria</th>
                <th className="p-6 label-micro">Status</th>
                <th className="p-6 label-micro text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dpg-ink/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-dpg-cyan/20 border-t-dpg-cyan rounded-full animate-spin" />
                      <p className="text-xs font-black text-dpg-ink/20 uppercase tracking-widest">Recuperando Histórico...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAnalises.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <FileText size={48} />
                      <p className="font-black uppercase tracking-widest text-xs">Nenhuma auditoria encontrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAnalises.map((a) => (
                  <tr key={a.id} className="hover:bg-dpg-ink/[0.01] transition-colors group">
                    <td className="p-6">
                      <p className="text-sm font-black text-dpg-ink tracking-tight">{formatDate(a.data_hora)}</p>
                      <p className="text-[10px] font-bold text-dpg-ink/30 uppercase tracking-wider">Protocolo: #{a.id.toString().padStart(6, '0')}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-dpg-ink/5 flex items-center justify-center text-dpg-ink">
                          {getIcon(a.tipo_analise)}
                        </div>
                        <span className="text-xs font-black text-dpg-ink uppercase tracking-widest">{a.tipo_analise}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-bold text-dpg-ink/60">{a.categoria}</p>
                    </td>
                    <td className="p-6">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        a.status === 'Conforme' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          a.status === 'Conforme' ? "bg-emerald-500" : "bg-orange-500"
                        )} />
                        {a.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button className="p-2.5 hover:bg-dpg-ink/5 text-dpg-ink/40 hover:text-dpg-ink rounded-xl transition-colors" title="Visualizar Detalhes">
                          <Eye size={20} />
                        </button>
                        <button className="p-2.5 hover:bg-dpg-ink/5 text-dpg-ink/40 hover:text-dpg-ink rounded-xl transition-colors" title="Download PDF">
                          <Download size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
