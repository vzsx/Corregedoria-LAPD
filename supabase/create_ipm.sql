-- ==========================================
-- IPM MODULE - INQUÉRITO POLICIAL MILITAR
-- CORREGEDORIA PMESP
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ipm_status') THEN
        CREATE TYPE ipm_status AS ENUM ('em_andamento', 'concluido', 'arquivado');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ipm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_ipm TEXT NOT NULL,
    data_instauracao DATE NOT NULL,
    unidade TEXT NOT NULL DEFAULT '',
    status ipm_status DEFAULT 'em_andamento',
    encarregado_nome TEXT NOT NULL DEFAULT '',
    encarregado_posto TEXT NOT NULL DEFAULT '',
    autoridade_nome TEXT NOT NULL DEFAULT '',
    autoridade_posto TEXT NOT NULL DEFAULT '',
    fundamentacao TEXT NOT NULL DEFAULT '',
    artigos_cpm TEXT NOT NULL DEFAULT '',
    artigos_rdpm TEXT NOT NULL DEFAULT '',
    relatorio_fatos TEXT NOT NULL DEFAULT '',
    conclusao_parcial TEXT NOT NULL DEFAULT '',
    indiciados JSONB DEFAULT '[]'::jsonb,
    enquadramentos JSONB DEFAULT '[]'::jsonb,
    vinculacoes JSONB DEFAULT '[]'::jsonb,
    historico_versoes JSONB DEFAULT '[]'::jsonb,
    autor_id UUID,
    autor_nome TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ipm ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Staff can view ipm" ON public.ipm FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can insert ipm" ON public.ipm FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can update ipm" ON public.ipm FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can delete ipm" ON public.ipm FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
