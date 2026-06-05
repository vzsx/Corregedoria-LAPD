-- Permite que usuários anônimos (não logados) consultem denúncias e documentos vinculados
-- Necessário para a página pública de acompanhamento (/acompanhar)
-- A página só exibe dados não-sensíveis: status, título, policial, andamento

CREATE POLICY "Anyone can view denuncias for tracking"
  ON public.denuncias FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can view relatorios for tracking"
  ON public.relatorios FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can view denuncia_relatorio for tracking"
  ON public.denuncia_relatorio FOR SELECT
  TO anon
  USING (true);
