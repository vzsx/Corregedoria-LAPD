-- Create depoimentos table
CREATE TABLE IF NOT EXISTS public.depoimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_registro SERIAL,
    oficial_nome TEXT NOT NULL,
    oficial_patente TEXT,
    oficial_re TEXT,
    depoimento TEXT NOT NULL,
    data_depoimento DATE DEFAULT CURRENT_DATE,
    oficial_batalhao TEXT,
    registrador_nome TEXT,
    registrador_patente TEXT,
    relatorio_id_ip UUID REFERENCES public.relatorios(id) ON DELETE SET NULL,
    relatorio_id_ato UUID REFERENCES public.relatorios(id) ON DELETE SET NULL,
    investigacao_id UUID REFERENCES public.investigacoes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Corregedores can read depoimentos"
    ON public.depoimentos FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('corregedor', 'admin')
    ));

CREATE POLICY "Corregedores can insert depoimentos"
    ON public.depoimentos FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('corregedor', 'admin')
    ));

CREATE POLICY "Corregedores can update depoimentos"
    ON public.depoimentos FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('corregedor', 'admin')
    ));

CREATE POLICY "Corregedores can delete depoimentos"
    ON public.depoimentos FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('corregedor', 'admin')
    ));
