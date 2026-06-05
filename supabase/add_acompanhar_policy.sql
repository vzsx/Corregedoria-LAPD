-- Permite que usuários anônimos (não logados) consultem denúncias e documentos vinculados
-- Necessário para a página pública de acompanhamento (/acompanhar)
-- A página só exibe dados não-sensíveis: status, título, policial, andamento

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view denuncias for tracking' AND tablename = 'denuncias') THEN
    CREATE POLICY "Anyone can view denuncias for tracking"
      ON public.denuncias FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view relatorios for tracking' AND tablename = 'relatorios') THEN
    CREATE POLICY "Anyone can view relatorios for tracking"
      ON public.relatorios FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view denuncia_relatorio for tracking' AND tablename = 'denuncia_relatorio') THEN
    CREATE POLICY "Anyone can view denuncia_relatorio for tracking"
      ON public.denuncia_relatorio FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view denuncia_investigacao for tracking' AND tablename = 'denuncia_investigacao') THEN
    CREATE POLICY "Anyone can view denuncia_investigacao for tracking"
      ON public.denuncia_investigacao FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view investigacoes for tracking' AND tablename = 'investigacoes') THEN
    CREATE POLICY "Anyone can view investigacoes for tracking"
      ON public.investigacoes FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view denuncia_depoimento for tracking' AND tablename = 'denuncia_depoimento') THEN
    CREATE POLICY "Anyone can view denuncia_depoimento for tracking"
      ON public.denuncia_depoimento FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view depoimentos for tracking' AND tablename = 'depoimentos') THEN
    CREATE POLICY "Anyone can view depoimentos for tracking"
      ON public.depoimentos FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
