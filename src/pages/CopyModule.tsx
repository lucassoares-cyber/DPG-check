import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Upload, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Download,
  FileDown,
  RefreshCcw,
  Loader2
} from 'lucide-react';
import { analyzeTask } from '../services/aiService';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AnalysisResult } from '../types';
import { cn } from '../lib/utils';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export function CopyModule() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [clientName, setClientName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [protocol, setProtocol] = useState<string | null>(null);

  const extractTextFromFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } else if (extension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } else if (extension === 'doc') {
      throw new Error('Formato .doc não é suportado diretamente no navegador. Por favor, use .docx ou .pdf.');
    }
    
    return await file.text();
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const extractedText = await extractTextFromFile(file);
      setText(extractedText);
      showToast('Sucesso', 'success', 'Texto extraído do arquivo com sucesso');
    } catch (err: any) {
      showToast('Erro', 'error', err.message);
    }
  }, [showToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false
  } as any);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      showToast('Atenção', 'warning', 'Por favor, insira o texto para análise');
      return;
    }
    if (!clientName.trim()) {
      showToast('Atenção', 'warning', 'Por favor, informe o nome do cliente');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeTask('copy', { text });
      setResult(analysis);
      
      // Save to history
      const saved = await api.createAnalise({
        usuario_id: user?.id || '',
        nome_usuario: user?.nome || '',
        setor: user?.setor_nome || 'N/A',
        perfil: user?.perfil || 'colaborador',
        categoria: 'Copywriting',
        texto_tarefa: text,
        resposta_ia: analysis,
        status: analysis.status,
        tipo_analise: 'copy',
        cliente_nome: clientName,
        responsavel_nome: user?.nome || ''
      });
      
      setProtocol(saved.protocolo);
      showToast('Auditoria Concluída', 'success', 'A auditoria de copy foi concluída com sucesso.');
    } catch (err: any) {
      showToast('Erro', 'error', err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast('Copiado', 'success', 'Texto copiado para a área de transferência');
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
    doc.text('RELATÓRIO DE REVISÃO DE COPY', 105, 30, { align: 'center' });

    // Info
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(12);
    doc.text(`Protocolo: ${protocol}`, 20, 50);
    doc.text(`Cliente: ${clientName}`, 20, 60);
    doc.text(`Responsável: ${user?.nome}`, 20, 70);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 20, 80);
    doc.text(`Status: ${result.status}`, 20, 90);

    // Content
    doc.setFontSize(14);
    doc.text('Resumo da Análise', 20, 110);
    doc.setFontSize(10);
    const splitResumo = doc.splitTextToSize(result.resumo, 170);
    doc.text(splitResumo, 20, 120);

    let y = 120 + (splitResumo.length * 5) + 10;

    doc.setFontSize(14);
    doc.text('Texto Corrigido', 20, y);
    doc.setFontSize(10);
    const splitCorrigido = doc.splitTextToSize(result.texto_corrigido || '', 170);
    doc.text(splitCorrigido, 20, y + 10);

    y += (splitCorrigido.length * 5) + 20;
    if (y > 250) { doc.addPage(); y = 20; }

    doc.setFontSize(14);
    doc.text('Versão Revisada (Otimizada)', 20, y);
    doc.setFontSize(10);
    const splitRevisada = doc.splitTextToSize(result.versao_revisada || '', 170);
    doc.text(splitRevisada, 20, y + 10);

    doc.save(`DPG-CHECK-COPY-${clientName}-${protocol}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-dpg-ink">Módulo de Copy</h1>
          <p className="text-dpg-ink/60 mt-1">Revisão inteligente de textos, anúncios e conteúdos.</p>
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
              onClick={() => { setResult(null); setProtocol(null); setText(''); }}
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
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-dpg-card rounded-3xl p-6 shadow-xl border border-dpg-border space-y-4 transition-colors duration-300">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dpg-ink/40 uppercase ml-1">Nome do Cliente</label>
                  <input 
                    type="text" 
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-4 py-3 bg-dpg-ink/5 border-none rounded-xl focus:ring-2 focus:ring-dpg-cyan transition-all text-dpg-ink font-medium"
                    placeholder="Ex: Clínica Sorriso, Advocacia Silva..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dpg-ink/40 uppercase ml-1">Texto para Revisão</label>
                  <textarea 
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="w-full h-80 px-4 py-3 bg-dpg-ink/5 border-none rounded-2xl focus:ring-2 focus:ring-dpg-cyan transition-all text-dpg-ink font-medium resize-none"
                    placeholder="Cole seu texto aqui ou arraste um arquivo ao lado..."
                  />
                </div>

                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-4 bg-dpg-ink text-dpg-bg rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-dpg-ink/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-dpg-ink/20"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" />
                      <span>Analisando Copy...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Iniciar Auditoria de Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div 
                {...getRootProps()} 
                className={cn(
                  "h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 p-8 transition-all cursor-pointer",
                  isDragActive ? "border-dpg-cyan bg-dpg-cyan/5" : "border-dpg-bg/10 bg-white hover:border-dpg-bg/20"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-full bg-dpg-bg/5 flex items-center justify-center">
                  <Upload className="text-dpg-bg/40" size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-dpg-bg">Upload de Arquivo</p>
                  <p className="text-xs text-dpg-bg/40 mt-1">PDF, DOCX ou TXT</p>
                </div>
              </div>

              <div className="bg-dpg-bg text-white rounded-3xl p-6 shadow-xl">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <AlertCircle size={18} className="text-dpg-yellow" />
                  <span>O que analisamos?</span>
                </h3>
                <ul className="space-y-3 text-sm text-white/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-dpg-cyan mt-0.5" />
                    <span>Ortografia e Gramática</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-dpg-cyan mt-0.5" />
                    <span>Clareza e Coerência</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-dpg-cyan mt-0.5" />
                    <span>Poder de Persuasão (AIDA)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-dpg-cyan mt-0.5" />
                    <span>Estrutura e Escaneabilidade</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-dpg-cyan mt-0.5" />
                    <span>Sugestões Estratégicas</span>
                  </li>
                </ul>
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
                {/* Result Cards */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-white/40">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-dpg-bg flex items-center gap-2">
                      <FileText className="text-dpg-cyan" />
                      Texto Corrigido
                    </h3>
                    <button 
                      onClick={() => handleCopyText(result.texto_corrigido || '')}
                      className="p-2 hover:bg-dpg-bg/5 rounded-lg transition-colors text-dpg-bg/40"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  <div className="bg-dpg-bg/5 rounded-2xl p-6 text-dpg-bg/80 leading-relaxed whitespace-pre-wrap">
                    {result.texto_corrigido}
                  </div>
                </div>

                <div className="bg-dpg-bg rounded-3xl p-8 shadow-xl text-white">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <RefreshCcw className="text-dpg-cyan" />
                      Versão Revisada (Otimizada)
                    </h3>
                    <button 
                      onClick={() => handleCopyText(result.versao_revisada || '')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-6 text-white/90 leading-relaxed whitespace-pre-wrap">
                    {result.versao_revisada}
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
                  <h3 className="font-bold text-dpg-bg mb-4">Melhorias Sugeridas</h3>
                  <ul className="space-y-3">
                    {result.melhorias_sugeridas?.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-dpg-bg/70">
                        <div className="w-1.5 h-1.5 rounded-full bg-dpg-cyan mt-1.5 shrink-0" />
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
                        <div className="w-1.5 h-1.5 rounded-full bg-dpg-magenta mt-1.5 shrink-0" />
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
