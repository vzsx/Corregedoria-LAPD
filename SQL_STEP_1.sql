-- BLOCO 1: ENUMS + FUNCOES
-- Cole e rode este bloco primeiro

DO $$
BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'corregedor', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE public.denuncia_status AS ENUM ('pendente', 'em_analise', 'concluida', 'arquivada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE public.afastamento_status AS ENUM ('ativo', 'concluido', 'arquivado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE public.investigacao_policial_status AS ENUM ('em_andamento', 'em_analise', 'concluida', 'arquivada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE public.inquerito_policial_status AS ENUM ('em_andamento', 'concluido', 'arquivado', 'encaminhado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE public.ipm_status AS ENUM ('em_andamento', 'concluido', 'arquivado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
