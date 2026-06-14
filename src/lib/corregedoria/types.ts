export type Status = "pendente" | "em_analise" | "concluida" | "arquivada";
export type Tab = "dashboard" | "denuncias" | "investigacoes" | "inqueritos" | "atos" | "oficiais" | "solicitacoes" | "depoimentos" | "relatorios_gerais" | "afastamentos";

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

export type AfastamentoStatus = "ativo" | "encerrado" | "em_investigacao" | "em_inquerito";
export type InvestigacaoPolicialStatus = "em_andamento" | "em_analise" | "concluida" | "arquivada";
export type InqueritoPolicialStatus = "em_andamento" | "concluido" | "arquivado" | "encaminhado";

export interface Afastamento {
  id: string;
  numero_portaria: string;
  ano: string;
  data_portaria: string;
  posto_graduacao: string;
  nome_completo: string;
  rg_pm: string;
  unidade: string;
  funcao_cargo: string | null;
  motivo_afastamento: string;
  prazo_afastamento: string;
  numero_procedimento: string;
  responsavel_decisao: string;
  corregedor_cargo: string | null;
  documento_conteudo: string | null;
  autor_id: string | null;
  autor_nome: string | null;
  historico_versoes: any;
  observacoes: string | null;
  status: AfastamentoStatus;
  created_at: string;
  updated_at: string;
}

export interface VersaoDocumento {
  id: string;
  data: string;
  autor: string;
  documento: string;
  alteracoes: string;
}

export interface InvestigacaoPolicial {
  id: string;
  numero_investigacao: string;
  data_instauracao: string;
  encarregado: string;
  descricao_fatos: string;
  provas_anexadas: string | null;
  testemunhas: string | null;
  status: InvestigacaoPolicialStatus;
  afastamento_id: string;
  created_at: string;
  updated_at: string;
}

export interface InqueritoPolicial {
  id: string;
  numero_inquerito: string;
  data_instauracao: string;
  autoridade_responsavel: string;
  relatorio: string | null;
  parecer: string | null;
  resultado: string | null;
  status: InqueritoPolicialStatus;
  afastamento_id: string;
  created_at: string;
  updated_at: string;
}

export interface Advertencia {
  id: string;
  descricao: string;
  data_advertencia: string;
  autoridade_responsavel: string;
  afastamento_id: string;
  created_at: string;
}
