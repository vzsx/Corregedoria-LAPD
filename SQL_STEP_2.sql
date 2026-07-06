-- BLOCO 2: TABELAS
-- Rode depois do Bloco 1

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  badge_number TEXT,
  patente TEXT DEFAULT 'Oficial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

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

CREATE TABLE IF NOT EXISTS public.investigacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_registro SERIAL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  investigado TEXT,
  status denuncia_status DEFAULT 'pendente',
  notas_internas TEXT,
  tipo_procedimento TEXT DEFAULT 'Investigacao Administrativa',
  autoridade_responsavel TEXT,
  autoridade_patente TEXT,
  autoridade_departamento TEXT DEFAULT 'Corregedoria Geral (PMESP)',
  investigado_badge TEXT,
  investigado_patente TEXT,
  investigado_unidade TEXT,
  origem_caso TEXT DEFAULT 'Denuncia de civil',
  origem_outro TEXT,
  fundamentacao TEXT,
  medidas_iniciais JSONB DEFAULT '[]'::jsonb,
  medidas_outro TEXT,
  detalhes_adicionais TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  motivo_afastamento TEXT NOT NULL DEFAULT '',
  status afastamento_status DEFAULT 'ativo',
  autor_id UUID,
  autor_nome TEXT,
  historico_versoes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.advertencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  data_advertencia DATE NOT NULL,
  autoridade_responsavel TEXT NOT NULL,
  afastamento_id UUID REFERENCES public.afastamentos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
