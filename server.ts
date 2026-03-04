import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'node:crypto';

const app = express();
const PORT = 3000;
const db = new Database('dpg_check.db');

app.use(express.json({ limit: '50mb' }));

// API Routes
app.get('/api/me', (req, res) => {
  const { email } = req.query;
  
  if (email && typeof email === 'string') {
    if (!email.endsWith('@grupodpg.com.br')) {
      return res.status(403).json({ 
        error: 'Este aplicativo é exclusivo para colaboradores do Grupo DPG. Utilize seu e-mail corporativo para acessar.' 
      });
    }

    let user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
    
    // Auto-create user if it's the first time and domain is correct
    if (!user) {
      const id = randomUUID();
      db.prepare('INSERT INTO usuarios (id, nome, email, status) VALUES (?, ?, ?, ?)').run(
        id, email.split('@')[0], email, 'aguardando_perfil'
      );
      user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    }
    
    return res.json(user);
  }

  // If no email, just return the first user (for dev/initial load if needed)
  const user = db.prepare('SELECT * FROM usuarios LIMIT 1').get();
  res.json(user);
});

app.get('/api/setores', (req, res) => {
  const setores = db.prepare('SELECT * FROM setores ORDER BY nome').all();
  res.json(setores);
});

app.post('/api/setores', (req, res) => {
  const { nome } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO setores (id, nome) VALUES (?, ?)').run(id, nome);
  res.json({ id, nome });
});

app.delete('/api/setores/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM categorias WHERE setor_id = ?').run(id);
  db.prepare('DELETE FROM setores WHERE id = ?').run(id);
  res.json({ success: true });
});

app.get('/api/categorias', (req, res) => {
  const { setor_id } = req.query;
  let categorias;
  if (setor_id) {
    categorias = db.prepare('SELECT * FROM categorias WHERE setor_id = ? ORDER BY nome').all(setor_id);
  } else {
    categorias = db.prepare('SELECT c.*, s.nome as setor_nome FROM categorias c JOIN setores s ON c.setor_id = s.id ORDER BY s.nome, c.nome').all();
  }
  res.json(categorias);
});

app.post('/api/categorias', (req, res) => {
  const { setor_id, nome } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO categorias (id, setor_id, nome) VALUES (?, ?, ?)').run(id, setor_id, nome);
  res.json({ id, setor_id, nome });
});

app.delete('/api/categorias/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM categorias WHERE id = ?').run(id);
  res.json({ success: true });
});

app.get('/api/usuarios', (req, res) => {
  const usuarios = db.prepare('SELECT u.*, s.nome as setor_nome FROM usuarios u LEFT JOIN setores s ON u.setor_id = s.id ORDER BY u.nome').all();
  res.json(usuarios);
});

app.post('/api/usuarios', (req, res) => {
  const { nome, email, perfil, setor_id, tipo_permissao } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO usuarios (id, nome, email, perfil, setor_id, tipo_permissao, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id, nome, email, perfil, setor_id, tipo_permissao || 'visualizador', 'ativo'
  );
  res.json({ id, nome, email, perfil, setor_id, tipo_permissao });
});

app.patch('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const { status, perfil, setor_id, tipo_permissao } = req.body;
  
  const updates = [];
  const params = [];
  
  if (status) { updates.push('status = ?'); params.push(status); }
  if (perfil) { updates.push('perfil = ?'); params.push(perfil); }
  if (setor_id) { updates.push('setor_id = ?'); params.push(setor_id); }
  if (tipo_permissao) { updates.push('tipo_permissao = ?'); params.push(tipo_permissao); }
  
  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  
  res.json({ success: true });
});

app.get('/api/analises', (req, res) => {
  const analises = db.prepare('SELECT * FROM analises ORDER BY data_hora DESC').all();
  res.json(analises.map((a: any) => ({
    ...a,
    resposta_ia: JSON.parse(a.resposta_ia),
    arquivos_urls: JSON.parse(a.arquivos_urls)
  })));
});

