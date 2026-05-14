-- Adicionar coluna de dados detalhados para denúncias
ALTER TABLE public.denuncias 
ADD COLUMN IF NOT EXISTS dados_detalhados JSONB DEFAULT '{}'::jsonb;

-- Notificar recarregamento do schema
NOTIFY pgrst, 'reload schema';
