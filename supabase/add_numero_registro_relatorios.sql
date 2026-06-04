-- Adicionar coluna numero_registro (SERIAL) na tabela relatorios
ALTER TABLE public.relatorios ADD COLUMN IF NOT EXISTS numero_registro SERIAL;

NOTIFY pgrst, 'reload schema';
