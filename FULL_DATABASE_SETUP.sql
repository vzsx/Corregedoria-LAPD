-- ==========================================
-- CORREGEDORIA PMESP - SCHEMA COMPLETO
-- Copie e cole no Supabase SQL Editor
-- ==========================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'corregedor', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.denuncia_status AS ENUM ('pendente', 'em_analise', 'concluida', 'arquivada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.afastamento_status AS ENUM ('ativo', 'concluido', 'arquivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.investigacao_policial_status AS ENUM ('em_andamento', 'em_analise', 'concluida', 'arquivada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.inquerito_policial_status AS ENUM ('em_andamento', 'concluido', 'arquivado', 'encaminhado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.ipm_status AS ENUM ('em_andamento', 'concluido', 'arquivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. FUNCTION: has_role
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

-- 3. FUNCTION: handle_new_user (trigger)
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

-- 4. FUNCTION: set_updated_at (trigger)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ==========================================
-- TABELAS
-- ==========================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  badge_number TEXT,
  patente TEXT DEFAULT 'Oficial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- DENUNCIAS
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
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dados_detalhados JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INVESTIGACOES
CREATE TABLE IF NOT EXISTS public.investigacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_registro SERIAL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  investigado TEXT,
  status denuncia_status DEFAULT 'pendente',
  notas_internas TEXT,
  tipo_procedimento TEXT DEFAULT 'Investigação Administrativa',
  autoridade_responsavel TEXT,
  autoridade_patente TEXT,
  autoridade_departamento TEXT DEFAULT 'Corregedoria Geral (PMESP)',
  investigado_badge TEXT,
  investigado_patente TEXT,
  investigado_unidade TEXT,
  origem_caso TEXT DEFAULT 'Denúncia de civil',
  origem_outro TEXT,
  fundamentacao TEXT,
  medidas_iniciais JSONB DEFAULT '[]'::jsonb,
  medidas_outro TEXT,
  detalhes_adicionais TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RELATORIOS
CREATE TABLE IF NOT EXISTS public.relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_registro SERIAL,
  titulo TEXT NOT NULL,
  tipo_denuncia TEXT NOT NULL,
  oficial TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  status denuncia_status DEFAULT 'pendente',
  dados_detalhados JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DEPOIMENTOS
CREATE TABLE IF NOT EXISTS public.depoimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_registro SERIAL,
  oficial_nome TEXT NOT NULL,
  oficial_patente TEXT,
  oficial_re TEXT,
  depoimento TEXT NOT NULL,
  data_depoimento DATE DEFAULT CURRENT_DATE,
  oficial_batalhao TEXT,
  relatorio_id_ip UUID REFERENCES public.relatorios(id) ON DELETE SET NULL,
  relatorio_id_ato UUID REFERENCES public.relatorios(id) ON DELETE SET NULL,
  investigacao_id UUID REFERENCES public.investigacoes(id) ON DELETE SET NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LINK TABLES
CREATE TABLE IF NOT EXISTS public.denuncia_relatorio (
  denuncia_id UUID NOT NULL REFERENCES public.denuncias(id) ON DELETE CASCADE,
  relatorio_id UUID NOT NULL REFERENCES public.relatorios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (denuncia_id, relatorio_id)
);

CREATE TABLE IF NOT EXISTS public.investigacao_relatorio (
  investigacao_id UUID NOT NULL REFERENCES public.investigacoes(id) ON DELETE CASCADE,
  relatorio_id UUID NOT NULL REFERENCES public.relatorios(id) ON DELETE CASCADE,
  PRIMARY KEY (investigacao_id, relatorio_id)
);

CREATE TABLE IF NOT EXISTS public.denuncia_investigacao (
  denuncia_id UUID NOT NULL REFERENCES public.denuncias(id) ON DELETE CASCADE,
  investigacao_id UUID NOT NULL REFERENCES public.investigacoes(id) ON DELETE CASCADE,
  PRIMARY KEY (denuncia_id, investigacao_id)
);

CREATE TABLE IF NOT EXISTS public.denuncia_depoimento (
  denuncia_id UUID NOT NULL REFERENCES public.denuncias(id) ON DELETE CASCADE,
  depoimento_id UUID NOT NULL REFERENCES public.depoimentos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (denuncia_id, depoimento_id)
);

CREATE TABLE IF NOT EXISTS public.relatorio_geral_vinculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id UUID NOT NULL REFERENCES public.relatorios(id) ON DELETE CASCADE,
  entidade_id UUID NOT NULL,
  entidade_tipo TEXT NOT NULL CHECK (entidade_tipo IN ('denuncia', 'investigacao', 'depoimento', 'inquerito', 'ato')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(relatorio_id, entidade_id, entidade_tipo)
);

-- IPM
CREATE TABLE IF NOT EXISTS public.ipm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ipm TEXT NOT NULL,
  data_instauracao DATE NOT NULL,
  unidade TEXT NOT NULL DEFAULT '',
  status ipm_status DEFAULT 'em_andamento',
  encarregado_nome TEXT NOT NULL DEFAULT '',
  encarregado_posto TEXT NOT NULL DEFAULT '',
  autoridade_nome TEXT NOT NULL DEFAULT '',
  autoridade_posto TEXT NOT NULL DEFAULT '',
  fundamentacao TEXT NOT NULL DEFAULT '',
  artigos_cpm TEXT NOT NULL DEFAULT '',
  artigos_rdpm TEXT NOT NULL DEFAULT '',
  relatorio_fatos TEXT NOT NULL DEFAULT '',
  conclusao_parcial TEXT NOT NULL DEFAULT '',
  indiciados JSONB DEFAULT '[]'::jsonb,
  enquadramentos JSONB DEFAULT '[]'::jsonb,
  vinculacoes JSONB DEFAULT '[]'::jsonb,
  historico_versoes JSONB DEFAULT '[]'::jsonb,
  autor_id UUID,
  autor_nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ipm_vinculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ipm_id UUID NOT NULL REFERENCES public.ipm(id) ON DELETE CASCADE,
  entidade_id UUID NOT NULL,
  entidade_tipo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ipm_id, entidade_id, entidade_tipo)
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AFASTAMENTOS
CREATE TABLE IF NOT EXISTS public.afastamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_portaria TEXT NOT NULL,
  data_emissao DATE NOT NULL,
  posto_graduacao TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  rg_pm TEXT NOT NULL,
  unidade TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_termino DATE NOT NULL,
  observacoes TEXT,
  inquerito_id UUID,
  responsavel_nome TEXT NOT NULL,
  responsavel_posto TEXT NOT NULL DEFAULT '',
  responsavel_assinatura TEXT,
  motivo_afastamento TEXT NOT NULL DEFAULT 'Art. 4º O afastamento de que trata esta Portaria possui caráter meramente cautelar e não punitivo, podendo ser revisto ou revogado a qualquer tempo, conforme o andamento do procedimento apuratório.',
  status afastamento_status DEFAULT 'ativo',
  autor_id UUID,
  autor_nome TEXT,
  historico_versoes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INVESTIGACOES POLICIAL
CREATE TABLE IF NOT EXISTS public.investigacoes_policial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_investigacao TEXT NOT NULL,
  data_instauracao DATE NOT NULL,
  encarregado TEXT NOT NULL,
  descricao_fatos TEXT NOT NULL,
  provas_anexadas TEXT,
  testemunhas TEXT,
  status investigacao_policial_status DEFAULT 'em_andamento',
  afastamento_id UUID REFERENCES public.afastamentos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INQUERITOS POLICIAL
CREATE TABLE IF NOT EXISTS public.inqueritos_policial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_inquerito TEXT NOT NULL,
  data_instauracao DATE NOT NULL,
  autoridade_responsavel TEXT NOT NULL,
  relatorio TEXT,
  parecer TEXT,
  resultado TEXT,
  status inquerito_policial_status DEFAULT 'em_andamento',
  afastamento_id UUID REFERENCES public.afastamentos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ADVERTENCIAS
CREATE TABLE IF NOT EXISTS public.advertencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  data_advertencia DATE NOT NULL,
  autoridade_responsavel TEXT NOT NULL,
  afastamento_id UUID REFERENCES public.afastamentos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- TRIGGERS
-- ==========================================

DO $$ BEGIN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER denuncias_set_updated_at
    BEFORE UPDATE ON public.denuncias
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER relatorios_set_updated_at
    BEFORE UPDATE ON public.relatorios
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER depoimentos_set_updated_at
    BEFORE UPDATE ON public.depoimentos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER ipm_set_updated_at
    BEFORE UPDATE ON public.ipm
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER afastamentos_set_updated_at
    BEFORE UPDATE ON public.afastamentos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER investigacoes_policial_set_updated_at
    BEFORE UPDATE ON public.investigacoes_policial
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER inqueritos_policial_set_updated_at
    BEFORE UPDATE ON public.inqueritos_policial
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ==========================================
-- RLS (Row Level Security)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denuncia_relatorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigacao_relatorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denuncia_investigacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denuncia_depoimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_geral_vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipm_vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afastamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigacoes_policial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inqueritos_policial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertencias ENABLE ROW LEVEL SECURITY;

-- PROFILES
DO $$ BEGIN
    CREATE POLICY "Self view" ON public.profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff view all profiles" ON public.profiles FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- USER ROLES
DO $$ BEGIN
    CREATE POLICY "Users can insert their own pending role" ON public.user_roles FOR INSERT
    WITH CHECK (auth.uid() = user_id AND role = 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can view all roles" ON public.user_roles FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can manage roles" ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DENUNCIAS
DO $$ BEGIN
    CREATE POLICY "Qualquer um pode inserir denuncias" ON public.denuncias FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can view all denuncias" ON public.denuncias FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Citizens view own denuncias" ON public.denuncias FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can update denuncias" ON public.denuncias FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can delete denuncias" ON public.denuncias FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INVESTIGACOES
DO $$ BEGIN
    CREATE POLICY "Staff can view investigacoes" ON public.investigacoes FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can insert investigacoes" ON public.investigacoes FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can update investigacoes" ON public.investigacoes FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can delete investigacoes" ON public.investigacoes FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RELATORIOS
DO $$ BEGIN
    CREATE POLICY "Staff can view relatorios" ON public.relatorios FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can insert relatorios" ON public.relatorios FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can update relatorios" ON public.relatorios FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can delete relatorios" ON public.relatorios FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DEPOIMENTOS
DO $$ BEGIN
    CREATE POLICY "Staff can view depoimentos" ON public.depoimentos FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can insert depoimentos" ON public.depoimentos FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can update depoimentos" ON public.depoimentos FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can delete depoimentos" ON public.depoimentos FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DENUNCIA_RELATORIO
DO $$ BEGIN
    CREATE POLICY "Staff can manage denuncia_relatorio" ON public.denuncia_relatorio FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INVESTIGACAO_RELATORIO
DO $$ BEGIN
    CREATE POLICY "Staff can manage investigacao_relatorio" ON public.investigacao_relatorio FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DENUNCIA_INVESTIGACAO
DO $$ BEGIN
    CREATE POLICY "Staff can manage denuncia_investigacao" ON public.denuncia_investigacao FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DENUNCIA_DEPOIMENTO
DO $$ BEGIN
    CREATE POLICY "Staff can manage denuncia_depoimento" ON public.denuncia_depoimento FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RELATORIO_GERAL_VINCULOS
DO $$ BEGIN
    CREATE POLICY "Staff can manage relatorio_geral_vinculos" ON public.relatorio_geral_vinculos FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- IPM
DO $$ BEGIN
    CREATE POLICY "Staff can view ipm" ON public.ipm FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can insert ipm" ON public.ipm FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can update ipm" ON public.ipm FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can delete ipm" ON public.ipm FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- IPM_VINCULOS
DO $$ BEGIN
    CREATE POLICY "Staff can manage ipm_vinculos" ON public.ipm_vinculos FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AUDIT_LOGS
DO $$ BEGIN
    CREATE POLICY "Admins can read audit_logs" ON public.audit_logs FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Anyone can insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AFASTAMENTOS
DO $$ BEGIN
    CREATE POLICY "Staff can view afastamentos" ON public.afastamentos FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can insert afastamentos" ON public.afastamentos FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can update afastamentos" ON public.afastamentos FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Admins can delete afastamentos" ON public.afastamentos FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INVESTIGACOES POLICIAL
DO $$ BEGIN
    CREATE POLICY "Staff can manage investigacoes_policial" ON public.investigacoes_policial FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INQUERITOS POLICIAL
DO $$ BEGIN
    CREATE POLICY "Staff can manage inqueritos_policial" ON public.inqueritos_policial FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ADVERTENCIAS
DO $$ BEGIN
    CREATE POLICY "Staff can view advertencias" ON public.advertencias FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Staff can insert advertencias" ON public.advertencias FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Admins can delete advertencias" ON public.advertencias FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==========================================
-- RELOAD SCHEMA
-- ==========================================
NOTIFY pgrst, 'reload schema';
