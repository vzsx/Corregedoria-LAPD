-- BLOCO 5: TABELAS DE VINCULO DO AFASTAMENTO
-- Rode depois do Bloco 4

CREATE TABLE IF NOT EXISTS public.afastamento_denuncia (
  afastamento_id UUID NOT NULL REFERENCES public.afastamentos(id) ON DELETE CASCADE,
  denuncia_id UUID NOT NULL REFERENCES public.denuncias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (afastamento_id, denuncia_id)
);

CREATE TABLE IF NOT EXISTS public.afastamento_investigacao (
  afastamento_id UUID NOT NULL REFERENCES public.afastamentos(id) ON DELETE CASCADE,
  investigacao_id UUID NOT NULL REFERENCES public.investigacoes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (afastamento_id, investigacao_id)
);

CREATE TABLE IF NOT EXISTS public.afastamento_relatorio (
  afastamento_id UUID NOT NULL REFERENCES public.afastamentos(id) ON DELETE CASCADE,
  relatorio_id UUID NOT NULL REFERENCES public.relatorios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (afastamento_id, relatorio_id)
);

CREATE TABLE IF NOT EXISTS public.afastamento_depoimento (
  afastamento_id UUID NOT NULL REFERENCES public.afastamentos(id) ON DELETE CASCADE,
  depoimento_id UUID NOT NULL REFERENCES public.depoimentos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (afastamento_id, depoimento_id)
);

ALTER TABLE public.afastamento_denuncia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afastamento_investigacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afastamento_relatorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afastamento_depoimento ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE POLICY "Staff can manage afastamento_denuncia" ON public.afastamento_denuncia FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can manage afastamento_investigacao" ON public.afastamento_investigacao FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can manage afastamento_relatorio" ON public.afastamento_relatorio FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can manage afastamento_depoimento" ON public.afastamento_depoimento FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
