-- Criar tabela de perfis de cidadãos (Separada dos Oficiais/Profiles)
CREATE TABLE IF NOT EXISTS public.citizen_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.citizen_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança para Citizen Profiles
CREATE POLICY "Cidadãos podem ver e editar seu próprio perfil" 
ON public.citizen_profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Corregedores podem visualizar perfis de cidadãos" 
ON public.citizen_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'corregedor'))
);

-- Vincular Denúncias (Já existente no script anterior, mas reforçando aqui)
ALTER TABLE public.denuncias 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Atualizar RLS das denúncias para garantir que cidadãos só vejam as suas
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

-- Dropar políticas antigas se existirem para evitar conflito
DROP POLICY IF EXISTS "Cidadãos podem ver suas próprias denúncias" ON public.denuncias;
CREATE POLICY "Cidadãos podem ver suas próprias denúncias" 
ON public.denuncias FOR SELECT USING (auth.uid() = user_id);
