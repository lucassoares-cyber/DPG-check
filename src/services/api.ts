import { Usuario, Setor, Categoria, Analise, AnalysisResult } from '../types';

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || `Request failed with status ${res.status}`;
    console.error(`API Error [${res.url}]:`, {
      status: res.status,
      statusText: res.statusText,
      data: errorData
    });
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  async getMe(): Promise<Usuario> {
    const res = await fetch('/api/me');
    return handleResponse(res);
  },

  async getSetores(): Promise<Setor[]> {
    const res = await fetch('/api/setores');
    return handleResponse(res);
  },

  async createSetor(nome: string): Promise<Setor> {
    const res = await fetch('/api/setores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    });
    return handleResponse(res);
  },

  async deleteSetor(id: string): Promise<void> {
    const res = await fetch(`/api/setores/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  async getCategorias(setorId?: string): Promise<Categoria[]> {
    const url = setorId ? `/api/categorias?setor_id=${setorId}` : '/api/categorias';
    const res = await fetch(url);
    return handleResponse(res);
  },

  async createCategoria(setor_id: string, nome: string): Promise<Categoria> {
    const res = await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setor_id, nome }),
    });
    return handleResponse(res);
  },

  async deleteCategoria(id: string): Promise<void> {
    const res = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  async getUsuarios(): Promise<Usuario[]> {
    const res = await fetch('/api/usuarios');
    return handleResponse(res);
  },

  async createUsuario(data: Partial<Usuario>): Promise<Usuario> {
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateUsuario(id: string, data: Partial<Usuario>): Promise<void> {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getAnalises(): Promise<Analise[]> {
    const res = await fetch('/api/analises');
    return handleResponse(res);
  },

  async createAnalise(data: Partial<Analise>): Promise<{ id: string; protocolo: string }> {
    const res = await fetch('/api/analises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getStats(): Promise<any> {
    const res = await fetch('/api/stats');
    return handleResponse(res);
  }
};
