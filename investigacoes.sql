-- 1. Tabela de Investigações
CREATE TABLE IF NOT EXISTS public.investigacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_registro SERIAL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  investigado TEXT,
  status public.denuncia_status NOT NULL DEFAULT 'pendente',
  notas_internas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.investigacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para Investigacoes
CREATE POLICY "Corregedores view investigacoes"
  ON public.investigacoes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Corregedores insert investigacoes"
  ON public.investigacoes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Corregedores update investigacoes"
  ON public.investigacoes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

-- 2. Tabela de vínculo entre Investigação e Relatórios
CREATE TABLE IF NOT EXISTS public.investigacao_relatorio (
  investigacao_id UUID NOT NULL REFERENCES public.investigacoes(id) ON DELETE CASCADE,
  relatorio_id UUID NOT NULL REFERENCES public.relatorios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (investigacao_id, relatorio_id)
);

ALTER TABLE public.investigacao_relatorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Corregedores manage investigacao_relatorio"
  ON public.investigacao_relatorio FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

-- 3. Adicionar coluna de aprovação nos relatórios
ALTER TABLE public.relatorios ADD COLUMN IF NOT EXISTS aprovado BOOLEAN DEFAULT false;

-- 4. Permitir exclusão de relatórios para Admins
CREATE POLICY "Admins delete relatorios"
  ON public.relatorios FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Trigger para updated_at nas investigacoes
DO $$ BEGIN
    CREATE TRIGGER investigacoes_set_updated_at BEFORE UPDATE ON public.investigacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recarregar esquema
NOTIFY pgrst, 'reload schema';
