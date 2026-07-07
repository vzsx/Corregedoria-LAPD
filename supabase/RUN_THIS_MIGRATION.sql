-- ==========================================
-- MIGRATION: PERIODO + DATA TERMINO NULLABLE + RELATO FATOS
-- Execute no Supabase SQL Editor
-- ==========================================

-- Add periodo column (determinado or indeterminado)
ALTER TABLE public.afastamentos
ADD COLUMN IF NOT EXISTS periodo TEXT NOT NULL DEFAULT 'determinado';

-- Make data_termino nullable (not needed for indeterminado period)
ALTER TABLE public.afastamentos
ALTER COLUMN data_termino DROP NOT NULL;

-- Add relato_fatos column for disciplinar documents
ALTER TABLE public.afastamentos
ADD COLUMN IF NOT EXISTS relato_fatos TEXT;
