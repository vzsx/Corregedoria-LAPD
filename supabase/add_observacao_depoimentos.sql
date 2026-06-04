-- Adicionar coluna observacao na tabela depoimentos
ALTER TABLE public.depoimentos ADD COLUMN IF NOT EXISTS observacao TEXT;

NOTIFY pgrst, 'reload schema';
