CREATE TABLE IF NOT EXISTS atos_administrativos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_ato TEXT NOT NULL,
  data_emissao TEXT NOT NULL,
  denuncia_id UUID,
  numero_referencia TEXT,
  ipm_numero TEXT,
  nome_policial TEXT NOT NULL,
  posto_graduacao TEXT NOT NULL,
  rg_pm TEXT,
  medidas JSONB DEFAULT '[]'::jsonb,
  data_inicio_suspensao TEXT,
  data_fim_suspensao TEXT,
  horas_guarita INTEGER,
  horas_base_comunitaria INTEGER,
  horas_prisao_disciplinar INTEGER,
  responsavel_nome TEXT NOT NULL,
  responsavel_posto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE atos_administrativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Corregedores can manage atos_administrativos"
  ON atos_administrativos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'corregedor')
    )
  );
