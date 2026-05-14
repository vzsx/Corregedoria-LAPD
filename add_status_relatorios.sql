-- Adicionar coluna de status na tabela de relatórios
ALTER TABLE public.relatorios ADD COLUMN IF NOT EXISTS status public.denuncia_status NOT NULL DEFAULT 'pendente';

-- Recarregar esquema
NOTIFY pgrst, 'reload schema';
