-- Add tipo_afastamento column to afastamentos table
ALTER TABLE public.afastamentos ADD COLUMN IF NOT EXISTS tipo_afastamento TEXT NOT NULL DEFAULT 'cautelar';
