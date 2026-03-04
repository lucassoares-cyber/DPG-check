import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  FileDown,
  RefreshCcw,
  Loader2,
  Layout,
  BarChart3,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { analyzeTask } from '../services/aiService';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AnalysisResult } from '../types';
import { cn } from '../lib/utils';

export function SiteModule() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [url, setUrl] = useState('');
  const [clientName, setClientName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [protocol, setProtocol] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      showToast('Atenção', 'warning', 'Por favor, insira a URL do site');
      return;
    }
    if (!clientName.trim()) {
      showToast('Atenção', 'warning', 'Por favor, informe o nome do cliente');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeTask('site', { url });
      setResult(analysis);
      
      // Save to history
      const saved = await api.createAnalise({
        usuario_id: user?.id || '',
        nome_usuario: user?.nome || '',
        setor: user?.setor_nome || 'N/A',
        perfil: user?.perfil || 'colaborador',
        categoria: 'Auditoria Web',
        url_site: url,
        resposta_ia: analysis,
        status: analysis.status,
        tipo_analise: 'site',
        cliente_nome: clientName,
        responsavel_nome: user?.nome || ''
      });
      
      setProtocol(saved.protocolo);
      showToast('Auditoria Concluída', 'success', 'A auditoria de site foi concluída com sucesso.');
    } catch (err: any) {
      showToast('Erro', 'error', err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!result || !protocol) return;
    
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('DPG CHECK', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('RELATÓRIO DE AUDITORIA DE SITE', 105, 30, { align: 'center' });

    // Info
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(12);
    doc.text(`Protocolo: ${protocol}`, 20, 50);
    doc.text(`Cliente: ${clientName}`, 20, 60);
    doc.text(`URL: ${url}`, 20, 70);
    doc.text(`Responsável: ${user?.nome}`, 20, 80);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 20, 90);
    doc.text(`Status: ${result.status}`, 20, 100);

    // Summary
    doc.setFontSize(14);
    doc.text('Resumo da Auditoria', 20, 120);
    doc.setFontSize(10);
    const splitResumo = doc.splitTextToSize(result.resumo, 170);
    doc.text(splitResumo, 20, 130);

    let y = 130 + (splitResumo.length * 5) + 10;

    // SEO
    doc.setFontSize(14);
    doc.text('Análise de SEO', 20, y);
    doc.setFontSize(10);
    doc.text(`Title Tag: ${result.seo_analysis?.title_tag}`, 20, y + 10);
    doc.text(`Meta Description: ${result.seo_analysis?.meta_description}`, 20, y + 20);
    y += 40;

    // UX/UI
    doc.setFontSize(14);
    doc.text('Análise de UX/UI', 20, y);
    doc.setFontSize(10);
    doc.text(`Clareza Visual: ${result.ux_ui_analysis?.clareza_visual}`, 20, y + 10);
    doc.text(`Experiência: ${result.ux_ui_analysis?.experiencia_usuario}`, 20, y + 20);

    doc.save(`DPG-CHECK-SITE-${clientName}-${protocol}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-dpg-ink">Análise de Site</h1>
          <p className="text-dpg-ink/60 mt-1">Auditoria completa de SEO, UX/UI e Estrutura.</p>
        </div>
        {result && (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-dpg-ink text-dpg-bg rounded-xl font-bold hover:bg-dpg-ink/90 transition-colors shadow-lg"
            >
              <FileDown size={18} />
              <span>Exportar PDF</span>
            </button>
            <button 
              onClick={() => { setResult(null); setProtocol(null); setUrl(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-dpg-card border border-dpg-border text-dpg-ink rounded-xl font-bold hover:bg-dpg-ink/5 transition-colors"
            >
              <RefreshCcw size={18} />
              <span>Nova Análise</span>
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div 
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-dpg-card rounded-3xl p-8 shadow-xl border border-dpg-border space-y-6 transition-colors duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dpg-ink/40 uppercase ml-1">Nome do Cliente</label>
                  <input 
                    type="text" 
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-4 py-3 bg-dpg-ink/5 border-none rounded-xl focus:ring-2 focus:ring-dpg-cyan transition-all text-dpg-ink font-medium"
                    placeholder="Ex: Clínica Sorriso..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dpg-ink/40 uppercase ml-1">URL do Site</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-dpg-ink/20" size={18} />
                    <input 
                      type="url" 
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-dpg-ink/5 border-none rounded-xl focus:ring-2 focus:ring-dpg-cyan transition-all text-dpg-ink font-medium"
                      placeholder="https://exemplo.com.br"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full py-4 bg-dpg-ink text-dpg-bg rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-dpg-ink/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-dpg-ink/20"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <span>Auditando Site...</span>
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    <span>Iniciar Auditoria Completa</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                {[
                  { icon: Layout, label: 'Estrutura' },
                  { icon: BarChart3, label: 'SEO' },
                  { icon: Smartphone, label: 'UX/UI' },
                  { icon: ShieldCheck, label: 'Segurança' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-4 bg-dpg-bg/5 rounded-2xl">
                    <item.icon className="text-dpg-cyan" size={24} />
                    <span className="text-xs font-bold text-dpg-bg/60 uppercase">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Technical Checklist */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-white/40">
                  <h3 className="text-xl font-bold text-dpg-bg mb-6 flex items-center gap-2">
                    <ShieldCheck className="text-dpg-cyan" />
                    Checklist Técnico
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.checklist_tecnico?.map((item, i) => (
                      <div key={i} className="p-4 bg-dpg-bg/5 rounded-2xl flex items-start gap-3">
                        {item.status === 'OK' ? (
                          <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                        ) : (
                          <AlertCircle className="text-red-500 shrink-0" size={20} />
                        )}
                        <div>
                          <p className="font-bold text-dpg-bg text-sm">{item.item}</p>
                          <p className="text-xs text-dpg-bg/60 mt-0.5">{item.observacao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SEO Analysis */}
                <div className="bg-dpg-bg rounded-3xl p-8 shadow-xl text-white">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <BarChart3 className="text-dpg-cyan" />
                    Análise de SEO
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-white/40 uppercase">Title Tag</p>
                        <p className="text-sm font-medium bg-white/10 p-3 rounded-xl">{result.seo_analysis?.title_tag}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-white/40 uppercase">Palavras-chave</p>
                        <div className="flex flex-wrap gap-2">
                          {result.seo_analysis?.keywords.map((k, i) => (
                            <span key={i} className="px-2 py-1 bg-white/10 rounded-lg text-xs">{k}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-white/40 uppercase">Meta Description</p>
                      <p className="text-sm font-medium bg-white/10 p-3 rounded-xl">{result.seo_analysis?.meta_description}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-white/40 uppercase">Hierarquia H1-H3</p>
                      <p className="text-sm font-medium bg-white/10 p-3 rounded-xl whitespace-pre-wrap">{result.seo_analysis?.h1_h2_h3}</p>
                    </div>
                  </div>
                </div>

                {/* UX/UI Analysis */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-white/40">
                  <h3 className="text-xl font-bold text-dpg-bg mb-6 flex items-center gap-2">
                    <Smartphone className="text-dpg-magenta" />
                    Análise de UX/UI
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-dpg-bg/5 rounded-2xl">
                      <p className="text-xs font-bold text-dpg-bg/40 uppercase mb-1">Clareza Visual</p>
                      <p className="text-sm text-dpg-bg/80">{result.ux_ui_analysis?.clareza_visual}</p>
                    </div>
                    <div className="p-4 bg-dpg-bg/5 rounded-2xl">
                      <p className="text-xs font-bold text-dpg-bg/40 uppercase mb-1">Hierarquia de Informação</p>
                      <p className="text-sm text-dpg-bg/80">{result.ux_ui_analysis?.hierarquia_informacao}</p>
                    </div>
                    <div className="p-4 bg-dpg-bg/5 rounded-2xl">
                      <p className="text-xs font-bold text-dpg-bg/40 uppercase mb-1">Experiência do Usuário</p>
                      <p className="text-sm text-dpg-bg/80">{result.ux_ui_analysis?.experiencia_usuario}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-white/40">
                  <h3 className="font-bold text-dpg-bg mb-4">Status da Auditoria</h3>
                  <div className={cn(
                    "p-4 rounded-2xl flex items-center gap-3 font-bold",
                    result.status === 'Conforme' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {result.status === 'Conforme' ? <CheckCircle2 /> : <AlertCircle />}
                    <span>{result.status}</span>
                  </div>
                  <div className="mt-4 p-4 bg-dpg-bg/5 rounded-2xl">
                    <p className="text-xs font-bold text-dpg-bg/40 uppercase mb-2">Protocolo</p>
                    <p className="font-mono font-bold text-dpg-bg">{protocol}</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-xl border border-white/40">
                  <h3 className="font-bold text-dpg-bg mb-4">Pontos de Ajuste</h3>
                  <ul className="space-y-3">
                    {result.pontos_de_ajuste.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-dpg-bg/70">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-xl border border-white/40">
                  <h3 className="font-bold text-dpg-bg mb-4">Sugestões Estratégicas</h3>
                  <ul className="space-y-3">
                    {result.sugestoes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-dpg-bg/70">
                        <div className="w-1.5 h-1.5 rounded-full bg-dpg-cyan mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
