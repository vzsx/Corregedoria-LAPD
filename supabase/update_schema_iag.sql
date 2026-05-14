-- ==========================================
-- IAG DASHBOARD - DATABASE SYNC SCRIPT
-- ==========================================
-- Execute este script no SQL Editor do Supabase para sincronizar 
-- o banco de dados com as novas funcionalidades do frontend.

-- 1. Atualizar a tabela public.relatorios com novas colunas
ALTER TABLE public.relatorios 
ADD COLUMN IF NOT EXISTS status public.denuncia_status NOT NULL DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS dados_detalhados JSONB,
ADD COLUMN IF NOT EXISTS aprovado BOOLEAN DEFAULT false;

-- 2. Atualizar a tabela public.investigacoes com campos detalhados
ALTER TABLE public.investigacoes
ADD COLUMN IF NOT EXISTS tipo_procedimento TEXT DEFAULT 'Investigação Administrativa',
ADD COLUMN IF NOT EXISTS autoridade_responsavel TEXT,
ADD COLUMN IF NOT EXISTS autoridade_patente TEXT,
ADD COLUMN IF NOT EXISTS autoridade_departamento TEXT DEFAULT 'Internal Affairs Group (IAG)',
ADD COLUMN IF NOT EXISTS investigado_badge TEXT,
ADD COLUMN IF NOT EXISTS investigado_patente TEXT,
ADD COLUMN IF NOT EXISTS investigado_unidade TEXT,
ADD COLUMN IF NOT EXISTS origem_caso TEXT DEFAULT 'Denúncia de civil',
ADD COLUMN IF NOT EXISTS origem_outro TEXT,
ADD COLUMN IF NOT EXISTS fundamentacao TEXT,
ADD COLUMN IF NOT EXISTS medidas_iniciais TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS medidas_outro TEXT,
ADD COLUMN IF NOT EXISTS detalhes_adicionais TEXT;

-- 3. Criar a tabela de vínculo entre Investigação e Relatórios se não existir
CREATE TABLE IF NOT EXISTS public.investigacao_relatorio (
  investigacao_id UUID NOT NULL REFERENCES public.investigacoes(id) ON DELETE CASCADE,
  relatorio_id UUID NOT NULL REFERENCES public.relatorios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (investigacao_id, relatorio_id)
);

-- 4. Habilitar RLS e criar políticas para a tabela de vínculo
ALTER TABLE public.investigacao_relatorio ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'Corregedores manage investigacao_relatorio'
    ) THEN
        CREATE POLICY "Corregedores manage investigacao_relatorio"
          ON public.investigacao_relatorio FOR ALL
          TO authenticated
          USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- 5. Recarregar o esquema para garantir que as mudanças sejam refletidas na API
NOTIFY pgrst, 'reload schema';

-- ==========================================
-- FIM DO SCRIPT
-- ==========================================
