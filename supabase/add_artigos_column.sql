-- Add artigos column to afastamentos table
ALTER TABLE public.afastamentos ADD COLUMN IF NOT EXISTS artigos TEXT;
