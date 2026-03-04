import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  FileText, 
  Download, 
  Plus,
  ArrowRight,
  Volume2,
  VolumeX
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface AnalysisResultProps {
  result: AnalysisResult;
  onReset: () => void;
  type: string;
  category: string;
}

export function AnalysisResultView({ result, onReset, type, category }: AnalysisResultProps) {
  const { user } = useAuth();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToSpeak = `
        Resumo da auditoria: ${result.resumo}.
        Status: ${result.status}.
        Conclusão geral: ${result.conclusao}.
        Pontos positivos: ${result.pontos_positivos.join(', ')}.
        Pontos de ajuste: ${result.pontos_de_ajuste.join(', ')}.
        Sugestões estratégicas: ${result.sugestoes.join(', ')}.
      `;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'pt-BR';
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleString('pt-BR');
    
    // Header
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('DPG CHECK', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('RELATÓRIO DE AUDITORIA INTELIGENTE', 105, 30, { align: 'center' });

    // Info
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    doc.text(`Colaborador: ${user?.nome}`, 20, 50);
    doc.text(`Setor: ${user?.setor_nome || 'N/A'}`, 20, 55);
    doc.text(`Categoria: ${category}`, 20, 60);
    doc.text(`Tipo: ${type}`, 20, 65);
    doc.text(`Data: ${date}`, 20, 70);
    doc.text(`Status: ${result.status}`, 20, 75);
    
    doc.setDrawColor(41, 171, 226);
    doc.line(20, 80, 190, 80);

    // Content
    doc.setFontSize(14);
    doc.text('Resumo da Tarefa', 20, 90);
    doc.setFontSize(10);
    const splitResumo = doc.splitTextToSize(result.resumo, 170);
    doc.text(splitResumo, 20, 97);

    let y = 97 + (splitResumo.length * 5) + 10;

    // Specialized sections for Copy
    if (result.texto_corrigido) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text('Texto Corrigido', 20, y);
      y += 7;
      doc.setFontSize(9);
      const splitCorrigido = doc.splitTextToSize(result.texto_corrigido, 170);
      doc.text(splitCorrigido, 20, y);
      y += (splitCorrigido.length * 5) + 10;
    }

    // Specialized sections for Site
    if (result.seo_analysis) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text('Análise de SEO', 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.text(`Title Tag: ${result.seo_analysis.title_tag}`, 20, y);
      doc.text(`Meta Description: ${result.seo_analysis.meta_description}`, 20, y + 5);
      y += 15;
    }

    // Standard Sections
    const sections = [
      { title: 'Pontos Positivos', items: result.pontos_positivos },
      { title: 'Pontos de Ajuste', items: result.pontos_de_ajuste },
      { title: 'Sugestões', items: result.sugestoes }
    ];

    sections.forEach(section => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(section.title, 20, y);
      y += 7;
      doc.setFontSize(9);
      section.items.forEach(item => {
        const splitItem = doc.splitTextToSize(`• ${item}`, 160);
        doc.text(splitItem, 25, y);
        y += (splitItem.length * 5);
      });
      y += 5;
    });

    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text('Conclusão Geral', 20, y);
    y += 7;
    doc.setFontSize(9);
    const splitConclusao = doc.splitTextToSize(result.conclusao, 170);
    doc.text(splitConclusao, 20, y);

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Gerado automaticamente pelo DPG Check — Auditoria Inteligente', 105, 285, { align: 'center' });
    }

    doc.save(`DPGCheck_${user?.nome?.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-dpg-ink text-white text-[10px] font-black uppercase tracking-widest rounded-full">Auditoria Finalizada</span>
            <span className="text-dpg-ink/40 text-xs font-bold uppercase tracking-wider">• Protocolo: DPG-2025-{Math.floor(Math.random() * 9000) + 1000}</span>
          </div>
          <h2 className="text-4xl font-black text-dpg-ink tracking-tighter">Relatório de Auditoria</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={toggleSpeech} 
            className="btn-outline group"
            aria-label={isSpeaking ? "Parar leitura" : "Ouvir relatório"}
          >
            {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span className="hidden sm:inline">{isSpeaking ? "Parar Leitura" : "Ouvir Relatório"}</span>
          </button>
          <button onClick={exportToPDF} className="btn-outline group">
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
            <span>Baixar Relatório PDF</span>
          </button>
          <button onClick={onReset} className="btn-cyan group">
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            <span>Nova Auditoria</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 space-y-8"
        >
          {/* Summary Card */}
          <div className="glass-card p-8 md:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-dpg-cyan/10 flex items-center justify-center text-dpg-cyan shadow-glow">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-dpg-ink tracking-tight">Resumo Executivo</h3>
                <p className="text-sm font-medium text-dpg-ink/40">Visão geral da auditoria realizada</p>
              </div>
            </div>
            <p className="text-dpg-ink/70 leading-relaxed font-medium text-lg italic border-l-4 border-dpg-cyan/20 pl-6 py-2">
              "{result.resumo}"
            </p>
          </div>

          {/* Specialized Results */}
          {(result.texto_corrigido || result.seo_analysis) && (
            <div className="glass-card p-8 md:p-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-dpg-cyan/5 rounded-full blur-3xl -mr-16 -mt-16" />
              
              {result.texto_corrigido && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-dpg-cyan" />
                    <h3 className="text-xl font-black text-dpg-ink tracking-tight">Texto Corrigido & Revisado</h3>
                  </div>
                  <div className="bg-dpg-ink/5 p-8 rounded-3xl text-dpg-ink/80 font-mono text-sm leading-relaxed border border-dpg-ink/5 whitespace-pre-wrap">
                    {result.texto_corrigido}
                  </div>
                </div>
              )}

              {result.seo_analysis && (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-dpg-yellow" />
                    <h3 className="text-xl font-black text-dpg-ink tracking-tight">Auditoria Técnica SEO</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="p-6 bg-dpg-card rounded-3xl border border-dpg-border shadow-sm">
                      <label className="label-micro">Title Tag</label>
                      <p className="text-lg font-bold text-dpg-ink">{result.seo_analysis.title_tag}</p>
                    </div>
                    <div className="p-6 bg-dpg-card rounded-3xl border border-dpg-border shadow-sm">
                      <label className="label-micro">Meta Description</label>
                      <p className="text-sm font-medium text-dpg-ink/60 leading-relaxed">{result.seo_analysis.meta_description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Points Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8 border-l-8 border-l-emerald-500">
              <div className="flex items-center gap-4 mb-6 text-emerald-600">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-lg font-black tracking-tight">Pontos Positivos</h3>
              </div>
              <ul className="space-y-4">
                {result.pontos_positivos.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm font-medium text-dpg-ink/60 leading-snug">
                    <span className="text-emerald-500 font-black shrink-0">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-8 border-l-8 border-l-orange-500">
              <div className="flex items-center gap-4 mb-6 text-orange-600">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-black tracking-tight">Pontos de Ajuste</h3>
              </div>
              <ul className="space-y-4">
                {result.pontos_de_ajuste.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm font-medium text-dpg-ink/60 leading-snug">
                    <span className="text-orange-500 font-black shrink-0">!</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggestions */}
          <div className="glass-card p-8 md:p-10 bg-gradient-to-br from-white to-dpg-cyan/5">
            <div className="flex items-center gap-4 mb-8 text-dpg-cyan">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-premium">
                <Lightbulb size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-dpg-ink tracking-tight">Sugestões Estratégicas</h3>
                <p className="text-sm font-medium text-dpg-ink/40">Oportunidades de otimização</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.sugestoes.map((p, i) => (
                <div key={i} className="p-5 bg-dpg-card/50 rounded-2xl border border-dpg-border flex gap-4 items-start group hover:bg-dpg-card transition-colors">
                  <div className="w-6 h-6 rounded-full bg-dpg-cyan/10 flex items-center justify-center text-dpg-cyan text-[10px] font-black shrink-0 group-hover:bg-dpg-cyan group-hover:text-white transition-colors">
                    {i + 1}
                  </div>
                  <p className="text-sm font-bold text-dpg-ink/70 leading-tight">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 space-y-8"
        >
          {/* Status Card */}
          <div className="glass-card p-10 text-center relative overflow-hidden">
            <div className={cn(
              "absolute top-0 left-0 w-full h-2",
              result.status === 'Conforme' ? "bg-emerald-500" : "bg-orange-500"
            )} />
            
            <label className="label-micro mb-6">Parecer Técnico</label>
            
            <div className={cn(
              "inline-flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-2xl mb-8 shadow-lg",
              result.status === 'Conforme' 
                ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                : "bg-orange-500 text-white shadow-orange-500/20"
            )}>
              {result.status === 'Conforme' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
              {result.status.toUpperCase()}
            </div>
            
            <div className="pt-8 border-t border-dpg-ink/5 text-left">
              <h4 className="text-sm font-black text-dpg-ink uppercase tracking-widest mb-4">Conclusão Geral</h4>
              <p className="text-sm font-medium text-dpg-ink/60 leading-relaxed italic">
                "{result.conclusao}"
              </p>
            </div>
          </div>

          {/* Audit Info */}
          <div className="glass-card p-8 space-y-6">
            <h4 className="text-xs font-black text-dpg-ink uppercase tracking-widest">Detalhes da Auditoria</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-dpg-ink/30 uppercase">Responsável</span>
                <span className="text-sm font-bold text-dpg-ink">{user?.nome}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-dpg-ink/30 uppercase">Setor</span>
                <span className="text-sm font-bold text-dpg-ink">{user?.setor_nome || 'Geral'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-dpg-ink/30 uppercase">Categoria</span>
                <span className="text-sm font-bold text-dpg-ink">{category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-dpg-ink/30 uppercase">Tipo</span>
                <span className="text-sm font-bold text-dpg-ink">{type}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-dpg-ink p-8 rounded-4xl text-white shadow-2xl shadow-dpg-ink/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-dpg-cyan/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <h3 className="text-xl font-black mb-6 tracking-tight">Próximos Passos</h3>
            <div className="space-y-6">
              {[
                "Revise os pontos de ajuste destacados.",
                "Aplique as sugestões de melhoria estratégica.",
                "Submeta novamente se necessário para nova validação."
              ].map((step, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-dpg-cyan group-hover:text-white transition-colors">
                    {i + 1}
                  </div>
                  <p className="text-sm font-medium text-white/60 leading-snug group-hover:text-white transition-colors">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
