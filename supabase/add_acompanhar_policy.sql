-- Permite que usuários anônimos (não logados) consultem denúncias
-- Necessário para a página pública de acompanhamento (/acompanhar)
-- A página só exibe dados não-sensíveis: status, título, policial, andamento

CREATE POLICY "Anyone can view denuncias for tracking"
  ON public.denuncias FOR SELECT
  TO anon
  USING (true);
