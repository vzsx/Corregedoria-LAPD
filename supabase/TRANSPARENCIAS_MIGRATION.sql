-- ==========================================
-- MIGRATION: TRANSPARENCIAS TABLE
-- Execute no Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.transparencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_informe TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('arquivamento', 'solucionada')),
  data_emissao TEXT NOT NULL,
  numero_referencia TEXT,
  responsavel_nome TEXT NOT NULL,
  responsavel_posto TEXT NOT NULL,
  responsavel_assinatura TEXT,
  considerandos TEXT NOT NULL,
  artigo_1 TEXT NOT NULL,
  artigo_2 TEXT NOT NULL,
  artigo_3 TEXT NOT NULL,
  artigo_4 TEXT NOT NULL,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'concluido',
  autor_id UUID,
  autor_nome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transparencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.transparencias
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for service role" ON public.transparencias
  FOR ALL USING (auth.role() = 'service_role');
