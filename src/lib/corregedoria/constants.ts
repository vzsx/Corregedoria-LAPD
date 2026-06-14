import type { Status, AfastamentoStatus, InvestigacaoPolicialStatus, InqueritoPolicialStatus } from "./types";

export const STATUS_LABEL: Record<Status, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  concluida: "Concluída",
  arquivada: "Arquivada",
};

export const STATUS_COLOR: Record<Status, string> = {
  pendente: "bg-red-500/10 text-red-700 border-red-500/40",
  em_analise: "bg-primary/10 text-primary border-primary/30",
  concluida: "bg-emerald-500/10 text-emerald-700 border-emerald-500/40",
  arquivada: "bg-muted text-muted-foreground border-border",
};

export const TIPO_DENUNCIA_OPTIONS = [
  "Abuso de Autoridade",
  "Uso Excessivo de Força",
  "Corrupção / Suborno",
  "Má Conduta Profissional",
  "Discriminação",
  "Negligência de Dever",
];

export const PROVAS_OPTIONS = [
  "Vídeo",
  "Áudio",
  "Fotos",
  "Documentos",
  "Mensagens/Chat",
];

export const AFASTAMENTO_STATUS_LABEL: Record<AfastamentoStatus, string> = {
  ativo: "Ativo",
  encerrado: "Encerrado",
  em_investigacao: "Em Investigação",
  em_inquerito: "Em Inquérito",
};

export const AFASTAMENTO_STATUS_COLOR: Record<AfastamentoStatus, string> = {
  ativo: "bg-amber-500/10 text-amber-700 border-amber-500/40",
  encerrado: "bg-slate-500/10 text-slate-700 border-slate-500/40",
  em_investigacao: "bg-blue-500/10 text-blue-700 border-blue-500/40",
  em_inquerito: "bg-red-500/10 text-red-700 border-red-500/40",
};

export const INVESTIGACAO_POLICIAL_STATUS_LABEL: Record<InvestigacaoPolicialStatus, string> = {
  em_andamento: "Em andamento",
  em_analise: "Em análise",
  concluida: "Concluída",
  arquivada: "Arquivada",
};

export const INVESTIGACAO_POLICIAL_STATUS_COLOR: Record<InvestigacaoPolicialStatus, string> = {
  em_andamento: "bg-blue-500/10 text-blue-700 border-blue-500/40",
  em_analise: "bg-amber-500/10 text-amber-700 border-amber-500/40",
  concluida: "bg-emerald-500/10 text-emerald-700 border-emerald-500/40",
  arquivada: "bg-muted text-muted-foreground border-border",
};

export const INQUERITO_POLICIAL_STATUS_LABEL: Record<InqueritoPolicialStatus, string> = {
  em_andamento: "Em andamento",
  concluido: "Concluído",
  arquivado: "Arquivado",
  encaminhado: "Encaminhado",
};

export const INQUERITO_POLICIAL_STATUS_COLOR: Record<InqueritoPolicialStatus, string> = {
  em_andamento: "bg-blue-500/10 text-blue-700 border-blue-500/40",
  concluido: "bg-emerald-500/10 text-emerald-700 border-emerald-500/40",
  arquivado: "bg-muted text-muted-foreground border-border",
  encaminhado: "bg-violet-500/10 text-violet-700 border-violet-500/40",
};
