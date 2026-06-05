import type { Status } from "./types";

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
