-- DPG Check SQL Schema

-- Enums
CREATE TYPE app_perfil AS ENUM ('colaborador', 'supervisor', 'gerente', 'ceo', 'administrador');
CREATE TYPE user_status AS ENUM ('ativo', 'aguardando_perfil', 'inativo');
CREATE TYPE analysis_status AS ENUM ('Conforme', 'Requer Ajustes');

-- Tables
CREATE TABLE setores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setor_id UUID REFERENCES setores(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE, -- References auth.users
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    foto_url TEXT,
    perfil app_perfil DEFAULT 'colaborador',
    setor_id UUID REFERENCES setores(id),
    categorias_permitidas UUID[] DEFAULT '{}',
    status user_status DEFAULT 'aguardando_perfil',
    setores_gerente UUID[] DEFAULT '{}',
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultimo_acesso TIMESTAMP WITH TIME ZONE
);

CREATE TABLE analises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nome_usuario TEXT,
    setor TEXT,
    perfil TEXT,
    categoria TEXT,
    categoria_id UUID REFERENCES categorias(id),
    setor_id UUID REFERENCES setores(id),
    texto_tarefa TEXT,
    resposta_ia JSONB,
    status analysis_status,
    tipo_analise TEXT DEFAULT 'texto',
    arquivos_urls TEXT[] DEFAULT '{}',
    url_site TEXT
);

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (user_id, nome, email, foto_url, status)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'avatar_url', 'aguardando_perfil');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
-- CREATE TRIGGER on_auth_user_created
-- AFTER INSERT ON auth.users
-- FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS Policies (Example)
ALTER TABLE analises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own analyses" ON analises FOR SELECT USING (auth.uid() IN (SELECT user_id FROM usuarios WHERE id = usuario_id));
CREATE POLICY "Supervisors can see sector analyses" ON analises FOR SELECT USING (EXISTS (SELECT 1 FROM usuarios WHERE user_id = auth.uid() AND (perfil IN ('supervisor', 'gerente', 'ceo', 'administrador'))));
