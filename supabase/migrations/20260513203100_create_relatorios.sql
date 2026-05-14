-- Relatórios da Corregedoria
CREATE TABLE public.relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo_denuncia TEXT DEFAULT 'Null',
  oficial TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;

-- updated_at trigger para relatorios
CREATE TRIGGER relatorios_set_updated_at
BEFORE UPDATE ON public.relatorios
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS POLICIES
CREATE POLICY "Corregedores view relatorios"
  ON public.relatorios FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Corregedores insert relatorios"
  ON public.relatorios FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Corregedores update relatorios"
  ON public.relatorios FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
