-- ==========================================
-- AFASTAMENTOS MODULE - CORREGEDORIA PMESP
-- ==========================================

-- 1. ENUMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'afastamento_status') THEN
        CREATE TYPE afastamento_status AS ENUM ('ativo', 'encerrado', 'em_investigacao', 'em_inquerito');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'investigacao_policial_status') THEN
        CREATE TYPE investigacao_policial_status AS ENUM ('em_andamento', 'em_analise', 'concluida', 'arquivada');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquerito_policial_status') THEN
        CREATE TYPE inquerito_policial_status AS ENUM ('em_andamento', 'concluido', 'arquivado', 'encaminhado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('corregedor_geral', 'subcorregedor', 'corregedor', 'investigador', 'consulta', 'admin');
    END IF;
END $$;

-- 2. TABLES

-- Afastamentos
CREATE TABLE IF NOT EXISTS public.afastamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_portaria TEXT NOT NULL,
    data_portaria DATE NOT NULL,
    posto_graduacao TEXT NOT NULL,
    nome_completo TEXT NOT NULL,
    rg_pm TEXT NOT NULL,
    unidade TEXT NOT NULL,
    funcao_cargo TEXT,
    motivo_afastamento TEXT NOT NULL,
    prazo_afastamento TEXT NOT NULL,
    responsavel_decisao TEXT NOT NULL,
    observacoes TEXT,
    status afastamento_status DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Investigacoes vinculadas ao policial afastado
CREATE TABLE IF NOT EXISTS public.investigacoes_policial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_investigacao TEXT NOT NULL,
    data_instauracao DATE NOT NULL,
    encarregado TEXT NOT NULL,
    descricao_fatos TEXT NOT NULL,
    provas_anexadas TEXT,
    testemunhas TEXT,
    status investigacao_policial_status DEFAULT 'em_andamento',
    afastamento_id UUID REFERENCES public.afastamentos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inqueritos vinculados ao policial afastado
CREATE TABLE IF NOT EXISTS public.inqueritos_policial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_inquerito TEXT NOT NULL,
    data_instauracao DATE NOT NULL,
    autoridade_responsavel TEXT NOT NULL,
    relatorio TEXT,
    parecer TEXT,
    resultado TEXT,
    status inquerito_policial_status DEFAULT 'em_andamento',
    afastamento_id UUID REFERENCES public.afastamentos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Advertencias vinculadas ao policial
CREATE TABLE IF NOT EXISTS public.advertencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao TEXT NOT NULL,
    data_advertencia DATE NOT NULL,
    autoridade_responsavel TEXT NOT NULL,
    afastamento_id UUID REFERENCES public.afastamentos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS POLICIES
ALTER TABLE public.afastamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigacoes_policial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inqueritos_policial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertencias ENABLE ROW LEVEL SECURITY;

-- Afastamentos policies
DO $$ BEGIN
    CREATE POLICY "Staff can view afastamentos" ON public.afastamentos FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'corregedor'::app_role) OR public.has_role(auth.uid(), 'investigador'::app_role) OR public.has_role(auth.uid(), 'consulta'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can insert afastamentos" ON public.afastamentos FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'corregedor'::app_role) OR public.has_role(auth.uid(), 'investigador'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can update afastamentos" ON public.afastamentos FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'corregedor'::app_role) OR public.has_role(auth.uid(), 'investigador'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Senior staff can delete afastamentos" ON public.afastamentos FOR DELETE
    USING (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Investigacoes policial policies
DO $$ BEGIN
    CREATE POLICY "Staff can view investigacoes_policial" ON public.investigacoes_policial FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'corregedor'::app_role) OR public.has_role(auth.uid(), 'investigador'::app_role) OR public.has_role(auth.uid(), 'consulta'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Investigadores can insert/update investigacoes_policial" ON public.investigacoes_policial FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'corregedor'::app_role) OR public.has_role(auth.uid(), 'investigador'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Investigadores can update investigacoes_policial" ON public.investigacoes_policial FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'corregedor'::app_role) OR public.has_role(auth.uid(), 'investigador'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Senior staff can delete investigacoes_policial" ON public.investigacoes_policial FOR DELETE
    USING (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Inqueritos policial policies
DO $$ BEGIN
    CREATE POLICY "Staff can view inqueritos_policial" ON public.inqueritos_policial FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'corregedor'::app_role) OR public.has_role(auth.uid(), 'investigador'::app_role) OR public.has_role(auth.uid(), 'consulta'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can insert/update inqueritos_policial" ON public.inqueritos_policial FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'corregedor'::app_role) OR public.has_role(auth.uid(), 'investigador'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can update inqueritos_policial" ON public.inqueritos_policial FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'corregedor'::app_role) OR public.has_role(auth.uid(), 'investigador'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Senior staff can delete inqueritos_policial" ON public.inqueritos_policial FOR DELETE
    USING (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Advertencias policies
DO $$ BEGIN
    CREATE POLICY "Staff can view advertencias" ON public.advertencias FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'corregedor'::app_role) OR public.has_role(auth.uid(), 'investigador'::app_role) OR public.has_role(auth.uid(), 'consulta'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can insert advertencias" ON public.advertencias FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'corregedor'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Senior staff can delete advertencias" ON public.advertencias FOR DELETE
    USING (public.has_role(auth.uid(), 'corregedor_geral'::app_role) OR public.has_role(auth.uid(), 'subcorregedor'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. SEQUENCE FOR numero_registro
CREATE SEQUENCE IF NOT EXISTS public.afastamentos_numero_registro_seq;
