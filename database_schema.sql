-- ==========================================
-- IAG DATABASE INITIALIZATION SCRIPT
-- Internal Affairs Group · LAPD
-- ==========================================

-- 1. ENUMS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('admin', 'corregedor', 'pending');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'denuncia_status') THEN
        CREATE TYPE denuncia_status AS ENUM ('pendente', 'em_analise', 'concluida', 'arquivada');
    END IF;
END $$;

-- 2. TABLES

-- Profiles (Oficiais)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    badge_number TEXT,
    patente TEXT DEFAULT 'Oficial',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RBAC (Papéis de Usuário)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Denúncias
CREATE TABLE IF NOT EXISTS public.denuncias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_registro SERIAL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    policial_denunciado TEXT,
    data_ocorrido TEXT,
    contato_opcional TEXT,
    status denuncia_status DEFAULT 'pendente',
    notas_internas TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    dados_detalhados JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Investigações
CREATE TABLE IF NOT EXISTS public.investigacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_registro SERIAL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    investigado TEXT,
    status denuncia_status DEFAULT 'pendente',
    notas_internas TEXT,
    tipo_procedimento TEXT DEFAULT 'Investigação Administrativa',
    autoridade_responsavel TEXT,
    autoridade_patente TEXT,
    autoridade_departamento TEXT DEFAULT 'Internal Affairs Group (IAG)',
    investigado_badge TEXT,
    investigado_patente TEXT,
    investigado_unidade TEXT,
    origem_caso TEXT DEFAULT 'Denúncia de civil',
    origem_outro TEXT,
    fundamentacao TEXT,
    medidas_iniciais JSONB DEFAULT '[]'::jsonb,
    medidas_outro TEXT,
    detalhes_adicionais TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Relatórios e Documentos Oficiais (Inquéritos / Atos)
CREATE TABLE IF NOT EXISTS public.relatorios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    tipo_denuncia TEXT NOT NULL,
    oficial TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    status denuncia_status DEFAULT 'pendente',
    dados_detalhados JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Link Tables (Relacionamentos)
CREATE TABLE IF NOT EXISTS public.denuncia_relatorio (
    denuncia_id UUID REFERENCES public.denuncias(id) ON DELETE CASCADE,
    relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE,
    PRIMARY KEY (denuncia_id, relatorio_id)
);

CREATE TABLE IF NOT EXISTS public.investigacao_relatorio (
    investigacao_id UUID REFERENCES public.investigacoes(id) ON DELETE CASCADE,
    relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE,
    PRIMARY KEY (investigacao_id, relatorio_id)
);

CREATE TABLE IF NOT EXISTS public.denuncia_investigacao (
    denuncia_id UUID REFERENCES public.denuncias(id) ON DELETE CASCADE,
    investigacao_id UUID REFERENCES public.investigacoes(id) ON DELETE CASCADE,
    PRIMARY KEY (denuncia_id, investigacao_id)
);

-- 3. SECURITY FUNCTIONS

-- Function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS POLICIES

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;

-- Denuncias Policies
DO $$ BEGIN
    CREATE POLICY "Public can insert reports" ON public.denuncias FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can view reports" ON public.denuncias FOR SELECT 
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profiles Policies
DO $$ BEGIN
    CREATE POLICY "Self view" ON public.profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff view all profiles" ON public.profiles FOR SELECT 
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- User Roles Policies
DO $$ BEGIN
    CREATE POLICY "Users can insert their own pending role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can view all roles" ON public.user_roles FOR SELECT 
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
