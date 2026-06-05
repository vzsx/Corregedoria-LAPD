export type Status = "pendente" | "em_analise" | "concluida" | "arquivada";
export type Tab = "dashboard" | "denuncias" | "investigacoes" | "inqueritos" | "atos" | "oficiais" | "solicitacoes" | "depoimentos" | "relatorios_gerais";

export interface Denuncia {
  id: string;
  numero_registro: number;
  titulo: string;
  descricao: string;
  policial_denunciado: string | null;
  data_ocorrido: string | null;
  contato_opcional: string | null;
  status: Status;
  notas_internas: string | null;
  created_at: string;
  dados_detalhados?: any;
}

export interface Relatorio {
  id: string;
  numero_registro: number;
  titulo: string;
  tipo_denuncia: string;
  oficial: string;
  conteudo: string;
  status: Status;
  created_at: string;
  dados_detalhados?: any;
}

export interface Investigacao {
  id: string;
  numero_registro: number;
  titulo: string;
  descricao: string | null;
  investigado: string | null;
  status: Status;
  notas_internas: string | null;
  created_at: string;
  tipo_procedimento: string | null;
  autoridade_responsavel: string | null;
  autoridade_patente: string | null;
  autoridade_departamento: string | null;
  investigado_badge: string | null;
  investigado_patente: string | null;
  investigado_unidade: string | null;
  origem_caso: string | null;
  origem_outro: string | null;
  fundamentacao: string | null;
  medidas_iniciais: any;
  medidas_outro: string | null;
  detalhes_adicionais: string | null;
}

export interface InvestigacaoRelatorio {
  investigacao_id: string;
  relatorio_id: string;
}

export interface DenunciaRelatorio {
  denuncia_id: string;
  relatorio_id: string;
}

export interface DenunciaInvestigacao {
  denuncia_id: string;
  investigacao_id: string;
}

export interface DenunciaDepoimento {
  denuncia_id: string;
  depoimento_id: string;
}

export interface Depoimento {
  id: string;
  numero_registro: number;
  oficial_nome: string;
  oficial_patente: string | null;
  oficial_re: string | null;
  depoimento: string;
  data_depoimento: string;
  oficial_batalhao: string | null;
  relatorio_id_ip: string | null;
  relatorio_id_ato: string | null;
  investigacao_id: string | null;
  observacao: string | null;
  created_at: string;
}

export interface RelatorioGeralVinculo {
  id: string;
  relatorio_id: string;
  entidade_id: string;
  entidade_tipo: "denuncia" | "investigacao" | "depoimento" | "inquerito" | "ato";
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  badge_number: string;
  patente: string | null;
  created_at: string;
  role?: "corregedor" | "admin" | "pending";
}

export interface PendingUser {
  user_id: string;
  role_id: string;
  full_name: string;
  badge_number: string;
  created_at: string;
}
