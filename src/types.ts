export type UserPerfil = 'colaborador' | 'supervisor' | 'gerente' | 'ceo' | 'administrador';
export type UserStatus = 'ativo' | 'aguardando_perfil' | 'inativo';
export type AnalysisStatus = 'Conforme' | 'Requer Ajustes';
export type UserPermissionType = 'visualizador' | 'revisor' | 'gestor' | 'administrador';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  foto_url?: string;
  perfil: UserPerfil;
  setor_id?: string;
  setor_nome?: string;
  tipo_permissao: UserPermissionType;
  status: UserStatus;
  data_criacao: string;
  ultimo_acesso?: string;
}

export interface Setor {
  id: string;
  nome: string;
  data_criacao: string;
}

export interface Categoria {
  id: string;
  setor_id: string;
  nome: string;
  setor_nome?: string;
  data_criacao: string;
}

export interface AnalysisResult {
  resumo: string;
  pontos_positivos: string[];
  pontos_de_ajuste: string[];
  sugestoes: string[];
  conclusao: string;
  status: AnalysisStatus;
  // Copy specific
  texto_corrigido?: string;
  melhorias_sugeridas?: string[];
  versao_revisada?: string;
  // Site specific
  checklist_tecnico?: {
    item: string;
    status: 'OK' | 'Ajustar';
    observacao: string;
  }[];
  seo_analysis?: {
    h1_h2_h3: string;
    meta_description: string;
    title_tag: string;
    keywords: string[];
  };
  ux_ui_analysis?: {
    clareza_visual: string;
    hierarquia_informacao: string;
    experiencia_usuario: string;
  };
}

export interface Analise {
  id: string;
  protocolo: string;
  cliente_nome: string;
  responsavel_nome: string;
  usuario_id: string;
  data_hora: string;
  nome_usuario: string;
  setor: string;
  perfil: string;
  categoria: string;
  categoria_id?: string;
  setor_id?: string;
  texto_tarefa?: string;
  resposta_ia: AnalysisResult;
  status: AnalysisStatus;
  tipo_analise: 'copy' | 'site' | 'imagem' | 'social';
  arquivos_urls: string[];
  url_site?: string;
}
