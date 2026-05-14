-- Corrige o problema do "Acesso Pendente" e permissões invisíveis

-- 1. Permissões de Perfis (Qualquer pessoa logada pode ver nomes e distintivos)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  TO authenticated 
  USING (true);

-- 2. Permissões de Cargos (Permite que o usuário veja seu próprio cargo e que o admin modifique)
DROP POLICY IF EXISTS "Users view their own role" ON public.user_roles;
CREATE POLICY "Users view their own role" 
  ON public.user_roles FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update roles" ON public.user_roles;
CREATE POLICY "Admins update roles" 
  ON public.user_roles FOR UPDATE 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Permissões de Denúncias
DROP POLICY IF EXISTS "Corregedores view denuncias" ON public.denuncias;
CREATE POLICY "Corregedores view denuncias" 
  ON public.denuncias FOR SELECT 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Corregedores insert denuncias" ON public.denuncias;
CREATE POLICY "Corregedores insert denuncias" 
  ON public.denuncias FOR INSERT 
  TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Corregedores update denuncias" ON public.denuncias;
CREATE POLICY "Corregedores update denuncias" 
  ON public.denuncias FOR UPDATE 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

-- 4. Permissões de Relatórios
DROP POLICY IF EXISTS "Corregedores view relatorios" ON public.relatorios;
CREATE POLICY "Corregedores view relatorios" 
  ON public.relatorios FOR SELECT 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Corregedores insert relatorios" ON public.relatorios;
CREATE POLICY "Corregedores insert relatorios" 
  ON public.relatorios FOR INSERT 
  TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Corregedores update relatorios" ON public.relatorios;
CREATE POLICY "Corregedores update relatorios" 
  ON public.relatorios FOR UPDATE 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

-- Atualiza cache
NOTIFY pgrst, 'reload schema';
