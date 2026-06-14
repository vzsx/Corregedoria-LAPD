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
CREATE POLICY "Corregedor pode gerenciar vinculos" ON public.ipm_vinculos
    FOR ALL USING (
        public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Corregedor pode ler vinculos" ON public.ipm_vinculos
    FOR SELECT USING (
        public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin')
    );
