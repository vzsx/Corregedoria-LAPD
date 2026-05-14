-- Adicionar coluna user_id na tabela de denúncias para vincular a um cidadão logado
ALTER TABLE public.denuncias 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Garantir que a coluna dados_detalhados exista (caso não tenha rodado o script anterior)
ALTER TABLE public.denuncias 
ADD COLUMN IF NOT EXISTS dados_detalhados JSONB DEFAULT '{}'::jsonb;

-- Criar política de segurança (RLS) para que cidadãos vejam apenas suas próprias denúncias
-- Nota: Administradores e Corregedores devem continuar vendo tudo via Service Role ou políticas específicas.

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

-- Política para Cidadãos lerem apenas suas denúncias
CREATE POLICY "Cidadãos podem ver suas próprias denúncias" 
ON public.denuncias 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para Administradores/Corregedores (Ajuste conforme necessário baseado nos papéis da user_roles)
CREATE POLICY "Corregedores podem ver tudo" 
ON public.denuncias 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'corregedor')
  )
);

-- Política para inserção (Qualquer um pode inserir denúncia, logado ou não)
CREATE POLICY "Qualquer um pode inserir denúncias" 
ON public.denuncias 
FOR INSERT 
WITH CHECK (true);
