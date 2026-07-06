-- Add registrador fields to depoimentos table
ALTER TABLE public.depoimentos ADD COLUMN IF NOT EXISTS registrador_nome TEXT;
ALTER TABLE public.depoimentos ADD COLUMN IF NOT EXISTS registrador_patente TEXT;
