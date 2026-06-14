-- ==========================================
-- IPM VÍNCULOS - Junction table for IPM links
-- CORREGEDORIA PMESP
-- ==========================================

CREATE TABLE IF NOT EXISTS public.ipm_vinculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ipm_id UUID NOT NULL REFERENCES public.ipm(id) ON DELETE CASCADE,
    entidade_id UUID NOT NULL,
    entidade_tipo TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(ipm_id, entidade_id, entidade_tipo)
);

ALTER TABLE public.ipm_vinculos ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ipm_vinculos' AND policyname = 'Corregedor pode gerenciar vinculos'
    ) THEN
        CREATE POLICY "Corregedor pode gerenciar vinculos" ON public.ipm_vinculos
            FOR ALL USING (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('corregedor', 'admin'))
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ipm_vinculos' AND policyname = 'Corregedor pode ler vinculos'
    ) THEN
        CREATE POLICY "Corregedor pode ler vinculos" ON public.ipm_vinculos
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('corregedor', 'admin'))
            );
    END IF;
END $$;
