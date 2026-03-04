import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { api } from '../services/api';
import { Analise } from '../types';
import { useToast } from '../contexts/ToastContext';
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  FileSearch,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { showToast } = useToast();
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await api.getAnalises();
      setAnalises(data);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      showToast('Erro ao carregar dados', 'error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalAnalises = analises.length;
  const conformes = analises.filter(a => a.status === 'Conforme').length;
  const requerAjustes = analises.filter(a => a.status === 'Requer Ajustes').length;
  const conformidadeRate = totalAnalises > 0 ? Math.round((conformes / totalAnalises) * 100) : 0;

  const dataPorTipo = [
    { name: 'Texto', value: analises.filter(a => a.tipo_analise === 'texto').length },
    { name: 'Imagem', value: analises.filter(a => a.tipo_analise === 'imagem').length },
    { name: 'Site', value: analises.filter(a => a.tipo_analise === 'site').length },
    { name: 'Social', value: analises.filter(a => a.tipo_analise === 'social').length },
  ];

  const dataStatus = [
    { name: 'Conforme', value: conformes, color: '#22c55e' },
    { name: 'Requer Ajustes', value: requerAjustes, color: '#f97316' },
  ];

  const stats = [
    { label: 'Total de Análises', value: totalAnalises, icon: FileSearch, color: 'text-dpg-cyan', bg: 'bg-dpg-cyan/10' },
    { label: 'Taxa de Conformidade', value: `${conformidadeRate}%`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Conformes', value: conformes, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Requer Ajustes', value: requerAjustes, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-dpg-cyan"></div></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Qualidade</h1>
        <p className="text-gray-500">Visão geral do desempenho e conformidade das tarefas.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                <ArrowUpRight size={14} />
                12%
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Distribution by Type */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Análises por Tipo</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataPorTipo}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#29ABE2" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Distribution */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Status de Conformidade</h3>
          <div className="h-80 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4 pr-8">
              {dataStatus.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.name}</p>
                    <p className="text-lg font-bold text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
