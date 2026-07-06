-- BLOCO 4: RLS POLICIES
-- Rode depois do Bloco 3

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
DO $$
BEGIN
    CREATE POLICY "Self view" ON public.profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff view all profiles" ON public.profiles FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- USER ROLES
DO $$
BEGIN
    CREATE POLICY "Users can insert their own pending role" ON public.user_roles FOR INSERT
    WITH CHECK (auth.uid() = user_id AND role = 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can view all roles" ON public.user_roles FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can manage roles" ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DENUNCIAS
DO $$
BEGIN
    CREATE POLICY "Qualquer um pode inserir denuncias" ON public.denuncias FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can view all denuncias" ON public.denuncias FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Citizens view own denuncias" ON public.denuncias FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can update denuncias" ON public.denuncias FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can delete denuncias" ON public.denuncias FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INVESTIGACOES
DO $$
BEGIN
    CREATE POLICY "Staff can view investigacoes" ON public.investigacoes FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can insert investigacoes" ON public.investigacoes FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can update investigacoes" ON public.investigacoes FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can delete investigacoes" ON public.investigacoes FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RELATORIOS
DO $$
BEGIN
    CREATE POLICY "Staff can view relatorios" ON public.relatorios FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can insert relatorios" ON public.relatorios FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can update relatorios" ON public.relatorios FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can delete relatorios" ON public.relatorios FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DEPOIMENTOS
DO $$
BEGIN
    CREATE POLICY "Staff can view depoimentos" ON public.depoimentos FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can insert depoimentos" ON public.depoimentos FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can update depoimentos" ON public.depoimentos FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can delete depoimentos" ON public.depoimentos FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- LINK TABLES
DO $$
BEGIN
    CREATE POLICY "Staff can manage denuncia_relatorio" ON public.denuncia_relatorio FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can manage investigacao_relatorio" ON public.investigacao_relatorio FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can manage denuncia_investigacao" ON public.denuncia_investigacao FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can manage denuncia_depoimento" ON public.denuncia_depoimento FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can manage relatorio_geral_vinculos" ON public.relatorio_geral_vinculos FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- IPM
DO $$
BEGIN
    CREATE POLICY "Staff can view ipm" ON public.ipm FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can insert ipm" ON public.ipm FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can update ipm" ON public.ipm FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can delete ipm" ON public.ipm FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can manage ipm_vinculos" ON public.ipm_vinculos FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AUDIT LOGS
DO $$
BEGIN
    CREATE POLICY "Admins can read audit_logs" ON public.audit_logs FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Anyone can insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AFASTAMENTOS
DO $$
BEGIN
    CREATE POLICY "Staff can view afastamentos" ON public.afastamentos FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can insert afastamentos" ON public.afastamentos FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can update afastamentos" ON public.afastamentos FOR UPDATE
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Admins can delete afastamentos" ON public.afastamentos FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INVESTIGACOES POLICIAL
DO $$
BEGIN
    CREATE POLICY "Staff can manage investigacoes_policial" ON public.investigacoes_policial FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INQUERITOS POLICIAL
DO $$
BEGIN
    CREATE POLICY "Staff can manage inqueritos_policial" ON public.inqueritos_policial FOR ALL
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ADVERTENCIAS
DO $$
BEGIN
    CREATE POLICY "Staff can view advertencias" ON public.advertencias FOR SELECT
    USING (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Staff can insert advertencias" ON public.advertencias FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'corregedor') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Admins can delete advertencias" ON public.advertencias FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Recarregar schema
NOTIFY pgrst, 'reload schema';
