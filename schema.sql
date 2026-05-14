-- Execute isso no Supabase SQL Editor para garantir que TODAS as tabelas existam

-- 1. Roles enum
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'corregedor', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Status das denúncias
DO $$ BEGIN
    CREATE TYPE public.denuncia_status AS ENUM ('pendente', 'em_analise', 'concluida', 'arquivada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  badge_number TEXT,
  patente TEXT DEFAULT 'Oficial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Permissão para admins editarem os perfis (ex: mudar patente)
CREATE POLICY "Admins update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. User roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Denuncias (Ocorrências)
CREATE TABLE IF NOT EXISTS public.denuncias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_registro SERIAL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  policial_denunciado TEXT,
  data_ocorrido TEXT,
  contato_opcional TEXT,
  status denuncia_status NOT NULL DEFAULT 'pendente',
  notas_internas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

-- 7. Relatórios da Corregedoria
CREATE TABLE IF NOT EXISTS public.relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo_denuncia TEXT DEFAULT 'Null',
  oficial TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;

-- 8. Vínculo entre Denuncias e Relatorios (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.denuncia_relatorio (
  denuncia_id UUID NOT NULL REFERENCES public.denuncias(id) ON DELETE CASCADE,
  relatorio_id UUID NOT NULL REFERENCES public.relatorios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (denuncia_id, relatorio_id)
);

ALTER TABLE public.denuncia_relatorio ENABLE ROW LEVEL SECURITY;

-- 9. Funções de Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, badge_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Sem nome'),
    NEW.raw_user_meta_data->>'badge_number'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'pending');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Ignora erro caso os triggers já existam
DO $$ BEGIN
    CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER denuncias_set_updated_at BEFORE UPDATE ON public.denuncias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER relatorios_set_updated_at BEFORE UPDATE ON public.relatorios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 10. Políticas de Segurança (RLS) - Atualização
-- Para denuncia_relatorio
CREATE POLICY "Corregedores view denuncia_relatorio"
  ON public.denuncia_relatorio FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Corregedores insert denuncia_relatorio"
  ON public.denuncia_relatorio FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Corregedores delete denuncia_relatorio"
  ON public.denuncia_relatorio FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));

-- Força recarregar o cache da API do Supabase (com a sintaxe correta e aspas)
NOTIFY pgrst, 'reload schema';
