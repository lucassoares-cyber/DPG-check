import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Usuario, Setor, Categoria } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Layers, 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  UserPlus
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Admin() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'setores' | 'categorias'>('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'usuario' | 'setor' | 'categoria' | 'edit_usuario'>('setor');
  const [formData, setFormData] = useState<any>({});
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'usuarios') {
        const data = await api.getUsuarios();
        setUsuarios(data);
      } else if (activeTab === 'setores') {
        const data = await api.getSetores();
        setSetores(data);
      } else if (activeTab === 'categorias') {
        const data = await api.getCategorias();
        setCategorias(data);
      }
      
      const sData = await api.getSetores();
      setSetores(sData);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      showToast('Erro ao carregar dados administrativos', 'error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      await api.updateUsuario(userId, { status: status as any });
      showToast('Sucesso', 'success', 'Status atualizado com sucesso');
      fetchData();
    } catch (err: any) {
      showToast('Erro', 'error', err.message);
    }
  };

  const handleEditUser = (user: Usuario) => {
    setSelectedUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      setor_id: user.setor_id,
      tipo_permissao: user.tipo_permissao,
      status: user.status
    });
    setModalType('edit_usuario');
    setShowModal(true);
  };

  const handleDeleteSetor = async (id: string) => {
    if (!confirm('Tem certeza? Isso excluirá todas as categorias deste setor.')) return;
    try {
      await api.deleteSetor(id);
      showToast('Sucesso', 'success', 'Setor excluído');
      fetchData();
    } catch (err: any) {
      showToast('Erro', 'error', err.message);
    }
  };

  const handleDeleteCategoria = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      await api.deleteCategoria(id);
      showToast('Sucesso', 'success', 'Categoria excluída');
      fetchData();
    } catch (err: any) {
      showToast('Erro', 'error', err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'setor') {
        await api.createSetor(formData.nome);
      } else if (modalType === 'categoria') {
        await api.createCategoria(formData.setor_id, formData.nome);
      } else if (modalType === 'usuario') {
        await api.createUsuario(formData);
      } else if (modalType === 'edit_usuario' && selectedUser) {
        await api.updateUsuario(selectedUser.id, formData);
      }
      showToast('Sucesso', 'success', 'Registro salvo com sucesso');
      setShowModal(false);
      setFormData({});
      setSelectedUser(null);
      fetchData();
    } catch (err: any) {
      showToast('Erro', 'error', err.message);
    }
  };

  const tabs = [
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'setores', label: 'Setores', icon: Layers },
    { id: 'categorias', label: 'Categorias', icon: Tag },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-dpg-ink tracking-tighter">Painel de Controle</h1>
          <p className="text-dpg-ink/40 font-medium mt-1">Gestão de acessos, setores e categorias do DPG Check.</p>
        </div>
        
        <button 
          onClick={() => {
            if (activeTab === 'usuarios') setModalType('usuario');
            else if (activeTab === 'setores') setModalType('setor');
            else if (activeTab === 'categorias') setModalType('categoria');
            setShowModal(true);
          }}
          className="btn-cyan group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>Novo {activeTab === 'usuarios' ? 'Usuário' : activeTab === 'setores' ? 'Setor' : 'Categoria'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-dpg-ink/5 w-fit shadow-premium">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-dpg-ink text-white shadow-lg shadow-dpg-ink/10" 
                : "text-dpg-ink/40 hover:text-dpg-ink hover:bg-dpg-ink/5"
            )}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-dpg-cyan/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-dpg-cyan rounded-full animate-spin" />
            </div>
            <p className="text-dpg-ink/40 font-black uppercase tracking-widest text-xs">Sincronizando Dados...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dpg-ink/[0.02] border-b border-dpg-ink/5">
                  {activeTab === 'usuarios' && (
                    <>
                      <th className="p-6 label-micro">Colaborador</th>
                      <th className="p-6 label-micro">Perfil / Setor</th>
                      <th className="p-6 label-micro">Permissão</th>
                      <th className="p-6 label-micro">Status</th>
                      <th className="p-6 label-micro text-right">Ações</th>
                    </>
                  )}
                  {activeTab === 'setores' && (
                    <>
                      <th className="p-6 label-micro">Nome do Setor</th>
                      <th className="p-6 label-micro">Data de Criação</th>
                      <th className="p-6 label-micro text-right">Ações</th>
                    </>
                  )}
                  {activeTab === 'categorias' && (
                    <>
                      <th className="p-6 label-micro">Nome da Categoria</th>
                      <th className="p-6 label-micro">Setor Relacionado</th>
                      <th className="p-6 label-micro">Data de Criação</th>
                      <th className="p-6 label-micro text-right">Ações</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-dpg-ink/5">
                {activeTab === 'usuarios' && usuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-dpg-ink/[0.01] transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-dpg-ink flex items-center justify-center text-white font-black text-lg shadow-lg shadow-dpg-ink/10">
                          {user.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-dpg-ink tracking-tight">{user.nome}</p>
                          <p className="text-xs font-bold text-dpg-ink/30">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-black text-dpg-ink uppercase tracking-tight">{user.perfil}</p>
                      <p className="text-xs font-bold text-dpg-ink/30">{(user as any).setor_nome || 'Geral'}</p>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-black text-dpg-ink/60 uppercase tracking-widest bg-dpg-ink/5 px-3 py-1.5 rounded-lg">
                        {user.tipo_permissao}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        user.status === 'ativo' ? "bg-emerald-100 text-emerald-700" : 
                        user.status === 'inativo' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          user.status === 'ativo' ? "bg-emerald-500" : 
                          user.status === 'inativo' ? "bg-red-500" : "bg-orange-500"
                        )} />
                        {user.status === 'ativo' ? 'Ativo' : user.status === 'inativo' ? 'Inativo' : 'Pendente'}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="p-2.5 hover:bg-dpg-ink/5 text-dpg-ink/40 hover:text-dpg-ink rounded-xl transition-colors"
                          title="Editar Permissões"
                        >
                          <Edit2 size={18} />
                        </button>
                        {user.status !== 'ativo' && (
                          <button 
                            onClick={() => handleUpdateStatus(user.id, 'ativo')}
                            className="p-2.5 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-colors"
                            title="Aprovar Acesso"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        {user.status === 'ativo' && (
                          <button 
                            onClick={() => handleUpdateStatus(user.id, 'inativo')}
                            className="p-2.5 hover:bg-red-50 text-red-600 rounded-xl transition-colors"
                            title="Bloquear Acesso"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'setores' && setores.map((setor) => (
                  <tr key={setor.id} className="hover:bg-dpg-bg/5 transition-colors group">
                    <td className="p-4">
                      <p className="font-bold text-dpg-bg">{setor.nome}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-dpg-bg/60">{new Date(setor.data_criacao).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteSetor(setor.id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'categorias' && categorias.map((cat) => (
                  <tr key={cat.id} className="hover:bg-dpg-bg/5 transition-colors group">
                    <td className="p-4">
                      <p className="font-bold text-dpg-bg">{cat.nome}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-dpg-bg/60">{(cat as any).setor_nome || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-dpg-bg/60">{new Date(cat.data_criacao).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteCategoria(cat.id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-dpg-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-4xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-dpg-ink/5 flex items-center justify-between bg-dpg-ink/[0.02]">
                <div>
                  <h2 className="text-2xl font-black text-dpg-ink tracking-tight">
                    {modalType === 'edit_usuario' ? 'Gestão de Acesso' : `Novo ${modalType === 'usuario' ? 'Usuário' : modalType === 'setor' ? 'Setor' : 'Categoria'}`}
                  </h2>
                  <p className="text-xs font-bold text-dpg-ink/30 uppercase tracking-widest mt-1">Configurações Administrativas</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-dpg-ink/5 rounded-2xl transition-colors">
                  <X size={20} className="text-dpg-ink/40" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                {modalType === 'setor' && (
                  <div className="space-y-2">
                    <label className="label-micro">Nome do Setor</label>
                    <input 
                      required
                      type="text" 
                      value={formData.nome || ''}
                      onChange={e => setFormData({...formData, nome: e.target.value})}
                      className="input-field"
                      placeholder="Ex: Marketing, Design, TI..."
                    />
                  </div>
                )}

                {modalType === 'categoria' && (
                  <>
                    <div className="space-y-2">
                      <label className="label-micro">Setor Relacionado</label>
                      <select 
                        required
                        value={formData.setor_id || ''}
                        onChange={e => setFormData({...formData, setor_id: e.target.value})}
                        className="input-field"
                      >
                        <option value="">Selecione um setor</option>
                        {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="label-micro">Nome da Categoria</label>
                      <input 
                        required
                        type="text" 
                        value={formData.nome || ''}
                        onChange={e => setFormData({...formData, nome: e.target.value})}
                        className="input-field"
                        placeholder="Ex: Copywriting, Social Media..."
                      />
                    </div>
                  </>
                )}

                {(modalType === 'usuario' || modalType === 'edit_usuario') && (
                  <>
                    <div className="space-y-2">
                      <label className="label-micro">Nome Completo</label>
                      <input 
                        required
                        type="text" 
                        value={formData.nome || ''}
                        onChange={e => setFormData({...formData, nome: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label-micro">E-mail Corporativo</label>
                      <input 
                        required
                        type="email" 
                        value={formData.email || ''}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="input-field disabled:opacity-50"
                        disabled={modalType === 'edit_usuario'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="label-micro">Nível Hierárquico</label>
                        <select 
                          required
                          value={formData.perfil || 'colaborador'}
                          onChange={e => setFormData({...formData, perfil: e.target.value})}
                          className="input-field"
                        >
                          <option value="colaborador">Colaborador</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="gerente">Gerente</option>
                          <option value="ceo">CEO</option>
                          <option value="administrador">Administrador</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="label-micro">Setor</label>
                        <select 
                          required
                          value={formData.setor_id || ''}
                          onChange={e => setFormData({...formData, setor_id: e.target.value})}
                          className="input-field"
                        >
                          <option value="">Nenhum</option>
                          {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="label-micro">Tipo de Permissão</label>
                        <select 
                          required
                          value={formData.tipo_permissao || 'visualizador'}
                          onChange={e => setFormData({...formData, tipo_permissao: e.target.value})}
                          className="input-field"
                        >
                          <option value="visualizador">Visualizador</option>
                          <option value="revisor">Revisor</option>
                          <option value="gestor">Gestor</option>
                          <option value="administrador">Administrador</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="label-micro">Status da Conta</label>
                        <select 
                          required
                          value={formData.status || 'aguardando_perfil'}
                          onChange={e => setFormData({...formData, status: e.target.value})}
                          className="input-field"
                        >
                          <option value="ativo">Ativo</option>
                          <option value="inativo">Inativo</option>
                          <option value="aguardando_perfil">Pendente</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-4 bg-dpg-ink/5 text-dpg-ink font-black rounded-2xl hover:bg-dpg-ink/10 transition-colors uppercase tracking-widest text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 bg-dpg-cyan text-dpg-ink font-black rounded-2xl hover:bg-dpg-cyan/90 transition-colors shadow-lg shadow-dpg-cyan/20 uppercase tracking-widest text-xs"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
