-- ==========================================
-- AFASTAMENTOS MODULE - CORREGEDORIA PMESP
-- ==========================================

-- 1. ENUMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'afastamento_status') THEN
        CREATE TYPE afastamento_status AS ENUM ('ativo', 'concluido', 'arquivado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'investigacao_policial_status') THEN
        CREATE TYPE investigacao_policial_status AS ENUM ('em_andamento', 'em_analise', 'concluida', 'arquivada');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquerito_policial_status') THEN
        CREATE TYPE inquerito_policial_status AS ENUM ('em_andamento', 'concluido', 'arquivado', 'encaminhado');
    END IF;
END $$;

-- 2. TABLES

CREATE TABLE IF NOT EXISTS public.afastamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_portaria TEXT NOT NULL,
    data_emissao DATE NOT NULL,
    posto_graduacao TEXT NOT NULL,
    nome_completo TEXT NOT NULL,
    rg_pm TEXT NOT NULL,
    unidade TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    observacoes TEXT,
    inquerito_id UUID REFERENCES public.inqueritos_policial(id) ON DELETE SET NULL,
    responsavel_nome TEXT NOT NULL,
    responsavel_posto TEXT NOT NULL DEFAULT '',
    responsavel_assinatura TEXT,
    motivo_afastamento TEXT NOT NULL DEFAULT 'Art. 4º O afastamento de que trata esta Portaria possui caráter meramente cautelar e não punitivo, podendo ser revisto ou revogado a qualquer tempo, conforme o andamento do procedimento apuratório.',
    status afastamento_status DEFAULT 'ativo',
    autor_id UUID,
    autor_nome TEXT,
    historico_versoes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.advertencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao TEXT NOT NULL,
    data_advertencia DATE NOT NULL,
    autoridade_responsavel TEXT NOT NULL,
    afastamento_id UUID REFERENCES public.afastamentos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS
ALTER TABLE public.afastamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigacoes_policial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inqueritos_policial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertencias ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Staff can view afastamentos" ON public.afastamentos FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can insert afastamentos" ON public.afastamentos FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can update afastamentos" ON public.afastamentos FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can delete afastamentos" ON public.afastamentos FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can view investigacoes_policial" ON public.investigacoes_policial FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can insert investigacoes_policial" ON public.investigacoes_policial FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can update investigacoes_policial" ON public.investigacoes_policial FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can delete investigacoes_policial" ON public.investigacoes_policial FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can view inqueritos_policial" ON public.inqueritos_policial FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can insert inqueritos_policial" ON public.inqueritos_policial FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can update inqueritos_policial" ON public.inqueritos_policial FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can delete inqueritos_policial" ON public.inqueritos_policial FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can view advertencias" ON public.advertencias FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can insert advertencias" ON public.advertencias FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can delete advertencias" ON public.advertencias FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. SEQUENCE
CREATE SEQUENCE IF NOT EXISTS public.afastamentos_numero_registro_seq;
