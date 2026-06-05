DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'denuncia_depoimento'
  ) THEN
    CREATE TABLE public.denuncia_depoimento (
      denuncia_id UUID NOT NULL REFERENCES public.denuncias(id) ON DELETE CASCADE,
      depoimento_id UUID NOT NULL REFERENCES public.depoimentos(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (denuncia_id, depoimento_id)
    );

    ALTER TABLE public.denuncia_depoimento ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Corregedores can read denuncia_depoimento"
      ON public.denuncia_depoimento FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('corregedor', 'admin')
      ));

    CREATE POLICY "Corregedores can insert denuncia_depoimento"
      ON public.denuncia_depoimento FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('corregedor', 'admin')
      ));

    CREATE POLICY "Corregedores can delete denuncia_depoimento"
      ON public.denuncia_depoimento FOR DELETE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('corregedor', 'admin')
      ));
  END IF;
END $$;
