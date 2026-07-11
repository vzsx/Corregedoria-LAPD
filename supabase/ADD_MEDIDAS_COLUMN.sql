-- ==========================================
-- MIGRATION: ADD MEDIDAS COLUMN TO TRANSPARENCIAS
-- Execute no Supabase SQL Editor
-- ==========================================

ALTER TABLE public.transparencias
ADD COLUMN IF NOT EXISTS medidas JSONB;
