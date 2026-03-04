import React, { useState, useEffect } from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  Globe, 
  Share2, 
  Upload, 
  X, 
  Loader2,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Categoria, AnalysisResult } from '../types';
import { analyzeTask } from '../services/aiService';
import { AnalysisResultView } from '../components/AnalysisResultView';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../lib/utils';

type Step = 'selection' | 'form' | 'loading' | 'result';
type AnalysisType = 'copy' | 'imagem' | 'site' | 'social';

export function Home() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('selection');
  const [type, setType] = useState<AnalysisType | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [clientName, setClientName] = useState('');

  // Form states
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (user?.setor_id) {
      fetchCategorias(user.setor_id);
    }
  }, [user]);

  const fetchCategorias = async (setorId: string) => {
    try {
      const data = await api.getCategorias(setorId);
      setCategorias(data);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      showToast('Erro ao carregar categorias', 'error', err.message);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, reader.result as string].slice(0, 10));
      };
      reader.readAsDataURL(file);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    maxFiles: 10,
    multiple: true
  } as any);

  const handleStartAnalysis = async () => {
    if (!selectedCategoria) {
      showToast('Atenção', 'warning', 'Selecione uma categoria antes de continuar.');
      return;
    }
    
    setStep('loading');
    try {
      let data: any = {};
      if (type === 'copy') data = { text };
      else if (type === 'imagem') data = { images };
      else if (type === 'site') data = { url };
      else if (type === 'social') data = { text, platform, images };

      const analysisResult = await analyzeTask(type!, data);
      setResult(analysisResult);

      // Save to database
      await api.createAnalise({
        usuario_id: user?.id || '',
        nome_usuario: user?.nome || '',
        setor: user?.setor_nome || 'N/A',
        perfil: user?.perfil || 'colaborador',
        categoria: categorias.find(c => c.id === selectedCategoria)?.nome || 'Geral',
        categoria_id: selectedCategoria,
        setor_id: user?.setor_id,
        texto_tarefa: text || url,
        resposta_ia: analysisResult,
        status: analysisResult.status,
        tipo_analise: type!,
        arquivos_urls: images,
        url_site: url,
        cliente_nome: clientName || 'N/A',
        responsavel_nome: user?.nome || ''
      });

      if (type === 'copy') {
        showToast('Auditoria Concluída', 'success', 'A auditoria de copy foi concluída com sucesso.');
      } else if (type === 'site') {
        showToast('Auditoria Concluída', 'success', 'A auditoria de site foi concluída com sucesso.');
      } else {
        showToast('Auditoria Concluída', 'success', 'A análise foi concluída com sucesso.');
      }
      setStep('result');
    } catch (error: any) {
      console.error('Analysis error:', error);
      showToast('Erro na análise', 'error', error.message);
      setStep('form');
    }
  };

  const types = [
    { id: 'copy', label: 'Texto / Copy', icon: Type, color: 'bg-dpg-cyan' },
    { id: 'imagem', label: 'Imagens / Criação', icon: ImageIcon, color: 'bg-dpg-magenta' },
    { id: 'site', label: 'Site / Link', icon: Globe, color: 'bg-dpg-yellow' },
    { id: 'social', label: 'Redes Sociais', icon: Share2, color: 'bg-dpg-black' },
  ];

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {step === 'selection' && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h1 className="text-4xl font-bold text-dpg-ink mb-4">O que vamos revisar hoje?</h1>
              <p className="text-dpg-ink/60">Selecione o tipo de tarefa para começar a análise inteligente.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {types.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setType(t.id as AnalysisType); setStep('form'); }}
                  className="group relative bg-dpg-card p-8 rounded-4xl shadow-premium border border-dpg-border hover:shadow-2xl hover:-translate-y-2 transition-all text-left overflow-hidden"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-3xl flex items-center justify-center text-white mb-8 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-lg", 
                    t.color,
                    t.id === 'copy' && "shadow-dpg-cyan/20",
                    t.id === 'imagem' && "shadow-dpg-magenta/20",
                    t.id === 'site' && "shadow-dpg-yellow/20",
                    t.id === 'social' && "shadow-dpg-ink/20"
                  )}>
                    <t.icon size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-dpg-ink mb-2 tracking-tighter">{t.label}</h3>
                  <p className="text-sm font-medium text-dpg-ink/40">Clique para iniciar auditoria inteligente</p>
                  
                  <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <div className="w-10 h-10 rounded-full bg-dpg-ink flex items-center justify-center text-white">
                      <ArrowRight size={20} />
                    </div>
                  </div>

                  {/* Decorative element */}
                  <div className={cn(
                    "absolute -top-12 -right-12 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity",
                    t.color
                  )} />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-3xl mx-auto"
          >
            <button 
              onClick={() => setStep('selection')}
              className="flex items-center gap-2 text-dpg-ink/60 hover:text-dpg-ink mb-6 transition-colors"
            >
              <ChevronLeft size={20} />
              Voltar para seleção
            </button>

            <div className="glass-card p-10 space-y-8">
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", 
                  types.find(t => t.id === type)?.color
                )}>
                  {React.createElement(types.find(t => t.id === type)?.icon || Type, { size: 28 })}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-dpg-ink tracking-tighter">{types.find(t => t.id === type)?.label}</h2>
                  <p className="text-sm font-medium text-dpg-ink/40">Preencha os dados abaixo para auditoria</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="label-micro">Nome do Cliente</label>
                  <input 
                    type="text" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="input-field"
                    placeholder="Ex: Clínica Sorriso, Advocacia Silva..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="label-micro">Categoria</label>
                    <select 
                      value={selectedCategoria}
                      onChange={(e) => setSelectedCategoria(e.target.value)}
                      className="input-field appearance-none"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  {type === 'social' && (
                    <div className="space-y-1.5">
                      <label className="label-micro">Plataforma</label>
                      <select 
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="input-field appearance-none"
                      >
                        <option>Instagram</option>
                        <option>LinkedIn</option>
                        <option>Facebook</option>
                        <option>Twitter / X</option>
                        <option>TikTok</option>
                      </select>
                    </div>
                  )}
                </div>

                {(type === 'copy' || type === 'social') && (
                  <div className="space-y-1.5">
                    <label className="label-micro">Texto / Legenda</label>
                    <textarea 
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="input-field h-48 resize-none"
                      placeholder="Cole aqui o texto que deseja revisar..."
                    />
                  </div>
                )}

                {type === 'site' && (
                  <div className="space-y-1.5">
                    <label className="label-micro">URL do Site</label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-dpg-ink/20 group-focus-within:text-dpg-cyan transition-colors" size={18} />
                      <input 
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="input-field pl-12"
                        placeholder="https://exemplo.com.br"
                      />
                    </div>
                  </div>
                )}

                {(type === 'imagem' || type === 'social') && (
                  <div className="space-y-1.5">
                    <label className="label-micro">Imagens (até 10)</label>
                    <div {...getRootProps()} className={cn(
                      "border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer",
                      isDragActive ? "border-dpg-cyan bg-dpg-cyan/5" : "border-dpg-ink/5 hover:border-dpg-cyan hover:bg-dpg-cyan/5"
                    )}>
                      <input {...getInputProps()} />
                      <Upload className="mx-auto text-dpg-ink/20 mb-4" size={40} />
                      <p className="text-sm font-bold text-dpg-ink">Arraste imagens ou clique para selecionar</p>
                      <p className="text-xs text-dpg-ink/40 mt-1">Formatos suportados: JPG, PNG, WEBP</p>
                    </div>
                    
                    {images.length > 0 && (
                      <div className="grid grid-cols-5 gap-3 mt-6">
                        {images.map((img, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative aspect-square rounded-2xl overflow-hidden border border-dpg-ink/5 group"
                          >
                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X size={12} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button 
                  onClick={handleStartAnalysis}
                  disabled={loading || (type === 'copy' && !text) || (type === 'site' && !url)}
                  className="btn-cyan w-full py-5 text-xl group"
                >
                  <span>Iniciar Auditoria Inteligente</span>
                  <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="relative w-32 h-32 mb-10">
              <div className="absolute inset-0 border-4 border-dpg-ink/5 rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-t-dpg-cyan rounded-full" 
              />
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-premium">
                <Loader2 className="text-dpg-cyan animate-pulse" size={40} />
              </div>
            </div>
            <h2 className="text-3xl font-black text-dpg-ink mb-3 tracking-tighter">Auditoria em Andamento</h2>
            <p className="text-dpg-ink/40 max-w-sm font-medium">Nossa IA está revisando cada detalhe para garantir a excelência DPG.</p>
            
            <div className="mt-12 flex gap-4">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                className="w-3 h-3 rounded-full bg-dpg-cyan shadow-[0_0_10px_rgba(41,171,226,0.5)]" 
              />
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}
                className="w-3 h-3 rounded-full bg-dpg-magenta shadow-[0_0_10px_rgba(236,0,140,0.5)]" 
              />
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-3 h-3 rounded-full bg-dpg-yellow shadow-[0_0_10px_rgba(255,242,0,0.5)]" 
              />
            </div>
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AnalysisResultView 
              result={result} 
              onReset={() => { setStep('selection'); setResult(null); setText(''); setUrl(''); setImages([]); }}
              type={types.find(t => t.id === type)?.label || ''}
              category={categorias.find(c => c.id === selectedCategoria)?.nome || ''}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
