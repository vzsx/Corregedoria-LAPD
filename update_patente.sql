-- Adiciona a coluna patente aos perfis existentes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS patente TEXT DEFAULT 'Oficial';

-- Permite que os administradores editem os perfis (para poderem salvar a patente)
DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Recarrega o esquema da API
NOTIFY pgrst, 'reload schema';
