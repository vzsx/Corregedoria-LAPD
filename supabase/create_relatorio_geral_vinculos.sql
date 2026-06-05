-- Create relatorio_geral_vinculos table for universal document linking
-- Permite que um Relatório Geral vincule qualquer tipo de documento

CREATE TABLE IF NOT EXISTS public.relatorio_geral_vinculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relatorio_id UUID NOT NULL REFERENCES public.relatorios(id) ON DELETE CASCADE,
    entidade_id UUID NOT NULL,
    entidade_tipo TEXT NOT NULL CHECK (entidade_tipo IN ('denuncia', 'investigacao', 'depoimento', 'inquerito', 'ato')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(relatorio_id, entidade_id, entidade_tipo)
);

-- Enable RLS
ALTER TABLE public.relatorio_geral_vinculos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Corregedores can read relatorio_geral_vinculos"
    ON public.relatorio_geral_vinculos FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('corregedor', 'admin')
    ));

CREATE POLICY "Corregedores can insert relatorio_geral_vinculos"
    ON public.relatorio_geral_vinculos FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('corregedor', 'admin')
    ));

CREATE POLICY "Corregedores can delete relatorio_geral_vinculos"
    ON public.relatorio_geral_vinculos FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('corregedor', 'admin')
    ));

NOTIFY pgrst, 'reload schema';