app.post('/api/analises', (req, res) => {
  const { 
    usuario_id, nome_usuario, setor, perfil, categoria, 
    categoria_id, setor_id, texto_tarefa, resposta_ia, 
    status, tipo_analise, arquivos_urls, url_site,
    cliente_nome, responsavel_nome
  } = req.body;
  
  const id = randomUUID();
  const protocolo = `DPG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  db.prepare(`
    INSERT INTO analises (
      id, protocolo, cliente_nome, responsavel_nome,
      usuario_id, nome_usuario, setor, perfil, categoria, 
      categoria_id, setor_id, texto_tarefa, resposta_ia, 
      status, tipo_analise, arquivos_urls, url_site
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, protocolo, cliente_nome || 'N/A', responsavel_nome || nome_usuario,
    usuario_id, nome_usuario, setor, perfil, categoria,
    categoria_id, setor_id, texto_tarefa, JSON.stringify(resposta_ia),
    status, tipo_analise, JSON.stringify(arquivos_urls), url_site
  );
  
  res.json({ id, protocolo });
});

app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT count(*) as count FROM analises').get() as any;
  const conformes = db.prepare("SELECT count(*) as count FROM analises WHERE status = 'Conforme'").get() as any;
  const porTipo = db.prepare('SELECT tipo_analise as name, count(*) as value FROM analises GROUP BY tipo_analise').all();
  
  res.json({
    total: total.count,
    conformes: conformes.count,
    porTipo
  });
});

// Vite Middleware
async function startServer() {
  // Initialize Database
  db.exec(`
    CREATE TABLE IF NOT EXISTS setores (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id TEXT PRIMARY KEY,
      setor_id TEXT REFERENCES setores(id),
      nome TEXT NOT NULL,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      foto_url TEXT,
      perfil TEXT DEFAULT 'colaborador',
      tipo_permissao TEXT DEFAULT 'visualizador',
      setor_id TEXT REFERENCES setores(id),
      status TEXT DEFAULT 'aguardando_perfil',
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      ultimo_acesso DATETIME
    );

    CREATE TABLE IF NOT EXISTS analises (
      id TEXT PRIMARY KEY,
      protocolo TEXT NOT NULL,
      cliente_nome TEXT NOT NULL,
      responsavel_nome TEXT NOT NULL,
      usuario_id TEXT REFERENCES usuarios(id),
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      nome_usuario TEXT,
      setor TEXT,
      perfil TEXT,
      categoria TEXT,
      categoria_id TEXT,
      setor_id TEXT,
      texto_tarefa TEXT,
      resposta_ia TEXT, -- JSON string
      status TEXT,
      tipo_analise TEXT,
      arquivos_urls TEXT, -- JSON string
      url_site TEXT
    );
  `);

  // Ensure Marketing sector exists
  let marketingSetor = db.prepare('SELECT id FROM setores WHERE nome = ?').get('Marketing') as any;
  if (!marketingSetor) {
    const id = randomUUID();
    db.prepare('INSERT INTO setores (id, nome) VALUES (?, ?)').run(id, 'Marketing');
    marketingSetor = { id };
  }

  // Ensure basic categories exist in Marketing sector
  const basicCategories = [
    'Revisão de Site',
    'Revisão de Funcionalidade',
    'Revisão de Texto',
    'Revisão de Copy',
    'Revisão de Texto para Post'
  ];

  basicCategories.forEach(cat => {
    const exists = db.prepare('SELECT id FROM categorias WHERE nome = ? AND setor_id = ?').get(cat, marketingSetor.id);
    if (!exists) {
      db.prepare('INSERT INTO categorias (id, setor_id, nome) VALUES (?, ?, ?)').run(randomUUID(), marketingSetor.id, cat);
    }
  });

  // Initial Admin
  const adminExists = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('lucas.soares@grupodpg.com.br');
  if (!adminExists) {
    db.prepare('INSERT INTO usuarios (id, nome, email, perfil, tipo_permissao, status, setor_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      randomUUID(), 'Lucas Soares', 'lucas.soares@grupodpg.com.br', 'administrador', 'administrador', 'ativo', marketingSetor.id
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile(path.resolve('dist/index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
