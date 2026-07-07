export type Status = "pendente" | "em_analise" | "concluida" | "arquivada";
export type Tab = "dashboard" | "denuncias" | "investigacoes" | "inqueritos" | "atos" | "oficiais" | "solicitacoes" | "depoimentos" | "relatorios_gerais" | "afastamentos" | "ipm" | "membros" | "auditoria";

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
  registrador_nome: string | null;
  registrador_patente: string | null;
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

export type AfastamentoStatus = "ativo" | "concluido" | "arquivado";
export type InvestigacaoPolicialStatus = "em_andamento" | "em_analise" | "concluida" | "arquivada";
export type InqueritoPolicialStatus = "em_andamento" | "concluido" | "arquivado" | "encaminhado";

export interface Afastamento {
  id: string;
  tipo_afastamento: "cautelar" | "disciplinar" | null;
  numero_portaria: string;
  data_emissao: string;
  posto_graduacao: string;
  nome_completo: string;
  rg_pm: string;
  unidade: string;
  data_inicio: string;
  data_termino: string;
  artigos: string | null;
  observacoes: string | null;
  inquerito_id: string | null;
  responsavel_nome: string;
  responsavel_posto: string;
  responsavel_assinatura: string | null;
  motivo_afastamento: string;
  status: AfastamentoStatus;
  autor_id: string | null;
  autor_nome: string | null;
  historico_versoes: any;
  periodo: "determinado" | "indeterminado" | null;
  created_at: string;
  updated_at: string;
}

export interface VersaoDocumento {
  id: string;
  data: string;
  autor: string;
  documento: string;
  alteracoes: string;
  tipo?: string;
}

export type IpmStatus = "em_andamento" | "concluido" | "arquivado";

export interface Indiciado {
  id: string;
  nome: string;
  posto_graduacao: string;
  rg_pm: string;
  unidade: string;
}

export interface Enquadramento {
  id: string;
  indiciado_nome: string;
  artigos_cpm: string;
  artigos_cppm: string;
  artigos_rdpm: string;
  observacoes: string;
}

export interface Vinculacao {
  tipo: "afastamento" | "investigacao" | "policial" | "procedimento";
  id: string;
  descricao: string;
}

export interface Ipm {
  id: string;
  numero_ipm: string;
  data_instauracao: string;
  unidade: string;
  status: IpmStatus;
  encarregado_nome: string;
  encarregado_posto: string;
  autoridade_nome: string;
  autoridade_posto: string;
  fundamentacao: string;
  artigos_cpm: string;
  artigos_rdpm: string;
  relatorio_fatos: string;
  conclusao_parcial: string;
  indiciados: Indiciado[];
  enquadramentos: Enquadramento[];
  vinculacoes: Vinculacao[];
  historico_versoes: any;
  autor_id: string | null;
  autor_nome: string | null;
  created_at: string;
  updated_at: string;
}

export interface IpmVinculo {
  id: string;
  ipm_id: string;
  entidade_id: string;
  entidade_tipo: "denuncia" | "investigacao" | "relatorio" | "depoimento" | "afastamento";
  created_at: string;
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

export interface AfastamentoDenuncia {
  afastamento_id: string;
  denuncia_id: string;
}

export interface AfastamentoInvestigacao {
  afastamento_id: string;
  investigacao_id: string;
}

export interface AfastamentoRelatorio {
  afastamento_id: string;
  relatorio_id: string;
}

export interface AfastamentoDepoimento {
  afastamento_id: string;
  depoimento_id: string;
}
