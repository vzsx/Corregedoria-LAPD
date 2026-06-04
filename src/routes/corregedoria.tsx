import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Shield, FileText, Loader2, Plus, FileSignature, LayoutDashboard, 
  Users, UserPlus, LogOut, Activity, Link as LinkIcon, Trash2, Edit,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/corregedoria")({
  component: Corregedoria,
});

type Status = "pendente" | "em_analise" | "concluida" | "arquivada";
type Tab = "dashboard" | "denuncias" | "investigacoes" | "inqueritos" | "atos" | "oficiais" | "solicitacoes" | "depoimentos";

interface Denuncia {
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

interface Relatorio {
  id: string;
  titulo: string;
  tipo_denuncia: string;
  oficial: string;
  conteudo: string;
  status: Status;
  created_at: string;
  dados_detalhados?: any;
}

interface Investigacao {
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

interface InvestigacaoRelatorio {
  investigacao_id: string;
  relatorio_id: string;
}

interface DenunciaRelatorio {
  denuncia_id: string;
  relatorio_id: string;
}

interface DenunciaInvestigacao {
  denuncia_id: string;
  investigacao_id: string;
}

interface Depoimento {
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
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  badge_number: string;
  patente: string | null;
  created_at: string;
  role?: "corregedor" | "admin" | "pending";
}

interface PendingUser {
  user_id: string;
  role_id: string;
  full_name: string;
  badge_number: string;
  created_at: string;
}

const STATUS_LABEL: Record<Status, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  concluida: "Concluída",
  arquivada: "Arquivada",
};

const STATUS_COLOR: Record<Status, string> = {
  pendente: "bg-red-500/10 text-red-700 border-red-500/40",
  em_analise: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  concluida: "bg-emerald-500/10 text-emerald-700 border-emerald-500/40",
  arquivada: "bg-muted text-muted-foreground border-border",
};

const formatDateSafe = (dateStr: any, formatStr: string) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return format(date, formatStr);
  } catch (e) {
    return "-";
  }
};

const RelatorioCard = ({ 
  relatorio, expanded, onToggle, isAdmin, onApprove, onEdit, onDelete, onUpdateStatus,
  denuncias, investigacoes, relatorios, denunciaRelatorios, investigacaoRelatorios,
  onLinkDenuncia, onLinkInvestigacao, linking, linkDenunciaId, setLinkDenunciaId,
  linkInvestigacaoId, setLinkInvestigacaoId
}: any) => {
  const linkedDenuncias = denunciaRelatorios
    .filter((dr: any) => dr.relatorio_id === relatorio.id)
    .map((dr: any) => denuncias.find((d: any) => d.id === dr.denuncia_id))
    .filter(Boolean);
  
  const linkedInvestigacoes = investigacaoRelatorios
    .filter((ir: any) => ir.relatorio_id === relatorio.id)
    .map((ir: any) => investigacoes.find((i: any) => i.id === ir.investigacao_id))
    .filter(Boolean);

  const availableDenuncias = denuncias.filter(
    (d: any) => !denunciaRelatorios.some((dr: any) => dr.relatorio_id === relatorio.id && dr.denuncia_id === d.id)
  );

  const availableInvestigacoes = investigacoes.filter(
    (i: any) => !investigacaoRelatorios.some((ir: any) => ir.relatorio_id === relatorio.id && ir.investigacao_id === i.id)
  );

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div 
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-muted cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted/50">
            {relatorio.tipo_denuncia === "Inquérito Policial" ? (
              <FileSignature className="h-5 w-5 text-foreground" />
            ) : (
              <FileText className="h-5 w-5 text-emerald-400" />
            )}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-3 whitespace-nowrap overflow-hidden">
              <h4 className="font-bold uppercase text-foreground tracking-wide truncate max-w-[200px]">{relatorio.titulo}</h4>
              <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground bg-muted/50">
                {relatorio.tipo_denuncia}
              </Badge>
              <Badge className={(STATUS_COLOR[relatorio.status as Status] || STATUS_COLOR.pendente) + " text-[9px] uppercase border"}>
                {(STATUS_LABEL[relatorio.status as Status] || "Pendente")}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
              <span>{format(new Date(relatorio.created_at), "dd/MM/yy HH:mm")}</span>
              <span>·</span>
              <span>Oficial: {relatorio.oficial}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1 ml-4">
            <Select value={relatorio.status} onValueChange={(v: Status) => onUpdateStatus(relatorio.id, v)}>
              <SelectTrigger className="h-8 bg-muted border-border text-[10px] text-muted-foreground uppercase tracking-widest w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border text-foreground">
                {Object.entries(STATUS_LABEL).map(([val, lab]) => (
                  <SelectItem key={val} value={val} className="text-[10px] uppercase">{lab}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => onEdit(relatorio)}
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={() => onDelete(relatorio.id)}
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/50 bg-muted/50 p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Denúncias Vinculadas */}
            <div className="rounded border border-border bg-muted p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Activity className="h-4 w-4" /> Denúncias Vinculadas
              </div>
              {linkedDenuncias.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {linkedDenuncias.map((d: any) => (
                    <div key={d.id} className="flex items-center gap-3 rounded bg-muted px-3 py-2 text-sm border border-border">
                      <Badge variant="outline" className="bg-background border-border text-foreground font-mono text-[10px]">
                        #{d.numero_registro?.toString().padStart(4, '0')}
                      </Badge>
                      <span className="text-foreground">{d.titulo}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-4">Nenhuma denúncia anexada.</p>
              )}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select value={linkDenunciaId} onValueChange={setLinkDenunciaId}>
                  <SelectTrigger className="bg-muted border-border text-foreground text-xs h-8">
                    <SelectValue placeholder="Vincular denúncia..." />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border text-foreground">
                    {availableDenuncias.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>#{d.numero_registro?.toString().padStart(4, '0')} - {d.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={() => onLinkDenuncia(relatorio.id)} disabled={linking || !linkDenunciaId} className="h-8 bg-zinc-800 hover:bg-slate-700 text-white text-[10px]">
                {linking ? "..." : "Link"}
              </Button>
            </div>
            </div>

            {/* Investigações Vinculadas */}
            <div className="rounded border border-border bg-muted p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Shield className="h-4 w-4" /> Investigações Vinculadas
              </div>
              {linkedInvestigacoes.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {linkedInvestigacoes.map((i: any) => (
                    <div key={i.id} className="flex items-center gap-3 rounded bg-muted px-3 py-2 text-sm border border-border">
                      <Badge variant="outline" className="bg-background border-border text-foreground font-mono text-[10px]">
                        #{i.numero_registro.toString().padStart(4, '0')}
                      </Badge>
                      <span className="text-foreground">{i.titulo}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-4">Nenhuma investigação anexada.</p>
              )}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select value={linkInvestigacaoId} onValueChange={setLinkInvestigacaoId}>
                  <SelectTrigger className="bg-muted border-border text-foreground text-xs h-8">
                    <SelectValue placeholder="Vincular investigação..." />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border text-foreground">
                    {availableInvestigacoes.map((i: any) => (
                      <SelectItem key={i.id} value={i.id}>#{i.numero_registro.toString().padStart(4, '0')} - {i.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={() => onLinkInvestigacao(relatorio.id)} disabled={linking || !linkInvestigacaoId} className="h-8 bg-zinc-800 hover:bg-slate-700 text-white text-[10px]">
                {linking ? "..." : "Link"}
              </Button>
            </div>
            </div>
          </div>

          {relatorio.tipo_denuncia === "Inquérito Policial" && relatorio.dados_detalhados && (
            <div className="space-y-6 border-b border-border pb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-l-2 border-red-600 pl-3 bg-red-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">0. DADOS DO CORREGEDOR</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-[10px] text-muted-foreground">Caso: <span className="text-foreground">{relatorio.dados_detalhados.numero_caso}</span></p>
                      <p className="text-[10px] text-muted-foreground">Abertura: <span className="text-foreground">{formatDateSafe(relatorio.dados_detalhados.data_abertura, "dd/MM/yyyy")}</span></p>
                      <p className="text-[10px] text-muted-foreground">Patente: <span className="text-foreground">{relatorio.dados_detalhados.corregedor_patente}</span></p>
                      <p className="text-[10px] text-muted-foreground">Recebimento: <span className="text-foreground">{formatDateSafe(relatorio.dados_detalhados.data_recebimento, "dd/MM/yyyy")}</span></p>
                    </div>
                  </div>
                  <div className="border-l-2 border-zinc-500 pl-3 bg-muted/50 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">1. DADOS DO RECLAMANTE</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-[10px] text-muted-foreground">Nome: <span className="text-foreground">{relatorio.dados_detalhados.reclamante_nome}</span></p>
                      <p className="text-[10px] text-muted-foreground">ID: <span className="text-foreground">{relatorio.dados_detalhados.reclamante_id}</span></p>
                      <p className="text-[10px] text-muted-foreground">Discord: <span className="text-foreground">{relatorio.dados_detalhados.reclamante_discord || "N/A"}</span></p>
                      <p className="text-[10px] text-muted-foreground">Anônimo: <span className="text-foreground font-bold">{relatorio.dados_detalhados.reclamante_anonimo}</span></p>
                    </div>
                  </div>
                  <div className="border-l-2 border-slate-600 pl-3 bg-slate-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">2. POLICIAL DENUNCIADO</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-[10px] text-muted-foreground">Nome: <span className="text-foreground">{relatorio.dados_detalhados.denunciado_nome}</span></p>
                      <p className="text-[10px] text-muted-foreground">Badge: <span className="text-foreground">#{relatorio.dados_detalhados.denunciado_badge}</span></p>
                      <p className="text-[10px] text-muted-foreground">Patente: <span className="text-foreground">{relatorio.dados_detalhados.denunciado_patente}</span></p>
                      <p className="text-[10px] text-muted-foreground">Viatura: <span className="text-foreground">{relatorio.dados_detalhados.denunciado_viatura || "N/A"}</span></p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border-l-2 border-zinc-600 pl-3 bg-muted/50 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">3. TIPO DE DENÚNCIA</h4>
                    <Badge variant="outline" className="bg-muted/50 border-border text-foreground text-[10px] uppercase">
                      {relatorio.dados_detalhados.tipo_denuncia_selecionado}
                    </Badge>
                  </div>
                  <div className="border-l-2 border-zinc-600 pl-3 bg-muted/50 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">4. INFORMAÇÕES DO INCIDENTE</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <p className="text-[10px] text-muted-foreground">Data: <span className="text-foreground">{formatDateSafe(relatorio.dados_detalhados.incidente_data, "dd/MM/yyyy")}</span></p>
                      <p className="text-[10px] text-muted-foreground">Horário: <span className="text-foreground">{relatorio.dados_detalhados.incidente_horario}</span></p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1">Local: <span className="text-foreground">{relatorio.dados_detalhados.incidente_local}</span></p>
                    <p className="text-[10px] text-muted-foreground">Testemunhas: <span className="text-foreground">{relatorio.dados_detalhados.incidente_testemunhas}</span></p>
                  </div>
                  <div className="border-l-2 border-emerald-600 pl-3 bg-emerald-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">6. PROVAS E EVIDÊNCIAS</h4>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {relatorio.dados_detalhados.provas_selecionadas?.map((p: string) => (
                        <Badge key={p} variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[9px] uppercase">{p}</Badge>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground italic bg-background/40 p-1.5 rounded border border-emerald-500/10">{relatorio.dados_detalhados.provas_descricao || "Nenhuma descrição adicional."}</p>
                  </div>
                </div>
              </div>
              
              {(relatorio.dados_detalhados.ato_ids_vinculados?.length > 0) && (
                <div className="mt-4 p-3 rounded border border-border bg-muted/50">
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-foreground mb-2 flex items-center gap-2">
                    <LinkIcon className="h-3 w-3" /> Atos Administrativos Vinculados
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {relatorio.dados_detalhados.ato_ids_vinculados.map((id: string) => (
                      <Badge key={id} variant="outline" className="bg-muted border-border text-foreground text-[10px]">
                        {relatorios?.find((r: Relatorio) => r.id === id)?.titulo || "Documento não encontrado"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(relatorio.dados_detalhados.depoimento_ids?.length > 0) && (
                <div className="mt-4 p-3 rounded border border-border bg-muted/50">
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-foreground mb-2 flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" /> Depoimentos Vinculados
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {relatorio.dados_detalhados.depoimento_ids.map((id: string) => {
                      const dep = depoimentos?.find((d: Depoimento) => d.id === id);
                      return (
                        <Badge key={id} variant="outline" className="bg-muted border-border text-foreground text-[10px]">
                          {dep?.oficial_nome || "Depoimento não encontrado"}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {relatorio.tipo_denuncia === "Ato Administrativo" && relatorio.dados_detalhados && (
            <div className="space-y-4">
              {/* 1. IDENTIFICAÇÃO */}
              <div className="border-l-2 border-red-600 pl-4 bg-red-500/5 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">1. IDENTIFICAÇÃO DO ATO</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <p className="text-xs text-muted-foreground">Inquérito: <span className="text-foreground">{relatorio.dados_detalhados.ato_numero_inquerito || "N/A"}</span></p>
                  <p className="text-xs text-muted-foreground">Ato: <span className="text-foreground">#{relatorio.dados_detalhados.ato_numero}</span></p>
                  <p className="text-xs text-muted-foreground">Emissão: <span className="text-foreground">{formatDateSafe(relatorio.dados_detalhados.ato_data_emissao, "dd/MM/yyyy")}</span></p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Tipo: <Badge variant="outline" className="ml-1 text-[9px] bg-red-500/10 text-foreground border-red-500/30">{relatorio.dados_detalhados.ato_tipo === "Outro" ? relatorio.dados_detalhados.ato_tipo_outro : relatorio.dados_detalhados.ato_tipo}</Badge></p>
              </div>

              {/* 2. AUTORIDADE */}
              <div className="border-l-2 border-zinc-500 pl-4 bg-muted/50 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">2. AUTORIDADE EMISSORA</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <p className="text-xs text-muted-foreground">Corregedor: <span className="text-foreground">{relatorio.dados_detalhados.ato_autoridade_nome}</span></p>
                  <p className="text-xs text-muted-foreground">Cargo: <span className="text-foreground">{relatorio.dados_detalhados.ato_autoridade_cargo}</span></p>
                  <p className="text-xs text-muted-foreground">Unidade: <span className="text-foreground">{relatorio.dados_detalhados.ato_autoridade_unidade}</span></p>
                </div>
              </div>

              {/* 3. OBJETO */}
              <div className="border-l-2 border-slate-600 pl-4 bg-slate-500/5 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">3. OBJETO DO ATO</h4>
                <p className="text-sm text-foreground italic leading-relaxed">"{relatorio.dados_detalhados.ato_objeto_descricao}"</p>
              </div>

              {/* 4. FUNDAMENTAÇÃO */}
              <div className="border-l-2 border-zinc-600 pl-4 bg-muted/50 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">4. FUNDAMENTAÇÃO</h4>
                <div className="flex flex-wrap gap-1 mb-3">
                  {relatorio.dados_detalhados.ato_fundamentacao_selecionada?.map((f: string) => (
                    <Badge key={f} variant="outline" className="text-[9px] bg-muted/50 border-border text-foreground/70">{f}</Badge>
                  ))}
                </div>
                {relatorio.dados_detalhados.ato_fundamentacao_complementar && (
                  <p className="text-xs text-muted-foreground bg-background/30 p-2 rounded border border-white/10 italic">
                    {relatorio.dados_detalhados.ato_fundamentacao_complementar}
                  </p>
                )}
              </div>

              {/* 5. DECISÃO */}
              <div className="border-l-2 border-zinc-600 pl-4 bg-muted/50 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">5. DECISÃO</h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{relatorio.dados_detalhados.ato_decisao}</p>
              </div>

              {/* 6. MEDIDAS */}
              <div className="border-l-2 border-emerald-600 pl-4 bg-emerald-500/5 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">6. MEDIDAS DETERMINADAS</h4>
                <div className="flex flex-wrap gap-1 mb-3">
                  {relatorio.dados_detalhados.ato_medidas_selecionadas?.map((m: string) => (
                    <Badge key={m} variant="outline" className="text-[9px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400">{m}</Badge>
                  ))}
                </div>
                {relatorio.dados_detalhados.ato_medidas_detalhamento && (
                   <p className="text-xs text-muted-foreground bg-background/30 p-2 rounded border border-emerald-500/10 whitespace-pre-wrap">
                    {relatorio.dados_detalhados.ato_medidas_detalhamento}
                  </p>
                )}
              </div>

              {(relatorio.dados_detalhados.ip_ids_vinculados?.length > 0) && (
                <div className="p-3 rounded border border-border bg-muted/50">
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-foreground mb-2 flex items-center gap-2">
                    <LinkIcon className="h-3 w-3" /> IPs Vinculados
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {relatorio.dados_detalhados.ip_ids_vinculados.map((id: string) => (
                      <Badge key={id} variant="outline" className="bg-muted border-border text-foreground text-[10px]">
                        {relatorios?.find((r: Relatorio) => r.id === id)?.titulo || "Documento não encontrado"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(relatorio.dados_detalhados.depoimento_ids?.length > 0) && (
                <div className="p-3 rounded border border-border bg-muted/50">
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-foreground mb-2 flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" /> Depoimentos Vinculados
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {relatorio.dados_detalhados.depoimento_ids.map((id: string) => {
                      const dep = depoimentos?.find((d: Depoimento) => d.id === id);
                      return (
                        <Badge key={id} variant="outline" className="bg-muted border-border text-foreground text-[10px]">
                          {dep?.oficial_nome || "Depoimento não encontrado"}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 border-b border-border pb-1">Conteúdo do Documento</p>
            <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed font-mono mt-4">{relatorio.conteudo}</p>
          </div>
        </div>
      )}
    </div>
  );
};

function Corregedoria() {
  const { user, loading, isCorregedor, isAdmin, roles, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [denunciaFilter, setDenunciaFilter] = useState<Status | "todas">("todas");
  const [investigacaoFilter, setInvestigacaoFilter] = useState<Status | "todas">("todas");
  const [inqueritoFilter, setInqueritoFilter] = useState<Status | "todas">("todas");
  const [atoFilter, setAtoFilter] = useState<Status | "todas">("todas");
  const [documentoFilter, setDocumentoFilter] = useState<string>("todos");
  
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [investigacoes, setInvestigacoes] = useState<Investigacao[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [denunciaRelatorios, setDenunciaRelatorios] = useState<DenunciaRelatorio[]>([]);
  const [investigacaoRelatorios, setInvestigacaoRelatorios] = useState<InvestigacaoRelatorio[]>([]);
  const [denunciaInvestigacoes, setDenunciaInvestigacoes] = useState<DenunciaInvestigacao[]>([]);
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [oficiais, setOficiais] = useState<Profile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Relatório Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRelatorioId, setEditingRelatorioId] = useState<string | null>(null);
  const [relatorioForm, setRelatorioForm] = useState<{
    titulo: string;
    tipo_denuncia: string;
    oficial: string;
    conteudo: string;
    denuncia_id: string;
    investigacao_id: string;
    investigacao_ids: string[];
    status: Status;
    dados_detalhados: any;
  }>({
    titulo: "",
    tipo_denuncia: "Inquérito Policial",
    oficial: "",
    conteudo: "",
    denuncia_id: "",
    investigacao_id: "",
    investigacao_ids: [],
    status: "pendente",
    dados_detalhados: {
      // 0. DADOS DO CORREGEDOR
      data_abertura: format(new Date(), "yyyy-MM-dd"),
      numero_caso: "",
      corregedor_patente: "",
      data_recebimento: "",
      
      // 1. DADOS DO RECLAMANTE
      reclamante_nome: "",
      reclamante_id: "",
      reclamante_telefone: "",
      reclamante_discord: "",
      reclamante_anonimo: "Não",
      
      // 2. DADOS DO POLICIAL DENUNCIADO
      denunciado_nome: "",
      denunciado_patente: "",
      denunciado_badge: "",
      denunciado_unidade: "",
      denunciado_viatura: "",
      
      // 3. TIPO DE DENÚNCIA
      tipo_denuncia_selecionado: "",
      tipo_denuncia_outro: "",
      
      // 4. INFORMAÇÕES DO INCIDENTE
      incidente_data: "",
      incidente_horario: "",
      incidente_local: "",
      incidente_testemunhas: "Não",
      incidente_testemunhas_nomes: "",
      incidente_testemunhas_contatos: "",
      
      // 6. PROVAS E EVIDÊNCIAS
      provas_selecionadas: [] as string[],
      provas_outro: "",
      provas_descricao: "",
      ato_id_vinculado: "",
      ip_id_vinculado: "",
      depoimento_ids: [] as string[],

      // --- CAMPOS ATO ADMINISTRATIVO ---
      ato_numero_inquerito: "",
      ato_corregedor_responsavel: "",
      ato_numero: "",
      ato_data_emissao: format(new Date(), "yyyy-MM-dd"),
      ato_tipo: "" as string,
      ato_tipo_outro: "",
      ato_autoridade_nome: "",
      ato_autoridade_cargo: "",
      ato_autoridade_unidade: "Corregedoria Geral (PMESP)",
      ato_objeto_descricao: "",
      ato_fundamentacao_selecionada: [] as string[],
      ato_fundamentacao_outro: "",
      ato_fundamentacao_complementar: "",
      ato_decisao: "",
      ato_medidas_selecionadas: [] as string[],
      ato_medidas_outro: "",
      ato_medidas_detalhamento: ""
    }
  });

  // Investigação Form State
  const [isInvestigacaoDialogOpen, setIsInvestigacaoDialogOpen] = useState(false);
  const [isInvestigacaoEditDialogOpen, setIsInvestigacaoEditDialogOpen] = useState(false);
  const [editingInvestigacaoId, setEditingInvestigacaoId] = useState<string | null>(null);
  const [investigacaoForm, setInvestigacaoForm] = useState({
    titulo: "",
    descricao: "",
    investigado: "",
    status: "pendente" as Status,
    denuncia_id: "",
    relatorio_id_ip: "",
    relatorio_id_ato: "",
    
    // Novos campos
    tipo_procedimento: "Investigação Administrativa",
    autoridade_responsavel: "",
    autoridade_patente: "",
    autoridade_departamento: "Corregedoria Geral (PMESP)",
    investigado_badge: "",
    investigado_patente: "",
    investigado_unidade: "",
    origem_caso: "Denúncia de civil",
    origem_outro: "",
    fundamentacao: "",
    medidas_iniciais: [] as string[],
    medidas_outro: "",
    detalhes_adicionais: ""
  });

  const [isDepoimentoDialogOpen, setIsDepoimentoDialogOpen] = useState(false);
  const [submittingDepoimento, setSubmittingDepoimento] = useState(false);
  const [depoimentoForm, setDepoimentoForm] = useState({
    oficial_nome: "",
    oficial_patente: "",
    oficial_re: "",
    depoimento: "",
    data_depoimento: format(new Date(), "yyyy-MM-dd"),
    oficial_batalhao: "",
    relatorio_id_ip: "",
    relatorio_id_ato: "",
    investigacao_id: ""
  });

  const [submitting, setSubmitting] = useState(false);
  
  // Link Relatório State
  const [linkRelatorioId, setLinkRelatorioId] = useState<string>("");
  const [linkDenunciaId, setLinkDenunciaId] = useState<string>("");
  const [linkInvestigacaoId, setLinkInvestigacaoId] = useState<string>("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (user && !relatorioForm.oficial) {
      setRelatorioForm(prev => ({...prev, oficial: user.user_metadata?.full_name || ""}));
    }
    if (user && !investigacaoForm.autoridade_responsavel) {
      setInvestigacaoForm(prev => ({...prev, autoridade_responsavel: user.user_metadata?.full_name || ""}));
    }
  }, [user]);

  useEffect(() => {
    if (!isCorregedor) {
      setFetching(false);
      return;
    }
    const load = async () => {
      const [denunciasRes, investigacoesRes, relatoriosRes, drRes, irRes, diRes, depoimentosRes, perfisRes] = await Promise.all([
        supabase.from("denuncias").select("*").order("created_at", { ascending: false }),
        supabase.from("investigacoes").select("*").order("created_at", { ascending: false }),
        supabase.from("relatorios").select("*").order("created_at", { ascending: false }),
        supabase.from("denuncia_relatorio").select("*"),
        supabase.from("investigacao_relatorio").select("*"),
        supabase.from("denuncia_investigacao").select("*"),
        supabase.from("depoimentos").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("full_name", { ascending: true })
      ]);
      
      if (denunciasRes.data) setDenuncias(denunciasRes.data as Denuncia[]);
      if (investigacoesRes.data) setInvestigacoes(investigacoesRes.data as Investigacao[]);
      if (relatoriosRes.data) setRelatorios(relatoriosRes.data as Relatorio[]);
      if (drRes.data) setDenunciaRelatorios(drRes.data as DenunciaRelatorio[]);
      if (irRes.data) setInvestigacaoRelatorios(irRes.data as InvestigacaoRelatorio[]);
      if (diRes.data) setDenunciaInvestigacoes(diRes.data as DenunciaInvestigacao[]);
      if (depoimentosRes.data) setDepoimentos(depoimentosRes.data as Depoimento[]);
      
      // Filtrar oficiais para mostrar apenas os aprovados (não pendentes)
      if (perfisRes.data) {
        const { data: roles } = await supabase.from("user_roles").select("user_id, role");
        const approvedRoles = roles?.filter(r => r.role !== 'pending') || [];
        const approvedUserIds = approvedRoles.map(r => r.user_id);
        
        const approvedOficiais = perfisRes.data
          .filter(p => approvedUserIds.includes(p.id))
          .map(p => ({
            ...p,
            role: approvedRoles.find(r => r.user_id === p.id)?.role
          }));
          
        setOficiais(approvedOficiais as Profile[]);
      }
      
      if (isAdmin) {
        await loadPendingUsers();
      }
      
      setFetching(false);
    };
    load();

    // Real-time subscriptions
    const denunciasSub = supabase.channel('denuncias-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'denuncias' }, (payload) => {
        if (payload.eventType === 'INSERT') setDenuncias(prev => [payload.new as Denuncia, ...prev]);
        if (payload.eventType === 'UPDATE') setDenuncias(prev => prev.map(d => d.id === payload.new.id ? payload.new as Denuncia : d));
        if (payload.eventType === 'DELETE') setDenuncias(prev => prev.filter(d => d.id !== payload.old.id));
      })
      .subscribe();

    const investigacoesSub = supabase.channel('investigacoes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investigacoes' }, (payload) => {
        if (payload.eventType === 'INSERT') setInvestigacoes(prev => [payload.new as Investigacao, ...prev]);
        if (payload.eventType === 'UPDATE') setInvestigacoes(prev => prev.map(i => i.id === payload.new.id ? payload.new as Investigacao : i));
        if (payload.eventType === 'DELETE') setInvestigacoes(prev => prev.filter(i => i.id !== payload.old.id));
      })
      .subscribe();

    const relatoriosSub = supabase.channel('relatorios-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relatorios' }, (payload) => {
        if (payload.eventType === 'INSERT') setRelatorios(prev => [payload.new as Relatorio, ...prev]);
        if (payload.eventType === 'UPDATE') setRelatorios(prev => prev.map(r => r.id === payload.new.id ? payload.new as Relatorio : r));
        if (payload.eventType === 'DELETE') setRelatorios(prev => prev.filter(r => r.id !== payload.old.id));
      })
      .subscribe();

    const depoimentosSub = supabase.channel('depoimentos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'depoimentos' }, (payload) => {
        if (payload.eventType === 'INSERT') setDepoimentos(prev => [payload.new as Depoimento, ...prev]);
        if (payload.eventType === 'UPDATE') setDepoimentos(prev => prev.map(d => d.id === payload.new.id ? payload.new as Depoimento : d));
        if (payload.eventType === 'DELETE') setDepoimentos(prev => prev.filter(d => d.id !== payload.old.id));
      })
      .subscribe();

    const drSub = supabase.channel('denuncia-relatorio-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'denuncia_relatorio' }, (payload) => {
        if (payload.eventType === 'INSERT') setDenunciaRelatorios(prev => [...prev, payload.new as DenunciaRelatorio]);
        if (payload.eventType === 'DELETE') setDenunciaRelatorios(prev => prev.filter(dr => !(dr.denuncia_id === payload.old.denuncia_id && dr.relatorio_id === payload.old.relatorio_id)));
      })
      .subscribe();

    const irSub = supabase.channel('investigacao-relatorio-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investigacao_relatorio' }, (payload) => {
        if (payload.eventType === 'INSERT') setInvestigacaoRelatorios(prev => [...prev, payload.new as InvestigacaoRelatorio]);
        if (payload.eventType === 'DELETE') setInvestigacaoRelatorios(prev => prev.filter(ir => !(ir.investigacao_id === payload.old.investigacao_id && ir.relatorio_id === payload.old.relatorio_id)));
      })
      .subscribe();

    const diSub = supabase.channel('denuncia-investigacao-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'denuncia_investigacao' }, (payload) => {
        if (payload.eventType === 'INSERT') setDenunciaInvestigacoes(prev => [...prev, payload.new as DenunciaInvestigacao]);
        if (payload.eventType === 'DELETE') setDenunciaInvestigacoes(prev => prev.filter(di => !(di.denuncia_id === payload.old.denuncia_id && di.investigacao_id === payload.old.investigacao_id)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(denunciasSub);
      supabase.removeChannel(investigacoesSub);
      supabase.removeChannel(relatoriosSub);
      supabase.removeChannel(depoimentosSub);
      supabase.removeChannel(drSub);
      supabase.removeChannel(irSub);
      supabase.removeChannel(diSub);
    };
  }, [isCorregedor, isAdmin]);

  const loadPendingUsers = async () => {
    const rolesRes = await supabase.from("user_roles").select("*").eq("role", "pending");
    if (!rolesRes.data || rolesRes.data.length === 0) {
      setPendingUsers([]);
      return;
    }
    const userIds = rolesRes.data.map(r => r.user_id);
    const profilesRes = await supabase.from("profiles").select("*").in("id", userIds);
    
    if (profilesRes.data) {
      const pending = rolesRes.data.map(roleRec => {
        const profile = profilesRes.data.find(p => p.id === roleRec.user_id);
        return {
          user_id: roleRec.user_id,
          role_id: roleRec.id,
          full_name: profile?.full_name || "Desconhecido",
          badge_number: profile?.badge_number || "N/A",
          created_at: roleRec.created_at,
        };
      });
      setPendingUsers(pending);
    }
  };

  const approveUser = async (roleId: string, newRole: "corregedor" | "admin") => {
    const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("id", roleId);
    if (error) {
      toast.error("Erro ao aprovar usuário");
    } else {
      toast.success("Usuário aprovado com sucesso!");
      // Pegar o ID do usuário que foi aprovado antes de filtrar
      const approvedUser = pendingUsers.find(p => p.role_id === roleId);
      if (approvedUser) {
        setOficiais(prev => [...prev, {
          id: approvedUser.user_id,
          full_name: approvedUser.full_name,
          badge_number: approvedUser.badge_number,
          patente: "Oficial",
          created_at: new Date().toISOString()
        }].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      }
      setPendingUsers(prev => prev.filter(p => p.role_id !== roleId));
    }
  };

  const rejectUser = async (roleId: string) => {
    const userToReject = pendingUsers.find(p => p.role_id === roleId);
    if (!userToReject) return;

    if (!confirm(`Tem certeza que deseja REJEITAR esta solicitação de ${userToReject.full_name}? O oficial será removido permanentemente do sistema.`)) return;
    
    // 1. Remover da tabela de perfis
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userToReject.user_id);
    if (profileError) {
      console.error("Erro ao deletar perfil:", profileError);
      return toast.error("Falha ao remover perfil do banco: " + profileError.message);
    }
    
    // 2. Remover da tabela de papéis (todos os papéis deste usuário para garantir limpeza)
    const { error: roleError } = await supabase.from("user_roles").delete().eq("user_id", userToReject.user_id);
    
    if (roleError) {
      console.error("Erro ao deletar papel:", roleError);
      toast.error("Falha ao remover acesso: " + roleError.message);
    } else {
      toast.success("Solicitação rejeitada e removida com sucesso.");
      setPendingUsers(prev => prev.filter(p => p.user_id !== userToReject.user_id));
    }
  };

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("denuncias").update({ status }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    setDenuncias((d) => d.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success("Status atualizado");
  };

  const updateInvestigacaoStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("investigacoes").update({ status }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    setInvestigacoes((d) => d.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success("Status da investigação atualizado");
  };

  const updateRelatorioStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("relatorios").update({ status }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    setRelatorios((d) => d.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success("Status do documento atualizado");
  };

  const updateNotas = async (id: string, notas_internas: string) => {
    const { error } = await supabase.from("denuncias").update({ notas_internas }).eq("id", id);
    if (error) return toast.error("Erro ao salvar notas");
    toast.success("Notas salvas");
  };

  const updateInvestigacaoNotas = async (id: string, notas_internas: string) => {
    const { error } = await supabase.from("investigacoes").update({ notas_internas }).eq("id", id);
    if (error) return toast.error("Erro ao salvar notas");
    toast.success("Notas da investigação salvas");
  };

  const submitRelatorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relatorioForm.titulo || !relatorioForm.oficial || !relatorioForm.conteudo) {
      return toast.error("Preencha todos os campos");
    }
    setSubmitting(true);
    const { data, error } = await supabase.from("relatorios").insert([{
      titulo: relatorioForm.titulo,
      tipo_denuncia: relatorioForm.tipo_denuncia,
      oficial: relatorioForm.oficial,
      conteudo: relatorioForm.conteudo,
      status: relatorioForm.status,
      dados_detalhados: relatorioForm.dados_detalhados
    }]).select();

    if (error || !data) {
      setSubmitting(false);
      return toast.error("Erro ao criar documento: " + (error?.message || "Erro desconhecido"));
    }
    
    if (relatorioForm.denuncia_id && relatorioForm.denuncia_id !== "none") {
      await supabase.from("denuncia_relatorio").insert({
        denuncia_id: relatorioForm.denuncia_id,
        relatorio_id: data[0].id
      });
      setDenunciaRelatorios(prev => [...prev, { denuncia_id: relatorioForm.denuncia_id, relatorio_id: data[0].id }]);
    }

    if (relatorioForm.investigacao_ids?.length) {
      for (const invId of relatorioForm.investigacao_ids) {
        await supabase.from("investigacao_relatorio").insert({
          investigacao_id: invId,
          relatorio_id: data[0].id
        });
      }
      setInvestigacaoRelatorios(prev => [...prev, ...relatorioForm.investigacao_ids.map(invId => ({ investigacao_id: invId, relatorio_id: data[0].id }))]);
    }

    setSubmitting(false);
    toast.success("Documento criado com sucesso!");
    setRelatorios([data[0] as Relatorio, ...relatorios]);
    setIsDialogOpen(false);
    setRelatorioForm({ 
      titulo: "", 
      tipo_denuncia: "Inquérito Policial", 
      oficial: user?.user_metadata?.full_name || "", 
      conteudo: "", 
      denuncia_id: "",
      investigacao_id: "",
      investigacao_ids: [],
      status: "pendente",
      dados_detalhados: {
        data_abertura: format(new Date(), "yyyy-MM-dd"),
        numero_caso: "",
        corregedor_patente: "",
        data_recebimento: "",
        reclamante_nome: "",
        reclamante_id: "",
        reclamante_telefone: "",
        reclamante_discord: "",
        reclamante_anonimo: "Não",
        denunciado_nome: "",
        denunciado_patente: "",
        denunciado_badge: "",
        denunciado_unidade: "",
        denunciado_viatura: "",
        tipo_denuncia_selecionado: "",
        tipo_denuncia_outro: "",
        incidente_data: "",
        incidente_horario: "",
        incidente_local: "",
        incidente_testemunhas: "Não",
        incidente_testemunhas_nomes: "",
        incidente_testemunhas_contatos: "",
        provas_selecionadas: [],
        provas_outro: "",
        provas_descricao: "",
        ato_id_vinculado: "",
        ip_id_vinculado: "",
        depoimento_ids: [],
        // Ato Adm fields
        ato_numero_inquerito: "",
        ato_numero: "",
        ato_data_emissao: format(new Date(), "yyyy-MM-dd"),
        ato_tipo: "",
        ato_tipo_outro: "",
        ato_autoridade_nome: "",
        ato_autoridade_cargo: "",
        ato_autoridade_unidade: "Corregedoria Geral (PMESP)",
        ato_objeto_descricao: "",
        ato_fundamentacao_selecionada: [],
        ato_fundamentacao_complementar: "",
        ato_decisao: "",
        ato_medidas_selecionadas: [],
        ato_medidas_detalhamento: ""
      }
    });
  };

  const submitDepoimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depoimentoForm.oficial_nome || !depoimentoForm.depoimento) {
      return toast.error("Preencha nome do oficial e o depoimento");
    }
    setSubmittingDepoimento(true);
    const { data, error } = await supabase.from("depoimentos").insert([{
      oficial_nome: depoimentoForm.oficial_nome,
      oficial_patente: depoimentoForm.oficial_patente || null,
      oficial_re: depoimentoForm.oficial_re || null,
      depoimento: depoimentoForm.depoimento,
      data_depoimento: depoimentoForm.data_depoimento,
      oficial_batalhao: depoimentoForm.oficial_batalhao || null,
      relatorio_id_ip: depoimentoForm.relatorio_id_ip && depoimentoForm.relatorio_id_ip !== "none" ? depoimentoForm.relatorio_id_ip : null,
      relatorio_id_ato: depoimentoForm.relatorio_id_ato && depoimentoForm.relatorio_id_ato !== "none" ? depoimentoForm.relatorio_id_ato : null,
      investigacao_id: depoimentoForm.investigacao_id && depoimentoForm.investigacao_id !== "none" ? depoimentoForm.investigacao_id : null
    }]).select();

    setSubmittingDepoimento(false);
    if (error || !data) return toast.error("Erro ao registrar depoimento: " + (error?.message || "Erro desconhecido"));

    toast.success("Depoimento registrado com sucesso!");
    setDepoimentos(prev => [data[0] as Depoimento, ...prev]);
    setIsDepoimentoDialogOpen(false);
    setDepoimentoForm({
      oficial_nome: "",
      oficial_patente: "",
      oficial_re: "",
      depoimento: "",
      data_depoimento: format(new Date(), "yyyy-MM-dd"),
      oficial_batalhao: "",
      relatorio_id_ip: "",
      relatorio_id_ato: "",
      investigacao_id: ""
    });
  };

  const deleteDepoimento = async (id: string) => {
    const { error } = await supabase.from("depoimentos").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir depoimento");
    setDepoimentos(prev => prev.filter(d => d.id !== id));
    toast.success("Depoimento excluído");
  };

  const submitInvestigacao = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = investigacaoForm.titulo || `${investigacaoForm.tipo_procedimento} - ${investigacaoForm.investigado || 'Sem Nome'}`;
    
    if (!investigacaoForm.descricao) {
      return toast.error("Preencha a descrição dos fatos");
    }
    setSubmitting(true);
    const { data, error } = await supabase.from("investigacoes").insert([{
      titulo: finalTitle,
      descricao: investigacaoForm.descricao,
      investigado: investigacaoForm.investigado,
      status: investigacaoForm.status,
      
      tipo_procedimento: investigacaoForm.tipo_procedimento,
      autoridade_responsavel: investigacaoForm.autoridade_responsavel,
      autoridade_patente: investigacaoForm.autoridade_patente,
      autoridade_departamento: investigacaoForm.autoridade_departamento,
      investigado_badge: investigacaoForm.investigado_badge,
      investigado_patente: investigacaoForm.investigado_patente,
      investigado_unidade: investigacaoForm.investigado_unidade,
      origem_caso: investigacaoForm.origem_caso,
      origem_outro: investigacaoForm.origem_outro,
      fundamentacao: investigacaoForm.fundamentacao,
      medidas_iniciais: investigacaoForm.medidas_iniciais,
      medidas_outro: investigacaoForm.medidas_outro,
      detalhes_adicionais: investigacaoForm.detalhes_adicionais
    }]).select();

    setSubmitting(false);
    if (error || !data) {
      setSubmitting(false);
      return toast.error("Erro ao iniciar investigação: " + (error?.message || "Erro desconhecido"));
    }

    const newInvId = data[0].id;

    // Vincular denúncia se selecionada
    if (investigacaoForm.denuncia_id) {
      await supabase.from("denuncia_investigacao").insert({
        denuncia_id: investigacaoForm.denuncia_id,
        investigacao_id: newInvId
      });
      setDenunciaInvestigacoes(prev => [...prev, { denuncia_id: investigacaoForm.denuncia_id, investigacao_id: newInvId }]);
    }

    // Vincular documentos se selecionados
    if (investigacaoForm.relatorio_id_ip && investigacaoForm.relatorio_id_ip !== "none") {
      await supabase.from("investigacao_relatorio").insert({
        investigacao_id: newInvId,
        relatorio_id: investigacaoForm.relatorio_id_ip
      });
      setInvestigacaoRelatorios(prev => [...prev, { investigacao_id: newInvId, relatorio_id: investigacaoForm.relatorio_id_ip }]);
    }
    
    if (investigacaoForm.relatorio_id_ato && investigacaoForm.relatorio_id_ato !== "none") {
      await supabase.from("investigacao_relatorio").insert({
        investigacao_id: newInvId,
        relatorio_id: investigacaoForm.relatorio_id_ato
      });
      setInvestigacaoRelatorios(prev => [...prev, { investigacao_id: newInvId, relatorio_id: investigacaoForm.relatorio_id_ato }]);
    }

    toast.success("Investigação iniciada com sucesso!");
    setInvestigacoes([data[0] as Investigacao, ...investigacoes]);
    setIsInvestigacaoDialogOpen(false);
    resetInvestigacaoForm();
  };

  const resetInvestigacaoForm = () => {
    setInvestigacaoForm({ 
      titulo: "", 
      descricao: "", 
      investigado: "", 
      status: "pendente" as Status, 
      denuncia_id: "", 
      relatorio_id_ip: "",
      relatorio_id_ato: "",
      tipo_procedimento: "Investigação Administrativa",
      autoridade_responsavel: user?.user_metadata?.full_name || "",
      autoridade_patente: "",
      autoridade_departamento: "Corregedoria Geral (PMESP)",
      investigado_badge: "",
      investigado_patente: "",
      investigado_unidade: "",
      origem_caso: "Denúncia de civil",
      origem_outro: "",
      fundamentacao: "",
      medidas_iniciais: [],
      medidas_outro: "",
      detalhes_adicionais: ""
    });
    setEditingInvestigacaoId(null);
  };

  const handleEditInvestigacao = (inv: Investigacao) => {
    setInvestigacaoForm({
      titulo: inv.titulo || "",
      descricao: inv.descricao || "",
      investigado: inv.investigado || "",
      status: inv.status || "pendente",
      denuncia_id: "", 
      relatorio_id_ip: "",
      relatorio_id_ato: "",
      tipo_procedimento: inv.tipo_procedimento || "Investigação Administrativa",
      autoridade_responsavel: inv.autoridade_responsavel || "",
      autoridade_patente: inv.autoridade_patente || "",
      autoridade_departamento: inv.autoridade_departamento || "Corregedoria Geral (PMESP)",
      investigado_badge: inv.investigado_badge || "",
      investigado_patente: inv.investigado_patente || "",
      investigado_unidade: inv.investigado_unidade || "",
      origem_caso: inv.origem_caso || "Denúncia de civil",
      origem_outro: inv.origem_outro || "",
      fundamentacao: inv.fundamentacao || "",
      medidas_iniciais: inv.medidas_iniciais || [],
      medidas_outro: inv.medidas_outro || "",
      detalhes_adicionais: inv.detalhes_adicionais || ""
    });
    setEditingInvestigacaoId(inv.id);
    setIsInvestigacaoEditDialogOpen(true);
  };

  const updateInvestigacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestigacaoId) return;
    setSubmitting(true);
    
    const { error } = await supabase.from("investigacoes").update({
      titulo: investigacaoForm.titulo,
      descricao: investigacaoForm.descricao,
      investigado: investigacaoForm.investigado,
      status: investigacaoForm.status,
      tipo_procedimento: investigacaoForm.tipo_procedimento,
      autoridade_responsavel: investigacaoForm.autoridade_responsavel,
      autoridade_patente: investigacaoForm.autoridade_patente,
      investigado_badge: investigacaoForm.investigado_badge,
      investigado_patente: investigacaoForm.investigado_patente,
      investigado_unidade: investigacaoForm.investigado_unidade,
      origem_caso: investigacaoForm.origem_caso,
      origem_outro: investigacaoForm.origem_outro,
      fundamentacao: investigacaoForm.fundamentacao,
      medidas_iniciais: investigacaoForm.medidas_iniciais,
      medidas_outro: investigacaoForm.medidas_outro,
      detalhes_adicionais: investigacaoForm.detalhes_adicionais
    }).eq("id", editingInvestigacaoId);

    setSubmitting(false);
    if (error) return toast.error("Erro ao atualizar investigação");

    setInvestigacoes(prev => prev.map(i => i.id === editingInvestigacaoId ? { 
      ...i, 
      ...investigacaoForm
    } : i));

    toast.success("Investigação atualizada!");
    setIsInvestigacaoEditDialogOpen(false);
    resetInvestigacaoForm();
  };

  const approveDocumento = async (id: string) => {
    const { error } = await supabase.from("relatorios").update({ status: "concluida" }).eq("id", id);
    if (error) return toast.error("Erro ao finalizar documento");
    setRelatorios(prev => prev.map(r => r.id === id ? { ...r, status: "concluida" } : r));
    toast.success("Documento finalizado!");
  };

  const updateRelatorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRelatorioId) return;
    setSubmitting(true);
    const { error } = await supabase.from("relatorios").update({
      titulo: relatorioForm.titulo,
      tipo_denuncia: relatorioForm.tipo_denuncia,
      oficial: relatorioForm.oficial,
      conteudo: relatorioForm.conteudo,
      status: relatorioForm.status,
      dados_detalhados: relatorioForm.dados_detalhados
    }).eq("id", editingRelatorioId);

    setSubmitting(false);
    if (error) return toast.error("Erro ao atualizar documento");

    setRelatorios(prev => prev.map(r => r.id === editingRelatorioId ? { 
      ...r, 
      titulo: relatorioForm.titulo,
      tipo_denuncia: relatorioForm.tipo_denuncia,
      oficial: relatorioForm.oficial,
      conteudo: relatorioForm.conteudo,
      status: relatorioForm.status,
      dados_detalhados: relatorioForm.dados_detalhados
    } : r));

    toast.success("Documento atualizado!");
    setIsEditDialogOpen(false);
    setEditingRelatorioId(null);
    setRelatorioForm({ 
      titulo: "", 
      tipo_denuncia: "Inquérito Policial", 
      oficial: user?.user_metadata?.full_name || "", 
      conteudo: "", 
      denuncia_id: "",
      investigacao_id: "",
      investigacao_ids: [],
      status: "pendente",
      dados_detalhados: {
        data_abertura: format(new Date(), "yyyy-MM-dd"),
        numero_caso: "",
        corregedor_patente: "",
        data_recebimento: "",
        reclamante_nome: "",
        reclamante_id: "",
        reclamante_telefone: "",
        reclamante_discord: "",
        reclamante_anonimo: "Não",
        denunciado_nome: "",
        denunciado_patente: "",
        denunciado_badge: "",
        denunciado_unidade: "",
        denunciado_viatura: "",
        tipo_denuncia_selecionado: "",
        tipo_denuncia_outro: "",
        incidente_data: "",
        incidente_horario: "",
        incidente_local: "",
        incidente_testemunhas: "Não",
        incidente_testemunhas_nomes: "",
        incidente_testemunhas_contatos: "",
        provas_selecionadas: [],
        provas_outro: "",
        provas_descricao: "",
        ato_id_vinculado: "",
        ip_id_vinculado: "",
        depoimento_ids: [],
        ato_numero_inquerito: "",
        ato_numero: "",
        ato_data_emissao: format(new Date(), "yyyy-MM-dd"),
        ato_tipo: "",
        ato_tipo_outro: "",
        ato_autoridade_nome: "",
        ato_autoridade_cargo: "",
        ato_autoridade_unidade: "Corregedoria Geral (PMESP)",
        ato_objeto_descricao: "",
        ato_fundamentacao_selecionada: [],
        ato_fundamentacao_complementar: "",
        ato_decisao: "",
        ato_medidas_selecionadas: [],
        ato_medidas_detalhamento: ""
      }
    });
  };

  const deleteDocumento = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento permanentemente?")) return;
    const { error } = await supabase.from("relatorios").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir documento");
    setRelatorios(prev => prev.filter(r => r.id !== id));
    toast.success("Documento excluído com sucesso");
  };

  const deleteInvestigacao = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta investigação e todos os seus vínculos?")) return;
    const { error } = await supabase.from("investigacoes").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir investigação");
    setInvestigacoes(prev => prev.filter(i => i.id !== id));
    toast.success("Investigação excluída com sucesso");
  };

  const handleLinkRelatorio = async (denunciaId: string) => {
    if (!linkRelatorioId) return toast.error("Selecione um documento");
    setLinking(true);
    const { error } = await supabase.from("denuncia_relatorio").insert({
      denuncia_id: denunciaId,
      relatorio_id: linkRelatorioId
    });
    setLinking(false);
    
    if (error) {
      toast.error("Erro ao vincular");
    } else {
      toast.success("Documento anexado à ocorrência!");
      setDenunciaRelatorios([...denunciaRelatorios, { denuncia_id: denunciaId, relatorio_id: linkRelatorioId }]);
      setLinkRelatorioId("");
    }
  };

  const handleLinkInvestigacaoRelatorio = async (investigacaoId: string) => {
    if (!linkRelatorioId) return toast.error("Selecione um documento");
    setLinking(true);
    const { error } = await supabase.from("investigacao_relatorio").insert({
      investigacao_id: investigacaoId,
      relatorio_id: linkRelatorioId
    });
    setLinking(false);
    
    if (error) {
      toast.error("Erro ao vincular");
    } else {
      toast.success("Documento anexado à investigação!");
      setInvestigacaoRelatorios([...investigacaoRelatorios, { investigacao_id: investigacaoId, relatorio_id: linkRelatorioId }]);
      setLinkRelatorioId("");
    }
  };

  const handleLinkDenuncia = async (relatorioId: string) => {
    if (!linkDenunciaId) return toast.error("Selecione uma denúncia");
    setLinking(true);
    const { error } = await supabase.from("denuncia_relatorio").insert({
      denuncia_id: linkDenunciaId,
      relatorio_id: relatorioId
    });
    setLinking(false);
    
    if (error) {
      toast.error("Erro ao vincular");
    } else {
      toast.success("Denúncia anexada ao documento!");
      setDenunciaRelatorios([...denunciaRelatorios, { denuncia_id: linkDenunciaId, relatorio_id: relatorioId }]);
      setLinkDenunciaId("");
    }
  };

  const handleLinkInvestigacao = async (relatorioId: string) => {
    if (!linkInvestigacaoId) return toast.error("Selecione uma investigação");
    setLinking(true);
    const { error } = await supabase.from("investigacao_relatorio").insert({
      investigacao_id: linkInvestigacaoId,
      relatorio_id: relatorioId
    });
    setLinking(false);
    
    if (error) {
      toast.error("Erro ao vincular");
    } else {
      toast.success("Investigação anexada ao documento!");
      setInvestigacaoRelatorios([...investigacaoRelatorios, { investigacao_id: linkInvestigacaoId, relatorio_id: relatorioId }]);
      setLinkInvestigacaoId("");
    }
  };

  const deleteOficial = async (userId: string) => {
    if (!confirm("Tem certeza que deseja REMOVER o acesso deste oficial permanentemente?")) return;
    
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
    
    if (error) {
      console.error("Erro ao remover oficial:", error);
      toast.error("Erro ao remover acesso");
    } else {
      toast.success("Acesso removido com sucesso");
      setOficiais(prev => prev.filter(o => o.id !== userId));
    }
  };

  const changeUserRole = async (userId: string, newRole: "corregedor" | "admin") => {
    const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId);
    
    if (error) {
      console.error("Erro ao mudar cargo:", error);
      toast.error("Erro ao mudar cargo");
    } else {
      toast.success(`Cargo atualizado para ${newRole === "admin" ? "Administrador" : "Corregedor"}`);
      setOficiais(prev => prev.map(o => o.id === userId ? { ...o, role: newRole } : o));
    }
  };

  const updatePatente = async (id: string, novaPatente: string) => {
    const { error } = await supabase.from("profiles").update({ patente: novaPatente }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar patente");
    setOficiais(prev => prev.map(p => p.id === id ? { ...p, patente: novaPatente } : p));
    toast.success("Patente atualizada com sucesso!");
  };

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!isCorregedor && roles.includes("pending")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-muted-foreground">
        <div className="max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
          <Shield className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-6 text-2xl font-bold uppercase tracking-widest text-foreground">
            Acesso Pendente
          </h1>
          <p className="mt-4 text-muted-foreground">
            Sua conta de oficial está aguardando aprovação administrativa para acessar o terminal seguro.
          </p>
          <Button onClick={handleLogout} variant="outline" className="mt-8 border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground">
            Voltar para o Login
          </Button>
        </div>
      </div>
    );
  }

  // Se não for corregedor e não for pendente, e também não for cidadão (ainda carregando ou erro), mostra loader ou redireciona
  if (!isCorregedor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-mono">
      {/* SIDEBAR */}
      <aside className="flex w-64 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
            <Shield className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">MDT Policial</h1>
            <p className="text-[10px] text-muted-foreground tracking-widest">SECURE TERMINAL</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 mt-4">Operações</p>
          
          <SidebarItem 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
            icon={LayoutDashboard} 
            label="Dashboard" 
          />
          <SidebarItem 
            active={activeTab === "denuncias"} 
            onClick={() => setActiveTab("denuncias")} 
            icon={Activity} 
            label="Denúncias" 
          />
          <SidebarItem 
            active={activeTab === "investigacoes"} 
            onClick={() => setActiveTab("investigacoes")} 
            icon={Shield} 
            label="Investigações" 
          />
          <SidebarItem 
            active={activeTab === "inqueritos"} 
            onClick={() => setActiveTab("inqueritos")} 
            icon={FileSignature} 
            label="Inquéritos" 
          />
          <SidebarItem 
            active={activeTab === "atos"} 
            onClick={() => setActiveTab("atos")} 
            icon={FileText} 
            label="Atos Adm." 
          />
          <SidebarItem 
            active={activeTab === "depoimentos"} 
            onClick={() => setActiveTab("depoimentos")} 
            icon={MessageSquare} 
            label="Depoimentos" 
          />
          <SidebarItem 
            active={activeTab === "oficiais"} 
            onClick={() => setActiveTab("oficiais")} 
            icon={Users} 
            label="Oficiais" 
          />

          {isAdmin && (
            <>
              <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 mt-8">Administrativo</p>
              <SidebarItem 
                active={activeTab === "solicitacoes"} 
                onClick={() => setActiveTab("solicitacoes")} 
                icon={UserPlus} 
                label="Solicitações" 
                badge={pendingUsers.length > 0 ? pendingUsers.length : undefined}
              />
            </>
          )}
        </nav>

        <div className="border-t border-border p-4">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Desconectar
          </button>
          <div className="mt-4 px-4 text-[10px] text-muted-foreground">
            MDT v1.0 · CONFIDENCIAL
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header / Top Bar */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-border bg-card/80 px-8 backdrop-blur-sm z-10">
          <div className="flex flex-col">
            <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Sistema Operacional</span>
            <h2 className="text-2xl font-bold uppercase tracking-wider text-foreground">
              Bem-Vindo, {user?.user_metadata?.full_name || "Oficial"}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-foreground">{user?.user_metadata?.full_name}</div>
            <div className="text-xs text-muted-foreground">Badge #{user?.user_metadata?.badge_number || "000"}</div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                  <StatCard 
                  title="Total de Denúncias" 
                  value={denuncias.length.toString()} 
                  icon={Activity} 
                  color="text-foreground" 
                />
                <StatCard 
                  title="Investigações Ativas" 
                  value={investigacoes.filter(i => i.status !== "concluida" && i.status !== "arquivada").length.toString()} 
                  icon={Shield} 
                  color="text-muted-foreground" 
                />
                <StatCard 
                  title="Inquéritos Policiais" 
                  value={relatorios.filter(r => r.tipo_denuncia === "Inquérito Policial").length.toString()} 
                  icon={FileSignature} 
                  color="text-foreground" 
                />
                <StatCard 
                  title="Atos Administrativos" 
                  value={relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo").length.toString()} 
                  icon={FileText} 
                  color="text-emerald-600" 
                />
                <StatCard 
                  title="Aguardando Revisão" 
                  value={relatorios.filter(r => r.status === "pendente").length.toString()} 
                  icon={Shield} 
                  color="text-muted-foreground" 
                />
              </div>

              {/* Recent Records */}
              <div>
                <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground">
                  <Shield className="h-4 w-4" />
                  Registros Recentes
                </div>
                <div className="space-y-3">
                  {[...denuncias]
                    .filter(d => d.status === "pendente")
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((item) => {
                      return (
                          <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-border bg-card p-5">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold uppercase text-foreground tracking-wide">
                                Denúncia #{item.numero_registro?.toString().padStart(4, '0')} - {item.titulo}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.created_at), "dd/MM/yy HH:mm")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Status: {item.status.toUpperCase()}
                            </p>
                          </div>
                        );
                      })}
                    {denuncias.filter(d => d.status === "pendente").length === 0 && (
                      <div className="rounded-lg border border-border border-dashed bg-card/50 p-8 text-center text-muted-foreground">
                        Nenhuma denúncia pendente no momento.
                      </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DENUNCIAS TAB (OCORRÊNCIAS) */}
          {activeTab === "denuncias" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-4 border-b border-border pb-4">
                <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Registro de Denúncias</h3>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2">Filtro:</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className={`font-mono text-xs h-8 ${denunciaFilter === "todas" ? "bg-slate-700 text-white border-slate-600" : "bg-transparent text-muted-foreground border-border hover:text-foreground"}`}
                    onClick={() => setDenunciaFilter("todas")}
                  >
                    TODAS
                  </Button>
                  {(Object.keys(STATUS_LABEL) as Status[]).map((status) => (
                    <Button 
                      key={status}
                      size="sm" 
                      variant="outline"
                      className={`font-mono text-xs h-8 ${denunciaFilter === status ? STATUS_COLOR[status].split(" ")[0] + " text-foreground border-transparent" : "bg-transparent text-muted-foreground border-border hover:text-foreground"}`}
                      onClick={() => setDenunciaFilter(status)}
                    >
                      {STATUS_LABEL[status].toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {denuncias.filter(d => denunciaFilter === "todas" || d.status === denunciaFilter).length === 0 ? (
                <div className="rounded-lg border border-border border-dashed bg-card/50 p-12 text-center text-muted-foreground">
                  Nenhuma denúncia encontrada com o status atual.
                </div>
              ) : (
                <div className="space-y-4">
                  {denuncias
                    .filter(d => denunciaFilter === "todas" || d.status === denunciaFilter)
                    .map((d) => {
                    const expanded = expandedId === d.id;
                    const linkedRelatorios = denunciaRelatorios
                      .filter(dr => dr.denuncia_id === d.id)
                      .map(dr => relatorios.find(r => r.id === dr.relatorio_id))
                      .filter(Boolean) as Relatorio[];
                      
                    const availableRelatorios = relatorios.filter(
                      r => !denunciaRelatorios.some(dr => dr.denuncia_id === d.id && dr.relatorio_id === r.id)
                    );

                    return (
                      <div key={d.id} className="rounded-lg border border-border bg-card overflow-hidden">
                        <button
                          onClick={() => setExpandedId(expanded ? null : d.id)}
                          className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-muted"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <Badge variant="outline" className="bg-muted border-border text-foreground font-mono">
                                #{d.numero_registro?.toString().padStart(4, '0')}
                              </Badge>
                              <h3 className="font-bold uppercase text-foreground tracking-wide">
                                {d.titulo}
                              </h3>
                              <Badge variant="outline" className={`font-mono text-xs ${STATUS_COLOR[d.status]}`}>
                                {STATUS_LABEL[d.status]}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(d.created_at), "dd/MM/yyyy 'às' HH:mm")}
                              {d.policial_denunciado && ` · Acusado: ${d.policial_denunciado}`}
                            </p>
                          </div>
                        </button>

                        {expanded && (
                          <div className="space-y-6 border-t border-border bg-muted/50 p-6">
                            
                            {/* Anexos de Relatório */}
                            <div className="rounded border border-border bg-muted p-4">
                              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                <LinkIcon className="h-4 w-4" /> Documentos Anexados
                              </div>
                              
                               {linkedRelatorios.length > 0 ? (
                                 <div className="space-y-2 mb-4">
                                   {linkedRelatorios.map(r => (
                                     <div key={r.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                       <div className="flex items-center gap-3">
                                         {r.tipo_denuncia === "Inquérito Policial" ? (
                                           <FileSignature className="h-4 w-4 text-foreground" />
                                         ) : (
                                           <FileText className="h-4 w-4 text-emerald-400" />
                                         )}
                                         <span className="text-foreground font-bold">{r.titulo}</span>
                                         <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">
                                           {r.tipo_denuncia}
                                         </Badge>
                                       </div>
                                       <Button 
                                         size="sm" 
                                         variant="ghost" 
                                         className="h-7 text-xs text-foreground hover:text-foreground hover:bg-muted/50"
                                         onClick={() => {
                                           setActiveTab(r.tipo_denuncia === "Inquérito Policial" ? "inqueritos" : "atos");
                                           setExpandedId(r.id);
                                         }}
                                       >
                                         Ver Documento
                                       </Button>
                                     </div>
                                   ))}
                                 </div>
                              ) : (
                                <p className="text-xs text-muted-foreground mb-4">Nenhum documento anexado a esta denúncia.</p>
                              )}

                              <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                  <Select value={linkRelatorioId} onValueChange={setLinkRelatorioId}>
                                    <SelectTrigger className="bg-muted border-border text-foreground text-xs">
                                      <SelectValue placeholder="Selecione um documento para vincular..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-muted border-border text-foreground">
                                      {availableRelatorios.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.titulo} - {r.oficial}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleLinkRelatorio(d.id)}
                                  disabled={linking || !linkRelatorioId}
                                  className="bg-zinc-800 hover:bg-slate-700 text-white"
                                >
                                  {linking ? "Vinculando..." : "Vincular"}
                                </Button>
                              </div>
                            </div>

                            {/* DADOS DETALHADOS (SE EXISTIREM) */}
                            {d.dados_detalhados && (
                              <div className="mt-4 space-y-4 animate-in fade-in duration-500">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="border-l-2 border-blue-500 pl-3 bg-muted/50 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">1. DADOS DO DENUNCIANTE</h4>
                                    <p className="text-xs text-muted-foreground">Nome: <span className="text-foreground">{d.dados_detalhados.reclamante_nome}</span></p>
                                    <p className="text-xs text-muted-foreground">ID: <span className="text-foreground">{d.dados_detalhados.reclamante_id}</span></p>
                                    <p className="text-xs text-muted-foreground">Contato: <span className="text-foreground">{d.dados_detalhados.reclamante_contato}</span></p>
                                    <p className="text-xs text-muted-foreground">Anônimo: <span className="text-foreground">{d.dados_detalhados.reclamante_anonimo}</span></p>
                                  </div>
                                  <div className="border-l-2 border-red-500 pl-3 bg-red-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">2. DADOS DO POLICIAL</h4>
                                    <p className="text-xs text-muted-foreground">Nome: <span className="text-foreground">{d.dados_detalhados.denunciado_nome}</span></p>
                                    <p className="text-xs text-muted-foreground">Patente: <span className="text-foreground">{d.dados_detalhados.denunciado_patente}</span></p>
                                    <p className="text-xs text-muted-foreground">Badge: <span className="text-foreground">{d.dados_detalhados.denunciado_badge}</span></p>
                                  </div>
                                </div>

                                <div className="border-l-2 border-amber-500 pl-3 bg-muted/50 py-2">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">3. TIPOS DE VIOLAÇÃO</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {(d.dados_detalhados.tipo_denuncia || d.dados_detalhados.tipo_denuncia)?.map((t: string) => (
                                      <Badge key={t} variant="outline" className="text-[9px] bg-muted/50 border-border text-foreground uppercase">{t}</Badge>
                                    ))}
                                    {(d.dados_detalhados.tipo_denuncia_outro || d.dados_detalhados.tipo_denuncia_outro) && (
                                      <Badge variant="outline" className="text-[9px] bg-zinc-800 text-muted-foreground">
                                        {d.dados_detalhados.tipo_denuncia_outro || d.dados_detalhados.tipo_denuncia_outro}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="border-l-2 border-indigo-500 pl-3 bg-muted/50 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">4. INF. OCORRIDO</h4>
                                    <p className="text-xs text-muted-foreground">Data: <span className="text-foreground">{d.dados_detalhados.incidente_data}</span></p>
                                    <p className="text-xs text-muted-foreground">Hora: <span className="text-foreground">{d.dados_detalhados.incidente_horario}</span></p>
                                    <p className="text-xs text-muted-foreground">Local: <span className="text-foreground">{d.dados_detalhados.incidente_local}</span></p>
                                  </div>
                                  <div className="border-l-2 border-emerald-500 pl-3 bg-emerald-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">6. TESTEMUNHAS</h4>
                                    <p className="text-xs text-muted-foreground">Presença: <span className="text-foreground">{d.dados_detalhados.testemunhas_tem}</span></p>
                                    {d.dados_detalhados.testemunhas_nomes && <p className="text-xs text-muted-foreground">Nomes: <span className="text-foreground">{d.dados_detalhados.testemunhas_nomes}</span></p>}
                                  </div>
                                </div>

                                {/* 5. RELATO DOS FATOS */}
                                {d.dados_detalhados.relato_fatos && (
                                  <div className="border-l-2 border-amber-500 pl-3 bg-amber-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">5. RELATO DOS FATOS</h4>
                                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{d.dados_detalhados.relato_fatos}</p>
                                  </div>
                                )}

                                <div className="border-l-2 border-purple-500 pl-3 bg-purple-500/5 py-2">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-2">7. PROVAS E EVIDÊNCIAS</h4>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {d.dados_detalhados.provas_selecionadas?.map((p: string) => (
                                      <Badge key={p} variant="outline" className="text-[9px] bg-purple-500/10 border-purple-500/30 text-purple-400 uppercase">{p}</Badge>
                                    ))}
                                    {d.dados_detalhados.provas_outro && <Badge variant="outline" className="text-[9px] bg-zinc-800 text-muted-foreground">{d.dados_detalhados.provas_outro}</Badge>}
                                  </div>
                                  {d.dados_detalhados.provas_descricao && (
                                    <p className="text-xs text-muted-foreground italic bg-muted p-2 rounded border border-purple-500/10 whitespace-pre-wrap">{d.dados_detalhados.provas_descricao}</p>
                                  )}
                                </div>

                                <div className="border-l-2 border-red-800 pl-3 bg-red-950/10 py-2">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-1">8. ASSINATURA DIGITAL</h4>
                                  <p className="text-sm font-serif italic text-foreground">{d.dados_detalhados.declaracao_assinatura}</p>
                                </div>
                              </div>
                            )}

                             {/* FALLBACK PARA QUANDO NÃO HÁ DADOS DETALHADOS */}
                             {!d.dados_detalhados && (
                              <>
                                <Field label="Descrição">
                                  <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{d.descricao}</p>
                                </Field>
                                {d.data_ocorrido && (
                                  <Field label="Quando ocorreu">
                                    <p className="text-sm text-foreground">{d.data_ocorrido}</p>
                                  </Field>
                                )}
                                {d.contato_opcional && (
                                  <Field label="Contato do denunciante">
                                    <p className="text-sm text-foreground">{d.contato_opcional}</p>
                                  </Field>
                                )}
                              </>
                            )}

                            <div className="grid gap-6 md:grid-cols-2">
                              <Field label="Status da Denúncia">
                                <Select
                                  defaultValue={d.status}
                                  onValueChange={(v) => updateStatus(d.id, v as Status)}
                                >
                                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-muted border-border text-foreground">
                                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                                      <SelectItem key={s} value={s} className="hover:bg-zinc-800">{STATUS_LABEL[s]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </Field>
                            </div>

                            <Field label="Notas internas (Acesso Restrito)">
                              <Textarea
                                defaultValue={d.notas_internas ?? ""}
                                rows={4}
                                id={`notas-${d.id}`}
                                className="bg-background border-border text-foreground placeholder:text-slate-700"
                                placeholder="Observações da investigação..."
                              />
                              <Button
                                size="sm"
                                className="mt-3 bg-zinc-800 hover:bg-slate-700 text-white"
                                onClick={() => {
                                  const el = document.getElementById(`notas-${d.id}`) as HTMLTextAreaElement;
                                  updateNotas(d.id, el.value);
                                }}
                              >
                                Salvar notas do sistema
                              </Button>
                            </Field>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "investigacoes" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-4 border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Investigações Internas</h3>
                  
                  <Dialog open={isInvestigacaoDialogOpen || isInvestigacaoEditDialogOpen} onOpenChange={(open) => {
                     if (!open) resetInvestigacaoForm();
                     if (isInvestigacaoEditDialogOpen) setIsInvestigacaoEditDialogOpen(open);
                     else setIsInvestigacaoDialogOpen(open);
                   }}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setIsInvestigacaoDialogOpen(true)} className="bg-red-600 hover:bg-red-500 text-white font-bold tracking-wider uppercase text-xs">
                        <Plus className="h-4 w-4 mr-2" />
                        Iniciar Investigação
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground">
                      <DialogHeader>
                        <DialogTitle className="text-foreground uppercase tracking-wider">
                          {editingInvestigacaoId ? "Editar Investigação Interna" : "Nova Investigação Interna"}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={editingInvestigacaoId ? updateInvestigacao : submitInvestigacao} className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                        {/* 1. IDENTIFICAÇÃO DO PROCEDIMENTO */}
                        <div className="space-y-4 border-l-2 border-red-600 pl-4 bg-red-500/5 py-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-red-500">1. IDENTIFICAÇÃO DO PROCEDIMENTO</h4>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-[10px] uppercase">Título da Investigação (Opcional)</Label>
                            <Input 
                              value={investigacaoForm.titulo} 
                              onChange={(e) => setInvestigacaoForm({...investigacaoForm, titulo: e.target.value})}
                              placeholder="Ex: Operação Limpeza"
                              className="bg-background border-border text-foreground h-8 text-xs" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-[10px] uppercase">Número do Inquérito</Label>
                              <Input disabled value="AUTO-GERADO" className="bg-background border-border text-muted-foreground h-8 text-xs" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-[10px] uppercase">Data de Abertura</Label>
                              <Input disabled value={format(new Date(), "dd/MM/yyyy")} className="bg-background border-border text-muted-foreground h-8 text-xs" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-[10px] uppercase">Tipo de Procedimento</Label>
                            <RadioGroup 
                              value={investigacaoForm.tipo_procedimento} 
                              onValueChange={(v) => setInvestigacaoForm({...investigacaoForm, tipo_procedimento: v})}
                              className="flex flex-col gap-2"
                            >
                              {["Investigação Administrativa", "Investigação Disciplinar", "Investigação Criminal Interna"].map(tipo => (
                                <div key={tipo} className="flex items-center space-x-2">
                                  <RadioGroupItem value={tipo} id={tipo} className="border-border text-red-600" />
                                  <Label htmlFor={tipo} className="text-xs text-foreground font-normal">{tipo}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        </div>

                        {/* 2. AUTORIDADE RESPONSÁVEL */}
                        <div className="space-y-4 border-l-2 border-zinc-500 pl-4 bg-muted/50 py-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">2. AUTORIDADE RESPONSÁVEL</h4>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-[10px] uppercase">Corregedor / Investigador Responsável</Label>
                            <Input 
                              value={investigacaoForm.autoridade_responsavel} 
                              onChange={(e) => setInvestigacaoForm({...investigacaoForm, autoridade_responsavel: e.target.value})}
                              className="bg-background border-border text-foreground h-8 text-xs" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-[10px] uppercase">Patente</Label>
                              <Input 
                                value={investigacaoForm.autoridade_patente} 
                                onChange={(e) => setInvestigacaoForm({...investigacaoForm, autoridade_patente: e.target.value})}
                                className="bg-background border-border text-foreground h-8 text-xs" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-[10px] uppercase">Departamento</Label>
                              <Input disabled value="Corregedoria Geral (PMESP)" className="bg-background border-border text-muted-foreground h-8 text-xs" />
                            </div>
                          </div>
                        </div>

                        {/* 3. IDENTIFICAÇÃO DO POLICIAL INVESTIGADO */}
                        <div className="space-y-4 border-l-2 border-slate-600 pl-4 bg-slate-500/5 py-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">3. IDENTIFICAÇÃO DO POLICIAL INVESTIGADO</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-[10px] uppercase">Nome do Policial</Label>
                              <Input 
                                value={investigacaoForm.investigado} 
                                onChange={(e) => setInvestigacaoForm({...investigacaoForm, investigado: e.target.value})}
                                className="bg-background border-border text-foreground h-8 text-xs" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-[10px] uppercase">Badge Number</Label>
                              <Input 
                                value={investigacaoForm.investigado_badge} 
                                onChange={(e) => setInvestigacaoForm({...investigacaoForm, investigado_badge: e.target.value})}
                                className="bg-background border-border text-foreground h-8 text-xs" 
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-[10px] uppercase">Patente/Cargo</Label>
                              <Input 
                                value={investigacaoForm.investigado_patente} 
                                onChange={(e) => setInvestigacaoForm({...investigacaoForm, investigado_patente: e.target.value})}
                                className="bg-background border-border text-foreground h-8 text-xs" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-[10px] uppercase">Divisão/Unidade</Label>
                              <Input 
                                value={investigacaoForm.investigado_unidade} 
                                onChange={(e) => setInvestigacaoForm({...investigacaoForm, investigado_unidade: e.target.value})}
                                className="bg-background border-border text-foreground h-8 text-xs" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* 4. ORIGEM DA INVESTIGAÇÃO */}
                        <div className="space-y-4 border-l-2 border-zinc-600 pl-4 bg-muted/50 py-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">4. ORIGEM DA INVESTIGAÇÃO</h4>
                          <RadioGroup 
                            value={investigacaoForm.origem_caso} 
                            onValueChange={(v) => setInvestigacaoForm({...investigacaoForm, origem_caso: v})}
                            className="flex flex-col gap-2"
                          >
                            {["Denúncia de civil", "Denúncia interna", "Auditoria interna", "Supervisão superior", "Análise de bodycam / evidências", "Outro"].map(origem => (
                              <div key={origem} className="flex items-center space-x-2">
                                <RadioGroupItem value={origem} id={`origem-${origem}`} className="border-border text-amber-600" />
                                <Label htmlFor={`origem-${origem}`} className="text-xs text-foreground font-normal">{origem}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                          {investigacaoForm.origem_caso === "Outro" && (
                            <Input 
                              placeholder="Especifique a origem..." 
                              value={investigacaoForm.origem_outro}
                              onChange={(e) => setInvestigacaoForm({...investigacaoForm, origem_outro: e.target.value})}
                              className="bg-background border-border text-foreground h-8 text-xs" 
                            />
                          )}
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-[10px] uppercase">Vincular Denúncia</Label>
                              <Select value={investigacaoForm.denuncia_id} onValueChange={(v) => setInvestigacaoForm({...investigacaoForm, denuncia_id: v})}>
                                <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="bg-muted border-border text-foreground">
                                  {denuncias.map(d => <SelectItem key={d.id} value={d.id}>#{d.numero_registro} - {d.titulo}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-[10px] uppercase">Vincular Inquérito (Opcional)</Label>
                              <Select value={investigacaoForm.relatorio_id_ip} onValueChange={(v) => setInvestigacaoForm({...investigacaoForm, relatorio_id_ip: v})}>
                                <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="bg-muted border-border text-foreground">
                                  <SelectItem value="none" className="text-muted-foreground italic">Nenhum</SelectItem>
                                  {relatorios.filter(r => r.tipo_denuncia === "Inquérito Policial").map(r => <SelectItem key={r.id} value={r.id}>{r.titulo}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-[10px] uppercase">Vincular Ato Adm. (Opcional)</Label>
                              <Select value={investigacaoForm.relatorio_id_ato} onValueChange={(v) => setInvestigacaoForm({...investigacaoForm, relatorio_id_ato: v})}>
                                <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="bg-muted border-border text-foreground">
                                  <SelectItem value="none" className="text-muted-foreground italic">Nenhum</SelectItem>
                                  {relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo").map(r => <SelectItem key={r.id} value={r.id}>{r.titulo}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* 5. DESCRIÇÃO SUMÁRIA DOS FATOS */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">5. DESCRIÇÃO SUMÁRIA DOS FATOS</Label>
                          <Textarea 
                            rows={4} 
                            value={investigacaoForm.descricao}
                            onChange={(e) => setInvestigacaoForm({...investigacaoForm, descricao: e.target.value})}
                            className="bg-background border-border text-foreground text-xs" 
                            placeholder="Descreva o que aconteceu..."
                          />
                        </div>

                        {/* 6. FUNDAMENTAÇÃO PARA ABERTURA */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">6. FUNDAMENTAÇÃO PARA ABERTURA</Label>
                          <Textarea 
                            rows={3} 
                            value={investigacaoForm.fundamentacao}
                            onChange={(e) => setInvestigacaoForm({...investigacaoForm, fundamentacao: e.target.value})}
                            className="bg-background border-border text-foreground text-xs" 
                            placeholder="Motivo que justifica a abertura..."
                          />
                        </div>

                        {/* 7. MEDIDAS INICIAIS ADOTADAS */}
                        <div className="space-y-4 border-l-2 border-emerald-600 pl-4 bg-emerald-500/5 py-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500">7. MEDIDAS INICIAIS ADOTADAS</h4>
                          <div className="grid grid-cols-2 gap-y-2">
                            {[
                              "Recolha de bodycam/dashcam", 
                              "Oitiva de testemunhas", 
                              "Notificação do policial investigado", 
                              "Afastamento preventivo", 
                              "Preservação de provas",
                              "Outro"
                            ].map(medida => (
                              <div key={medida} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`medida-${medida}`} 
                                  checked={investigacaoForm.medidas_iniciais.includes(medida)}
                                  onCheckedChange={(checked) => {
                                    const current = [...investigacaoForm.medidas_iniciais];
                                    if (checked) current.push(medida);
                                    else {
                                      const index = current.indexOf(medida);
                                      if (index > -1) current.splice(index, 1);
                                    }
                                    setInvestigacaoForm({...investigacaoForm, medidas_iniciais: current});
                                  }}
                                  className="border-border data-[state=checked]:bg-emerald-600" 
                                />
                                <Label htmlFor={`medida-${medida}`} className="text-xs text-foreground font-normal">{medida}</Label>
                              </div>
                            ))}
                          </div>
                          {investigacaoForm.medidas_iniciais.includes("Outro") && (
                            <Input 
                              placeholder="Especifique a medida..." 
                              value={investigacaoForm.medidas_outro}
                              onChange={(e) => setInvestigacaoForm({...investigacaoForm, medidas_outro: e.target.value})}
                              className="bg-background border-border text-foreground h-8 text-xs" 
                            />
                          )}
                          <div className="space-y-2 mt-2">
                            <Label className="text-[10px] text-muted-foreground uppercase">Detalhes adicionais</Label>
                            <Textarea 
                              rows={2} 
                              value={investigacaoForm.detalhes_adicionais}
                              onChange={(e) => setInvestigacaoForm({...investigacaoForm, detalhes_adicionais: e.target.value})}
                              className="bg-background border-border text-foreground text-xs" 
                            />
                          </div>
                        </div>

                        <div className="pt-4 flex justify-between items-center border-t border-border">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Status Inicial</Label>
                            <Select value={investigacaoForm.status} onValueChange={(v: Status) => setInvestigacaoForm({...investigacaoForm, status: v})}>
                              <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-muted border-border text-foreground">
                                {Object.entries(STATUS_LABEL).map(([val, lab]) => <SelectItem key={val} value={val}>{lab}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-500 text-white px-8">
                            {submitting ? "Gravando..." : (editingInvestigacaoId ? "ATUALIZAR INVESTIGAÇÃO" : "GRAVAR NO SISTEMA")}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2">Filtro:</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className={`font-mono text-xs h-8 ${investigacaoFilter === "todas" ? "bg-slate-700 text-white border-slate-600" : "bg-transparent text-muted-foreground border-border hover:text-foreground"}`}
                    onClick={() => setInvestigacaoFilter("todas")}
                  >
                    TODAS
                  </Button>
                  {(Object.keys(STATUS_LABEL) as Status[]).map((status) => (
                    <Button 
                      key={status}
                      size="sm" 
                      variant="outline"
                      className={`font-mono text-xs h-8 ${investigacaoFilter === status ? STATUS_COLOR[status].split(" ")[0] + " text-foreground border-transparent" : "bg-transparent text-muted-foreground border-border hover:text-foreground"}`}
                      onClick={() => setInvestigacaoFilter(status)}
                    >
                      {STATUS_LABEL[status].toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {investigacoes.filter(i => investigacaoFilter === "todas" || i.status === investigacaoFilter).length === 0 ? (
                <div className="rounded-lg border border-border border-dashed bg-card/50 p-12 text-center text-muted-foreground">
                  Nenhuma investigação encontrada com o status atual.
                </div>
              ) : (
                <div className="space-y-4">
                  {investigacoes
                    .filter(i => investigacaoFilter === "todas" || i.status === investigacaoFilter)
                    .map((inv) => {
                      const expanded = expandedId === inv.id;
                      const linkedRelatorios = investigacaoRelatorios
                        .filter(ir => ir.investigacao_id === inv.id)
                        .map(ir => relatorios.find(r => r.id === ir.relatorio_id))
                        .filter(Boolean) as Relatorio[];

                      const linkedDenuncias = denunciaInvestigacoes
                        .filter(di => di.investigacao_id === inv.id)
                        .map(di => denuncias.find(d => d.id === di.denuncia_id))
                        .filter(Boolean) as Denuncia[];

                      const availableRelatorios = relatorios.filter(
                        r => !investigacaoRelatorios.some(ir => ir.investigacao_id === inv.id && ir.relatorio_id === r.id)
                      );

                      return (
                        <div key={inv.id} className="rounded-lg border border-border bg-card overflow-hidden">
                          <button 
                            onClick={() => setExpandedId(expanded ? null : inv.id)}
                            className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-muted"
                          >
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-muted border-border text-foreground font-mono">
                                  #{inv.numero_registro.toString().padStart(4, '0')}
                                </Badge>
                                <h3 className="font-bold uppercase text-foreground tracking-wide">{inv.titulo}</h3>
                                <Badge variant="outline" className={`font-mono text-xs ${STATUS_COLOR[inv.status]}`}>
                                  {STATUS_LABEL[inv.status]}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(inv.created_at), "dd/MM/yyyy")} · Investigado: {inv.investigado || "Não informado"}
                              </p>
                            </div>
                             {isAdmin && (
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-foreground hover:text-foreground hover:bg-muted/50"
                                  onClick={() => handleEditInvestigacao(inv)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                  onClick={() => deleteInvestigacao(inv.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </button>

                          {expanded && (
                            <div className="space-y-6 border-t border-border bg-muted/50 p-6">
                              <div className="rounded border border-border bg-muted p-4">
                                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                  <LinkIcon className="h-4 w-4" /> Documentos Anexados
                                </div>
                                
                                {linkedRelatorios.length > 0 ? (
                                  <div className="space-y-2 mb-4">
                                    {linkedRelatorios.map(r => (
                                      <div key={r.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                        <div className="flex items-center gap-3">
                                          {r.tipo_denuncia === "Inquérito Policial" ? (
                                            <FileSignature className="h-4 w-4 text-foreground" />
                                          ) : (
                                            <FileText className="h-4 w-4 text-emerald-400" />
                                          )}
                                          <span className="text-foreground font-bold">{r.titulo}</span>
                                          <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">
                                            {r.tipo_denuncia}
                                          </Badge>
                                        </div>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="h-7 text-xs text-foreground"
                                          onClick={() => { 
                                            setActiveTab(r.tipo_denuncia === "Inquérito Policial" ? "inqueritos" : "atos"); 
                                            setExpandedId(r.id); 
                                          }}
                                        >
                                          Ver Documento
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground mb-4">Nenhum documento anexado.</p>
                                )}

                                <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <Select value={linkRelatorioId} onValueChange={setLinkRelatorioId}>
                                      <SelectTrigger className="bg-muted border-border text-foreground text-xs">
                                        <SelectValue placeholder="Selecione um documento..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-muted border-border text-foreground">
                                      {availableRelatorios.map(r => (
                                        <SelectItem key={r.id} value={r.id}>
                                          <div className="flex items-center justify-between w-full">
                                            <span>{r.titulo}</span>
                                            <span className="text-[9px] opacity-50 ml-2 uppercase">({r.tipo_denuncia})</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleLinkInvestigacaoRelatorio(inv.id)}
                                    disabled={linking || !linkRelatorioId}
                                    className="bg-zinc-800 text-white"
                                  >
                                    {linking ? "..." : "Vincular"}
                                  </Button>
                                </div>
                              </div>

                              <div className="rounded border border-border bg-muted p-4">
                                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                  <Activity className="h-4 w-4" /> Denúncias Vinculadas
                                </div>
                                
                                {linkedDenuncias.length > 0 ? (
                                  <div className="space-y-2 mb-4">
                                    {linkedDenuncias.map(d => (
                                      <div key={d.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                        <div className="flex items-center gap-3">
                                          <Badge variant="outline" className="bg-background border-border text-foreground font-mono text-[10px]">
                                            #{d.numero_registro?.toString().padStart(4, '0')}
                                          </Badge>
                                          <span className="text-foreground font-bold">{d.titulo}</span>
                                        </div>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="h-7 text-xs text-foreground"
                                          onClick={() => { setActiveTab("denuncias"); setExpandedId(d.id); }}
                                        >
                                          Ver Denúncia
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground mb-4">Nenhuma denúncia anexada.</p>
                                )}

                                <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <Select value={linkDenunciaId} onValueChange={setLinkDenunciaId}>
                                      <SelectTrigger className="bg-muted border-border text-foreground text-xs">
                                        <SelectValue placeholder="Vincular denúncia..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-muted border-border text-foreground">
                                        {denuncias.filter(d => !denunciaInvestigacoes.some(di => di.investigacao_id === inv.id && di.denuncia_id === d.id)).map(d => (
                                          <SelectItem key={d.id} value={d.id}>#{d.numero_registro?.toString().padStart(4, '0')} - {d.titulo}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      if (!linkDenunciaId) return toast.error("Selecione uma denúncia");
                                      setLinking(true);
                                      supabase.from("denuncia_investigacao").insert({
                                        denuncia_id: linkDenunciaId,
                                        investigacao_id: inv.id
                                      }).then(({ error }) => {
                                        setLinking(false);
                                        if (error) return toast.error("Erro ao vincular");
                                        setDenunciaInvestigacoes(prev => [...prev, { denuncia_id: linkDenunciaId, investigacao_id: inv.id }]);
                                        setLinkDenunciaId("");
                                        toast.success("Denúncia vinculada!");
                                      });
                                    }}
                                    disabled={linking || !linkDenunciaId}
                                    className="bg-zinc-800 text-white"
                                  >
                                    {linking ? "..." : "Vincular"}
                                  </Button>
                                </div>
                              </div>

                              <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                  <div className="border-l-2 border-red-600 pl-3 bg-red-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">1. PROCEDIMENTO</h4>
                                    <p className="text-xs text-muted-foreground">Tipo: <span className="text-foreground">{inv.tipo_procedimento}</span></p>
                                    <p className="text-xs text-muted-foreground">Abertura: <span className="text-foreground">{format(new Date(inv.created_at), "dd/MM/yyyy")}</span></p>
                                  </div>

                                  <div className="border-l-2 border-zinc-500 pl-3 bg-muted/50 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">2. AUTORIDADE</h4>
                                    <p className="text-xs text-muted-foreground">Resp: <span className="text-foreground">{inv.autoridade_responsavel}</span></p>
                                    <p className="text-xs text-muted-foreground">Patente: <span className="text-foreground">{inv.autoridade_patente}</span></p>
                                    <p className="text-xs text-muted-foreground">Dept: <span className="text-foreground">{inv.autoridade_departamento}</span></p>
                                  </div>

                                  <div className="border-l-2 border-slate-600 pl-3 bg-slate-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">3. INVESTIGADO</h4>
                                    <p className="text-xs text-muted-foreground">Nome: <span className="text-foreground">{inv.investigado}</span></p>
                                    <p className="text-xs text-muted-foreground">Badge: <span className="text-foreground">{inv.investigado_badge}</span></p>
                                    <p className="text-xs text-muted-foreground">Patente: <span className="text-foreground">{inv.investigado_patente}</span></p>
                                    <p className="text-xs text-muted-foreground">Unidade: <span className="text-foreground">{inv.investigado_unidade}</span></p>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="border-l-2 border-zinc-600 pl-3 bg-muted/50 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">4. ORIGEM</h4>
                                    <p className="text-xs text-muted-foreground">Caso: <span className="text-foreground">{inv.origem_caso === "Outro" ? inv.origem_outro : inv.origem_caso}</span></p>
                                  </div>

                                  <div className="border-l-2 border-emerald-600 pl-3 bg-emerald-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">7. MEDIDAS ADOTADAS</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {inv.medidas_iniciais?.map((m: string) => (
                                        <Badge key={m} variant="outline" className="text-[9px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400">{m}</Badge>
                                      ))}
                                      {inv.medidas_outro && <Badge variant="outline" className="text-[9px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400">{inv.medidas_outro}</Badge>}
                                    </div>
                                    {inv.detalhes_adicionais && (
                                      <p className="text-[10px] text-muted-foreground mt-2 italic">{inv.detalhes_adicionais}</p>
                                    )}
                                  </div>

                                  <Field label="Status da Investigação">
                                    <Select defaultValue={inv.status} onValueChange={(v) => updateInvestigacaoStatus(inv.id, v as Status)}>
                                      <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent className="bg-muted border-border text-foreground">
                                        {Object.entries(STATUS_LABEL).map(([s, l]) => (
                                          <SelectItem key={s} value={s}>{l}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </Field>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <Field label="5. DESCRIÇÃO SUMÁRIA DOS FATOS">
                                  <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed bg-muted p-3 rounded border border-border">{inv.descricao}</p>
                                </Field>

                                <Field label="6. FUNDAMENTAÇÃO PARA ABERTURA">
                                  <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed bg-muted p-3 rounded border border-border">{inv.fundamentacao}</p>
                                </Field>

                                <Field label="Notas da Corregedoria">
                                  <Textarea
                                    defaultValue={inv.notas_internas || ""}
                                    rows={4}
                                    id={`notas-inv-${inv.id}`}
                                    className="bg-background border-border text-foreground text-xs"
                                    placeholder="Anotações internas restritas..."
                                  />
                                  <Button
                                    size="sm"
                                    className="mt-3 bg-zinc-800 hover:bg-slate-700 text-white text-xs"
                                    onClick={() => {
                                      const el = document.getElementById(`notas-inv-${inv.id}`) as HTMLTextAreaElement;
                                      updateInvestigacaoNotas(inv.id, el.value);
                                    }}
                                  >
                                    Salvar Notas de Sistema
                                  </Button>
                                </Field>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* INQUÉRITOS POLICIAIS TAB */}
          {activeTab === "inqueritos" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-4 border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Inquéritos Policiais</h3>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setRelatorioForm({...relatorioForm, tipo_denuncia: "Inquérito Policial"})}
                        className="bg-zinc-700 hover:bg-blue-500 text-white font-bold tracking-wider uppercase text-xs"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Inquérito
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground">
                      <DialogHeader>
                        <div className="text-center pb-2 border-b border-border">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground mb-1">Corregedoria Geral (PMESP)</p>
                          <DialogTitle className="text-foreground uppercase tracking-wider text-sm">Formulário Oficial de Abertura de Inquérito</DialogTitle>
                        </div>
                      </DialogHeader>
                      <form onSubmit={submitRelatorio} className="space-y-4 mt-2">
                        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Título / Número do Caso</Label><Input className="bg-background border-border text-foreground h-8 text-xs" value={relatorioForm.titulo} onChange={(e) => setRelatorioForm({ ...relatorioForm, titulo: e.target.value })} placeholder="EX: IP-001/26" /></div>
                            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Status Inicial</Label><Select value={relatorioForm.status} onValueChange={(v: Status) => setRelatorioForm({ ...relatorioForm, status: v })}><SelectTrigger className="bg-background border-border text-foreground h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent className="bg-muted border-border text-foreground">{Object.entries(STATUS_LABEL).map(([val, lab]) => <SelectItem key={val} value={val}>{lab}</SelectItem>)}</SelectContent></Select></div>
                          </div>

                          {/* 0. DADOS DO CORREGEDOR */}
                          <div className="space-y-2 border-l-2 border-red-600 pl-4 bg-red-500/5 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500">0. Dados do Corregedor</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Número do Caso (IP-Nº)</Label><Input value={relatorioForm.dados_detalhados.numero_caso} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, numero_caso: e.target.value}})} placeholder="IP-Nº000" className="h-8 bg-background border-border text-foreground text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Data de Abertura</Label><Input value={relatorioForm.dados_detalhados.data_abertura} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, data_abertura: e.target.value}})} type="date" className="h-8 bg-background border-border text-foreground text-xs" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Corregedor Responsável</Label><Input value={relatorioForm.oficial} disabled className="h-8 bg-background border-border text-muted-foreground text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Patente do Corregedor</Label><Input value={relatorioForm.dados_detalhados.corregedor_patente} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, corregedor_patente: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                            </div>
                            <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Data de Recebimento</Label><Input value={relatorioForm.dados_detalhados.data_recebimento} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, data_recebimento: e.target.value}})} type="date" className="h-8 bg-background border-border text-foreground text-xs" /></div>
                          </div>

                          {/* 1. DADOS DO RECLAMANTE */}
                          <div className="space-y-2 border-l-2 border-zinc-500 pl-4 bg-muted/50 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">1. Dados do Reclamante / Denunciante</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Nome Completo</Label><Input value={relatorioForm.dados_detalhados.reclamante_nome} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_nome: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Número do ID</Label><Input value={relatorioForm.dados_detalhados.reclamante_id} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_id: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Telefone</Label><Input value={relatorioForm.dados_detalhados.reclamante_telefone} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_telefone: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Discord</Label><Input value={relatorioForm.dados_detalhados.reclamante_discord} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_discord: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[9px] uppercase text-muted-foreground">Denúncia Anônima?</Label>
                              <RadioGroup value={relatorioForm.dados_detalhados.reclamante_anonimo} onValueChange={(v) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_anonimo: v}})} className="flex gap-4 mt-1">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Sim" id="anon-sim" className="border-border text-blue-600" /><Label htmlFor="anon-sim" className="text-xs text-foreground font-normal">Sim</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Não" id="anon-nao" className="border-border text-blue-600" /><Label htmlFor="anon-nao" className="text-xs text-foreground font-normal">Não</Label></div>
                              </RadioGroup>
                            </div>
                          </div>

                          {/* 2. DADOS DO POLICIAL DENUNCIADO */}
                          <div className="space-y-2 border-l-2 border-slate-600 pl-4 bg-slate-500/5 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">2. Dados do Policial Denunciado</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Nome do Policial</Label><Input value={relatorioForm.dados_detalhados.denunciado_nome} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_nome: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Patente / Cargo</Label><Input value={relatorioForm.dados_detalhados.denunciado_patente} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_patente: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Badge / Nº de Identificação</Label><Input value={relatorioForm.dados_detalhados.denunciado_badge} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_badge: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Divisão / Unidade</Label><Input value={relatorioForm.dados_detalhados.denunciado_unidade} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_unidade: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                            </div>
                            <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Prefixo / Modelo da Viatura (se houver)</Label><Input value={relatorioForm.dados_detalhados.denunciado_viatura} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_viatura: e.target.value}})} placeholder="Ex: Adam-12 / Charger" className="h-8 bg-background border-border text-foreground text-xs" /></div>
                          </div>

                          {/* 3. TIPO DE DENÚNCIA */}
                          <div className="space-y-2 border-l-2 border-zinc-600 pl-4 bg-muted/50 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">3. Tipo de Denúncia</h4>
                            <div className="grid grid-cols-2 gap-y-2">
                              {["Uso excessivo da força","Abuso de autoridade","Corrupção","Conduta imprópria","Discriminação / Racismo","Ameaça / Intimidação","Violação de procedimentos","Falsificação de relatório","Assédio","Outro"].map(tipo => (
                                <div key={tipo} className="flex items-center space-x-2">
                                  <Checkbox id={`tipo-ip-${tipo}`} checked={relatorioForm.dados_detalhados.tipo_denuncia_selecionado === tipo} onCheckedChange={() => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, tipo_denuncia_selecionado: tipo}})} className="border-border data-[state=checked]:bg-amber-600 data-[state=checked]:border-zinc-600" />
                                  <Label htmlFor={`tipo-ip-${tipo}`} className="text-[10px] text-foreground font-normal">{tipo}</Label>
                                </div>
                              ))}
                            </div>
                            {relatorioForm.dados_detalhados.tipo_denuncia_selecionado === "Outro" && <Input placeholder="Especifique..." value={relatorioForm.dados_detalhados.tipo_denuncia_outro} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, tipo_denuncia_outro: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" />}
                          </div>

                          {/* 4. INFORMAÇÕES DO INCIDENTE */}
                          <div className="space-y-2 border-l-2 border-zinc-600 pl-4 bg-muted/50 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">4. Informações do Incidente</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Data do Ocorrido</Label><Input value={relatorioForm.dados_detalhados.incidente_data} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_data: e.target.value}})} type="date" className="h-8 bg-background border-border text-foreground text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Horário Aproximado</Label><Input value={relatorioForm.dados_detalhados.incidente_horario} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_horario: e.target.value}})} type="time" className="h-8 bg-background border-border text-foreground text-xs" /></div>
                            </div>
                            <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Local do Incidente</Label><Input value={relatorioForm.dados_detalhados.incidente_local} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_local: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                            <div className="space-y-1">
                              <Label className="text-[9px] uppercase text-muted-foreground">Havia Testemunhas?</Label>
                              <RadioGroup value={relatorioForm.dados_detalhados.incidente_testemunhas} onValueChange={(v) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_testemunhas: v}})} className="flex gap-4 mt-1">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Sim" id="test-sim" className="border-border text-violet-600" /><Label htmlFor="test-sim" className="text-xs text-foreground font-normal">Sim</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Não" id="test-nao" className="border-border text-violet-600" /><Label htmlFor="test-nao" className="text-xs text-foreground font-normal">Não</Label></div>
                              </RadioGroup>
                            </div>
                            {relatorioForm.dados_detalhados.incidente_testemunhas === "Sim" && (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Nome(s) da(s) Testemunha(s)</Label><Textarea rows={2} value={relatorioForm.dados_detalhados.incidente_testemunhas_nomes} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_testemunhas_nomes: e.target.value}})} className="bg-background border-border text-foreground text-xs" /></div>
                                <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Contato(s) da(s) Testemunha(s)</Label><Textarea rows={2} value={relatorioForm.dados_detalhados.incidente_testemunhas_contatos} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_testemunhas_contatos: e.target.value}})} className="bg-background border-border text-foreground text-xs" /></div>
                              </div>
                            )}
                          </div>

                          {/* 5. RELATÓRIO DOS FATOS */}
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">5. Relatório dos Fatos Anexado à Denúncia</Label>
                            <Textarea rows={5} className="bg-background border-border text-foreground text-xs leading-relaxed" value={relatorioForm.conteudo} onChange={(e) => setRelatorioForm({ ...relatorioForm, conteudo: e.target.value })} placeholder="Descreva os fatos em detalhes..." />
                          </div>

                          {/* 6. PROVAS E EVIDÊNCIAS */}
                          <div className="space-y-2 border-l-2 border-emerald-600 pl-4 bg-emerald-500/5 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">6. Provas e Evidências</h4>
                            <div className="grid grid-cols-3 gap-y-2">
                              {["Fotos","Vídeos","Áudios","Documentos","Bodycam / Dashcam","Outro"].map(prova => (
                                <div key={prova} className="flex items-center space-x-2">
                                  <Checkbox id={`prova-ip-${prova}`} checked={relatorioForm.dados_detalhados.provas_selecionadas?.includes(prova)} onCheckedChange={(checked) => { const c=[...(relatorioForm.dados_detalhados.provas_selecionadas||[])]; if(checked) c.push(prova); else c.splice(c.indexOf(prova),1); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, provas_selecionadas: c}}); }} className="border-border data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                                  <Label htmlFor={`prova-ip-${prova}`} className="text-[10px] text-foreground font-normal">{prova}</Label>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-1 mt-2"><Label className="text-[9px] uppercase text-muted-foreground">Descrição das Provas</Label><Textarea rows={2} value={relatorioForm.dados_detalhados.provas_descricao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, provas_descricao: e.target.value}})} className="bg-background border-border text-foreground text-xs" placeholder="Descreva as provas..." /></div>
                          </div>

                          <div className="pt-4 border-t border-border space-y-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Documentos Anexos (Opcional)</h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <Label className="text-[9px] text-muted-foreground uppercase">Denúncia</Label>
                                <Select value={relatorioForm.denuncia_id} onValueChange={(v) => setRelatorioForm({ ...relatorioForm, denuncia_id: v })}>
                                  <SelectTrigger className="bg-background border-border text-foreground h-8 text-[10px] uppercase">
                                    <SelectValue placeholder="Nenhum" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-muted border-border text-foreground">
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {denuncias.map(d => (
                                      <SelectItem key={d.id} value={d.id} className="text-[10px]">#{d.numero_registro} - {d.titulo}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] text-muted-foreground uppercase">Investigações Vinculadas</Label>
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {relatorioForm.investigacao_ids.map(id => {
                                    const inv = investigacoes.find(i => i.id === id);
                                    return (
                                      <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                        #{inv?.numero_registro || '?'} - {inv?.titulo || 'N/A'}
                                        <button type="button" onClick={() => setRelatorioForm({...relatorioForm, investigacao_ids: relatorioForm.investigacao_ids.filter(x => x !== id)})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                                      </Badge>
                                    );
                                  })}
                                </div>
                                <div className="flex gap-2">
                                  <select className="flex-1 h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v && !relatorioForm.investigacao_ids.includes(v)) setRelatorioForm({...relatorioForm, investigacao_ids: [...relatorioForm.investigacao_ids, v]}); }}>
                                    <option value="">Adicionar investigação...</option>
                                    {investigacoes.filter(i => !relatorioForm.investigacao_ids.includes(i.id)).map(i => (
                                      <option key={i.id} value={i.id}>#{i.numero_registro} - {i.titulo}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] text-muted-foreground uppercase">Atos Adm Vinculados</Label>
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {(relatorioForm.dados_detalhados.ato_ids_vinculados || []).map((id: string) => {
                                    const r = relatorios.find(x => x.id === id);
                                    return (
                                      <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                        #{r?.numero_registro || '?'} - {r?.titulo || 'N/A'}
                                        <button type="button" onClick={() => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_ids_vinculados: (relatorioForm.dados_detalhados.ato_ids_vinculados || []).filter((x: string) => x !== id)}})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                                      </Badge>
                                    );
                                  })}
                                </div>
                                <div className="flex gap-2">
                                  <select className="flex-1 h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v) { const arr = [...(relatorioForm.dados_detalhados.ato_ids_vinculados || [])]; if (!arr.includes(v)) arr.push(v); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_ids_vinculados: arr}}); }}}>
                                    <option value="">Adicionar ato adm...</option>
                                    {relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo").filter(r => !(relatorioForm.dados_detalhados.ato_ids_vinculados || []).includes(r.id)).map(r => (
                                      <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] text-muted-foreground uppercase">Depoimentos Vinculados</Label>
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {(relatorioForm.dados_detalhados.depoimento_ids || []).map((id: string) => {
                                    const dep = depoimentos.find(d => d.id === id);
                                    return (
                                      <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                        {dep?.oficial_nome || 'N/A'}
                                        <button type="button" onClick={() => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, depoimento_ids: (relatorioForm.dados_detalhados.depoimento_ids || []).filter((x: string) => x !== id)}})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                                      </Badge>
                                    );
                                  })}
                                </div>
                                <div className="flex gap-2">
                                  <select className="flex-1 h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v) { const arr = [...(relatorioForm.dados_detalhados.depoimento_ids || [])]; if (!arr.includes(v)) arr.push(v); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, depoimento_ids: arr}}); }}}>
                                    <option value="">Adicionar depoimento...</option>
                                    {depoimentos.filter(d => !(relatorioForm.dados_detalhados.depoimento_ids || []).includes(d.id)).map(d => (
                                      <option key={d.id} value={d.id}>{d.oficial_nome} - {d.data_depoimento}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                        <div className="pt-4 border-t border-border flex justify-end">
                          <Button type="submit" disabled={submitting} className="bg-zinc-700 hover:bg-blue-500 text-white font-bold tracking-widest px-8 uppercase text-[10px]">
                            {submitting ? "Processando..." : "ABRIR INQUÉRITO"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2">Filtrar por Status:</span>
                  <Button 
                    size="sm" variant="outline"
                    className={`font-mono text-[10px] h-7 ${inqueritoFilter === "todas" ? "bg-slate-700 text-foreground" : "text-muted-foreground border-border"}`}
                    onClick={() => setInqueritoFilter("todas")}
                  >
                    TODOS
                  </Button>
                  {Object.entries(STATUS_LABEL).map(([val, lab]) => (
                    <Button 
                      key={val}
                      size="sm" variant="outline"
                      className={`font-mono text-[10px] h-7 ${inqueritoFilter === val ? "bg-slate-700 text-white border-slate-600" : "text-muted-foreground border-border"}`}
                      onClick={() => setInqueritoFilter(val as Status)}
                    >
                      {lab.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {relatorios
                  .filter(r => r.tipo_denuncia === "Inquérito Policial" && (inqueritoFilter === "todas" || r.status === inqueritoFilter))
                  .length === 0 ? (
                    <div className="rounded-lg border border-border border-dashed bg-card/50 p-12 text-center text-muted-foreground">
                      Nenhum inquérito encontrado com este filtro.
                    </div>
                  ) : (
                    relatorios
                      .filter(r => r.tipo_denuncia === "Inquérito Policial" && (inqueritoFilter === "todas" || r.status === inqueritoFilter))
                      .map(r => (
                        <RelatorioCard 
                          key={r.id}
                          relatorio={r}
                          expanded={expandedId === r.id}
                          onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                          isAdmin={true}
                          onApprove={approveDocumento}
                          relatorios={relatorios}
                          onEdit={(rel: any) => {
                            setEditingRelatorioId(rel.id);
                            const linkedInvIds = investigacaoRelatorios.filter(ir => ir.relatorio_id === rel.id).map(ir => ir.investigacao_id);
                            setRelatorioForm({
                              titulo: rel.titulo || "",
                              tipo_denuncia: rel.tipo_denuncia || "Inquérito Policial",
                              oficial: rel.oficial || "",
                              conteudo: rel.conteudo || "",
                              denuncia_id: "",
                              investigacao_id: "",
                              investigacao_ids: linkedInvIds,
                              status: rel.status || "pendente",
                              dados_detalhados: { ...relatorioForm.dados_detalhados, ...(rel.dados_detalhados || {}) }
                            });
                            setIsEditDialogOpen(true);
                          }}
                          onDelete={deleteDocumento}
                          onUpdateStatus={updateRelatorioStatus}
                          denuncias={denuncias}
                          investigacoes={investigacoes}
                          denunciaRelatorios={denunciaRelatorios}
                          investigacaoRelatorios={investigacaoRelatorios}
                          onLinkDenuncia={handleLinkDenuncia}
                          onLinkInvestigacao={handleLinkInvestigacao}
                          linking={linking}
                          linkDenunciaId={linkDenunciaId}
                          setLinkDenunciaId={setLinkDenunciaId}
                          linkInvestigacaoId={linkInvestigacaoId}
                          setLinkInvestigacaoId={setLinkInvestigacaoId}
                        />
                      ))
                  )
                }
              </div>
            </div>
          )}

          {/* ATOS ADMINISTRATIVOS TAB */}
          {activeTab === "atos" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-4 border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Atos Administrativos</h3>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setRelatorioForm({...relatorioForm, tipo_denuncia: "Ato Administrativo"})}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wider uppercase text-xs"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Ato
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground">
                      <DialogHeader>
                        <DialogTitle className="text-foreground uppercase tracking-wider">Registrar Ato Administrativo</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={submitRelatorio} className="space-y-5 mt-4">
                        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="titulo-ato" className="text-muted-foreground text-xs uppercase tracking-wider">Título do Ato</Label>
                              <Input
                                id="titulo-ato"
                                className="bg-background border-border text-foreground"
                                value={relatorioForm.titulo}
                                onChange={(e) => setRelatorioForm({ ...relatorioForm, titulo: e.target.value })}
                                placeholder="EX: ATO-001/26 - SUSPENSÃO"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Status do Ato</Label>
                              <Select value={relatorioForm.status} onValueChange={(v: Status) => setRelatorioForm({ ...relatorioForm, status: v })}>
                                <SelectTrigger className="bg-background border-border text-foreground h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-muted border-border text-foreground">
                                  {Object.entries(STATUS_LABEL).map(([val, lab]) => <SelectItem key={val} value={val}>{lab}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* --- SEÇÕES ESTRUTURADAS DO ATO --- */}
                          <div className="space-y-6">
                            {/* 1. IDENTIFICAÇÃO */}
                            <div className="space-y-2 border-l-2 border-red-600 pl-4 bg-red-500/5 py-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500">1. IDENTIFICAÇÃO DO ATO</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-[9px] uppercase text-muted-foreground">Número do Inquérito</Label>
                                  <Input value={relatorioForm.dados_detalhados.ato_numero_inquerito} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_numero_inquerito: e.target.value}})} placeholder="Nº000" className="h-8 bg-background border-border text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] uppercase text-muted-foreground">Número do Ato Administrativo</Label>
                                  <Input value={relatorioForm.dados_detalhados.ato_numero} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_numero: e.target.value}})} placeholder="Nº000" className="h-8 bg-background border-border text-xs" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-[9px] uppercase text-muted-foreground">Data de Emissão</Label>
                                  <Input type="date" value={relatorioForm.dados_detalhados.ato_data_emissao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_data_emissao: e.target.value}})} className="h-8 bg-background border-border text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] uppercase text-muted-foreground">Tipo de Ato</Label>
                                  <Select value={relatorioForm.dados_detalhados.ato_tipo} onValueChange={(v) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_tipo: v}})}>
                                    <SelectTrigger className="h-8 bg-background border-border text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent className="bg-muted border-border text-foreground">
                                      <SelectItem value="Aplicação de Medida Disciplinar">Aplicação de Medida Disciplinar</SelectItem>
                                      <SelectItem value="Suspensão Preventiva">Suspensão Preventiva</SelectItem>
                                      <SelectItem value="Arquivamento">Arquivamento</SelectItem>
                                      <SelectItem value="Outro">Outro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              {relatorioForm.dados_detalhados.ato_tipo === "Outro" && <Input placeholder="Especifique..." value={relatorioForm.dados_detalhados.ato_tipo_outro} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_tipo_outro: e.target.value}})} className="h-8 bg-background border-border text-xs mt-1" />}
                            </div>

                            {/* 2. AUTORIDADE EMISSORA */}
                            <div className="space-y-2 border-l-2 border-zinc-500 pl-4 bg-muted/50 py-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">2. AUTORIDADE EMISSORA</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-[9px] uppercase text-muted-foreground">Nome do Corregedor</Label>
                                  <Input value={relatorioForm.dados_detalhados.ato_autoridade_nome} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_autoridade_nome: e.target.value}})} className="h-8 bg-background border-border text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] uppercase text-muted-foreground">Cargo/Patente</Label>
                                  <Input value={relatorioForm.dados_detalhados.ato_autoridade_cargo} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_autoridade_cargo: e.target.value}})} className="h-8 bg-background border-border text-xs" />
                                </div>
                              </div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Departamento / Unidade</Label><Input value={relatorioForm.dados_detalhados.ato_autoridade_unidade} disabled className="h-8 bg-background border-border text-muted-foreground text-xs" /></div>
                            </div>

                            {/* 3. OBJETO DO ATO */}
                            <div className="space-y-2 border-l-2 border-slate-600 pl-4 bg-slate-500/5 py-3">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">3. OBJETO DO ATO</h4>
                              <Label className="text-[9px] uppercase text-muted-foreground">Descrição Resumida</Label>
                              <Textarea value={relatorioForm.dados_detalhados.ato_objeto_descricao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_objeto_descricao: e.target.value}})} rows={2} className="bg-background border-border text-xs" placeholder="Descreva o objeto..." />
                            </div>

                            {/* 4. FUNDAMENTAÇÃO */}
                            <div className="space-y-2 border-l-2 border-zinc-600 pl-4 bg-muted/50 py-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">4. FUNDAMENTAÇÃO</h4>
                              <Label className="text-[9px] uppercase text-muted-foreground">Base do Ato Administrativo</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {["Relatório interno", "Denúncia formal", "Evidências coletadas", "Ordem superior", "Auditoria interna", "Outro"].map(f => (
                                  <div key={f} className="flex items-center space-x-2">
                                    <Checkbox id={`f-${f}`} checked={relatorioForm.dados_detalhados.ato_fundamentacao_selecionada?.includes(f)} onCheckedChange={(checked) => { const current = [...(relatorioForm.dados_detalhados.ato_fundamentacao_selecionada || [])]; if (checked) current.push(f); else current.splice(current.indexOf(f), 1); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_fundamentacao_selecionada: current}}); }} />
                                    <Label htmlFor={`f-${f}`} className="text-[10px] font-normal">{f}</Label>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Descrição Complementar</Label><Textarea value={relatorioForm.dados_detalhados.ato_fundamentacao_complementar} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_fundamentacao_complementar: e.target.value}})} rows={2} className="bg-background border-border text-xs mt-2" placeholder="Descreva a fundamentação..." /></div>
                            </div>

                            {/* 5. DECISÃO */}
                            <div className="space-y-2 border-l-2 border-emerald-600 pl-4 bg-emerald-500/5 py-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">5. DECISÃO</h4>
                              <div className="space-y-1">
                                <Label className="text-[9px] uppercase text-muted-foreground">Deliberação da Autoridade</Label>
                                <Textarea value={relatorioForm.dados_detalhados.ato_decisao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_decisao: e.target.value}})} rows={2} className="bg-background border-border text-xs" placeholder="Deliberação..." />
                              </div>
                            </div>

                            {/* 6. MEDIDAS DETERMINADAS */}
                            <div className="space-y-2 border-l-2 border-zinc-600 pl-4 bg-muted/50 py-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">6. MEDIDAS DETERMINADAS</h4>
                              <div className="grid grid-cols-1 gap-2">
                                {[
                                  "Abertura de inquérito administrativo", 
                                  "Afastamento preventivo", 
                                  "Recolhimento de equipamentos funcionais", 
                                  "Advertência formal", 
                                  "Suspensão temporária", 
                                  "Encaminhamento ao Ministério Público/autoridade externa", 
                                  "Arquivamento do caso", 
                                  "Outro"
                                ].map(m => (
                                  <div key={m} className="flex items-center space-x-2">
                                    <Checkbox id={`m-ato-${m}`} checked={relatorioForm.dados_detalhados.ato_medidas_selecionadas?.includes(m)} onCheckedChange={(checked) => { const current = [...(relatorioForm.dados_detalhados.ato_medidas_selecionadas || [])]; if (checked) current.push(m); else current.splice(current.indexOf(m), 1); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_medidas_selecionadas: current}}); }} />
                                    <Label htmlFor={`m-ato-${m}`} className="text-[10px] font-normal">{m}</Label>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] uppercase text-muted-foreground">Detalhamento das medidas</Label>
                                <Textarea value={relatorioForm.dados_detalhados.ato_medidas_detalhamento} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_medidas_detalhamento: e.target.value}})} rows={3} className="bg-background border-border text-xs mt-2" placeholder="Detalhes das medidas..." />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Conteúdo Detalhado do Ato</Label>
                              <Textarea rows={6} className="bg-background border-border text-foreground font-mono text-xs leading-relaxed" value={relatorioForm.conteudo} onChange={(e) => setRelatorioForm({ ...relatorioForm, conteudo: e.target.value })} placeholder="Texto integral do ato administrativo..." />
                            </div>

                            <div className="pt-4 border-t border-border space-y-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Documentos Anexos (Opcional)</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-muted-foreground uppercase">Denúncia</Label>
                                  <Select value={relatorioForm.denuncia_id} onValueChange={(v) => setRelatorioForm({ ...relatorioForm, denuncia_id: v })}>
                                    <SelectTrigger className="bg-background border-border text-foreground h-8 text-[10px] uppercase">
                                      <SelectValue placeholder="Nenhum" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-muted border-border text-foreground">
                                      <SelectItem value="none">Nenhum</SelectItem>
                                      {denuncias.map(d => (
                                        <SelectItem key={d.id} value={d.id} className="text-[10px]">#{d.numero_registro} - {d.titulo}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-muted-foreground uppercase">Investigações Vinculadas</Label>
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {relatorioForm.investigacao_ids.map(id => {
                                      const inv = investigacoes.find(i => i.id === id);
                                      return (
                                        <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                          #{inv?.numero_registro || '?'} - {inv?.titulo || 'N/A'}
                                          <button type="button" onClick={() => setRelatorioForm({...relatorioForm, investigacao_ids: relatorioForm.investigacao_ids.filter(x => x !== id)})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                  <div className="flex gap-2">
                                    <select className="flex-1 h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v && !relatorioForm.investigacao_ids.includes(v)) setRelatorioForm({...relatorioForm, investigacao_ids: [...relatorioForm.investigacao_ids, v]}); }}>
                                      <option value="">Adicionar investigação...</option>
                                      {investigacoes.filter(i => !relatorioForm.investigacao_ids.includes(i.id)).map(i => (
                                        <option key={i.id} value={i.id}>#{i.numero_registro} - {i.titulo}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-muted-foreground uppercase">IPs Vinculados</Label>
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {(relatorioForm.dados_detalhados.ip_ids_vinculados || []).map((id: string) => {
                                      const r = relatorios.find(x => x.id === id);
                                      return (
                                        <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                          #{r?.numero_registro || '?'} - {r?.titulo || 'N/A'}
                                          <button type="button" onClick={() => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ip_ids_vinculados: (relatorioForm.dados_detalhados.ip_ids_vinculados || []).filter((x: string) => x !== id)}})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                  <div className="flex gap-2">
                                    <select className="flex-1 h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v) { const arr = [...(relatorioForm.dados_detalhados.ip_ids_vinculados || [])]; if (!arr.includes(v)) arr.push(v); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ip_ids_vinculados: arr}}); }}}>
                                      <option value="">Adicionar IP...</option>
                                      {relatorios.filter(r => r.tipo_denuncia === "Inquérito Policial").filter(r => !(relatorioForm.dados_detalhados.ip_ids_vinculados || []).includes(r.id)).map(r => (
                                        <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-muted-foreground uppercase">Depoimentos Vinculados</Label>
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {(relatorioForm.dados_detalhados.depoimento_ids || []).map((id: string) => {
                                      const dep = depoimentos.find(d => d.id === id);
                                      return (
                                        <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                          {dep?.oficial_nome || 'N/A'}
                                          <button type="button" onClick={() => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, depoimento_ids: (relatorioForm.dados_detalhados.depoimento_ids || []).filter((x: string) => x !== id)}})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                  <div className="flex gap-2">
                                    <select className="flex-1 h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v) { const arr = [...(relatorioForm.dados_detalhados.depoimento_ids || [])]; if (!arr.includes(v)) arr.push(v); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, depoimento_ids: arr}}); }}}>
                                      <option value="">Adicionar depoimento...</option>
                                      {depoimentos.filter(d => !(relatorioForm.dados_detalhados.depoimento_ids || []).includes(d.id)).map(d => (
                                        <option key={d.id} value={d.id}>{d.oficial_nome} - {d.data_depoimento}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border flex justify-end">
                        <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 font-bold tracking-widest text-[10px] uppercase">
                          {submitting ? "Registrando..." : "REGISTRAR ATO"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2">Filtrar por Status:</span>
                  <Button 
                    size="sm" variant="outline"
                    className={`font-mono text-[10px] h-7 ${atoFilter === "todas" ? "bg-slate-700 text-foreground" : "text-muted-foreground border-border"}`}
                    onClick={() => setAtoFilter("todas")}
                  >
                    TODOS
                  </Button>
                  {Object.entries(STATUS_LABEL).map(([val, lab]) => (
                    <Button 
                      key={val}
                      size="sm" variant="outline"
                      className={`font-mono text-[10px] h-7 ${atoFilter === val ? "bg-slate-700 text-white border-slate-600" : "text-muted-foreground border-border"}`}
                      onClick={() => setAtoFilter(val as Status)}
                    >
                      {lab.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {relatorios
                  .filter(r => r.tipo_denuncia === "Ato Administrativo" && (atoFilter === "todas" || r.status === atoFilter))
                  .length === 0 ? (
                    <div className="rounded-lg border border-border border-dashed bg-card/50 p-12 text-center text-muted-foreground">
                      Nenhum ato administrativo encontrado com este filtro.
                    </div>
                  ) : (
                    relatorios
                      .filter(r => r.tipo_denuncia === "Ato Administrativo" && (atoFilter === "todas" || r.status === atoFilter))
                      .map(r => (
                        <RelatorioCard 
                          key={r.id}
                          relatorio={r}
                          expanded={expandedId === r.id}
                          onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                          isAdmin={true}
                          onApprove={approveDocumento}
                          relatorios={relatorios}
                          onEdit={(rel: any) => {
                            setEditingRelatorioId(rel.id);
                            const linkedInvIds = investigacaoRelatorios.filter(ir => ir.relatorio_id === rel.id).map(ir => ir.investigacao_id);
                            setRelatorioForm({
                              titulo: rel.titulo || "",
                              tipo_denuncia: rel.tipo_denuncia || "Ato Administrativo",
                              oficial: rel.oficial || "",
                              conteudo: rel.conteudo || "",
                              denuncia_id: "",
                              investigacao_id: "",
                              investigacao_ids: linkedInvIds,
                              status: rel.status || "pendente",
                              dados_detalhados: { ...relatorioForm.dados_detalhados, ...(rel.dados_detalhados || {}) }
                            });
                            setIsEditDialogOpen(true);
                          }}
                          onDelete={deleteDocumento}
                          onUpdateStatus={updateRelatorioStatus}
                          denuncias={denuncias}
                          investigacoes={investigacoes}
                          denunciaRelatorios={denunciaRelatorios}
                          investigacaoRelatorios={investigacaoRelatorios}
                          onLinkDenuncia={handleLinkDenuncia}
                          onLinkInvestigacao={handleLinkInvestigacao}
                          linking={linking}
                          linkDenunciaId={linkDenunciaId}
                          setLinkDenunciaId={setLinkDenunciaId}
                          linkInvestigacaoId={linkInvestigacaoId}
                          setLinkInvestigacaoId={setLinkInvestigacaoId}
                        />
                      ))
                  )
                }
              </div>
            </div>
          )}

          {/* DEPOIMENTOS */}
          {activeTab === "depoimentos" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Depoimentos
                </h3>
                <Dialog open={isDepoimentoDialogOpen} onOpenChange={setIsDepoimentoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] uppercase tracking-widest">
                      <Plus className="h-3 w-3 mr-1" /> Novo Depoimento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-foreground uppercase tracking-wider text-sm">Registrar Depoimento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitDepoimento} className="space-y-5">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase text-muted-foreground">Nome do Oficial *</Label>
                          <Input value={depoimentoForm.oficial_nome} onChange={(e) => setDepoimentoForm({...depoimentoForm, oficial_nome: e.target.value})} className="h-8 bg-background border-border text-foreground text-xs" placeholder="Nome completo" required />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase text-muted-foreground">Patente</Label>
                          <Input value={depoimentoForm.oficial_patente} onChange={(e) => setDepoimentoForm({...depoimentoForm, oficial_patente: e.target.value})} className="h-8 bg-background border-border text-foreground text-xs" placeholder="Ex: 3º Sargento" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase text-muted-foreground">R.E.</Label>
                          <Input value={depoimentoForm.oficial_re} onChange={(e) => setDepoimentoForm({...depoimentoForm, oficial_re: e.target.value})} className="h-8 bg-background border-border text-foreground text-xs" placeholder="Nº de registro" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase text-muted-foreground">Data do Depoimento</Label>
                          <Input type="date" value={depoimentoForm.data_depoimento} onChange={(e) => setDepoimentoForm({...depoimentoForm, data_depoimento: e.target.value})} className="h-8 bg-background border-border text-foreground text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase text-muted-foreground">Batalhão</Label>
                          <Input value={depoimentoForm.oficial_batalhao} onChange={(e) => setDepoimentoForm({...depoimentoForm, oficial_batalhao: e.target.value})} className="h-8 bg-background border-border text-foreground text-xs" placeholder="Ex: 1º BPM" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase text-muted-foreground">Depoimento *</Label>
                        <Textarea rows={6} value={depoimentoForm.depoimento} onChange={(e) => setDepoimentoForm({...depoimentoForm, depoimento: e.target.value})} className="bg-background border-border text-foreground text-xs leading-relaxed" placeholder="Transcreva o depoimento completo..." required />
                      </div>
                      <div className="pt-2 border-t border-border space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vínculos (Opcional)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[9px] text-muted-foreground uppercase">Inquérito Policial</Label>
                            <Select value={depoimentoForm.relatorio_id_ip} onValueChange={(v) => setDepoimentoForm({...depoimentoForm, relatorio_id_ip: v})}>
                              <SelectTrigger className="bg-background border-border text-foreground h-8 text-[10px] uppercase">
                                <SelectValue placeholder="Nenhum" />
                              </SelectTrigger>
                              <SelectContent className="bg-muted border-border text-foreground">
                                <SelectItem value="none">Nenhum</SelectItem>
                                {relatorios.filter(r => r.tipo_denuncia === "Inquérito Policial").map(r => (
                                  <SelectItem key={r.id} value={r.id} className="text-[10px]">#{r.numero_registro} - {r.titulo}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] text-muted-foreground uppercase">Ato Administrativo</Label>
                            <Select value={depoimentoForm.relatorio_id_ato} onValueChange={(v) => setDepoimentoForm({...depoimentoForm, relatorio_id_ato: v})}>
                              <SelectTrigger className="bg-background border-border text-foreground h-8 text-[10px] uppercase">
                                <SelectValue placeholder="Nenhum" />
                              </SelectTrigger>
                              <SelectContent className="bg-muted border-border text-foreground">
                                <SelectItem value="none">Nenhum</SelectItem>
                                {relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo").map(r => (
                                  <SelectItem key={r.id} value={r.id} className="text-[10px]">#{r.numero_registro} - {r.titulo}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] text-muted-foreground uppercase">Investigação</Label>
                            <Select value={depoimentoForm.investigacao_id} onValueChange={(v) => setDepoimentoForm({...depoimentoForm, investigacao_id: v})}>
                              <SelectTrigger className="bg-background border-border text-foreground h-8 text-[10px] uppercase">
                                <SelectValue placeholder="Nenhum" />
                              </SelectTrigger>
                              <SelectContent className="bg-muted border-border text-foreground">
                                <SelectItem value="none">Nenhum</SelectItem>
                                {investigacoes.map(i => (
                                  <SelectItem key={i.id} value={i.id} className="text-[10px]">#{i.numero_registro} - {i.titulo || i.tipo_procedimento}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border flex justify-end">
                        <Button type="submit" disabled={submittingDepoimento} className="bg-zinc-700 hover:bg-blue-500 text-white font-bold tracking-widest px-8 uppercase text-[10px]">
                          {submittingDepoimento ? "Registrando..." : "REGISTRAR DEPOIMENTO"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {depoimentos.length === 0 ? (
                <div className="rounded-lg border border-border border-dashed bg-card/50 p-12 text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nenhum depoimento registrado.</p>
                  <p className="text-[10px] mt-1">Clique em "Novo Depoimento" para começar.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {depoimentos.map(d => (
                    <div key={d.id} className="rounded-lg border border-border bg-card p-4 hover:border-foreground/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-muted border-border text-foreground text-[10px]">#{d.numero_registro}</Badge>
                          <h4 className="text-sm font-bold text-foreground">{d.oficial_nome}</h4>
                          {d.oficial_patente && <span className="text-[10px] text-muted-foreground">{d.oficial_patente}</span>}
                          {d.oficial_re && <span className="text-[10px] text-muted-foreground">RE: {d.oficial_re}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{formatDateSafe(d.data_depoimento, "dd/MM/yyyy")}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => deleteDepoimento(d.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {d.oficial_batalhao && <p className="text-[10px] text-muted-foreground mb-2">Batalhão: {d.oficial_batalhao}</p>}
                      <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed bg-muted/30 p-3 rounded border border-border/50">{d.depoimento}</p>
                      {(d.relatorio_id_ip || d.relatorio_id_ato || d.investigacao_id) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {d.relatorio_id_ip && <Badge variant="outline" className="text-[9px] bg-muted border-border text-foreground">IP: {relatorios.find(r => r.id === d.relatorio_id_ip)?.titulo || "N/A"}</Badge>}
                          {d.relatorio_id_ato && <Badge variant="outline" className="text-[9px] bg-muted border-border text-foreground">AA: {relatorios.find(r => r.id === d.relatorio_id_ato)?.titulo || "N/A"}</Badge>}
                          {d.investigacao_id && <Badge variant="outline" className="text-[9px] bg-muted border-border text-foreground">INV: {investigacoes.find(i => i.id === d.investigacao_id)?.titulo || "N/A"}</Badge>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* OFICIAIS & SOLICITACOES... (omitidos por brevidade caso não tivessem mudado, mas estão aqui em cima) */}
          {activeTab === "solicitacoes" && isAdmin && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Solicitações de Acesso</h3>
                <span className="text-sm text-muted-foreground">{pendingUsers.length} pendentes</span>
              </div>
              
              {pendingUsers.length === 0 ? (
                <div className="rounded-lg border border-border border-dashed bg-card/50 p-12 text-center text-muted-foreground">
                  Nenhuma solicitação pendente no momento.
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingUsers.map(user => (
                    <div key={user.user_id} className="flex items-center justify-between rounded-lg border border-border bg-card p-5">
                      <div>
                        <h4 className="font-bold text-foreground uppercase">{user.full_name}</h4>
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Placa: #{user.badge_number}</span>
                          <span>Cadastrado em: {format(new Date(user.created_at), "dd/MM/yyyy HH:mm")}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => approveUser(user.role_id, "corregedor")}
                          className="bg-muted/50 text-foreground hover:bg-blue-500/30 border border-border text-[10px] font-bold uppercase px-3"
                        >
                          Corregedor
                        </Button>
                        <Button 
                          onClick={() => approveUser(user.role_id, "admin")}
                          className="bg-amber-500/20 text-foreground hover:bg-amber-500/30 border border-border text-[10px] font-bold uppercase px-3"
                        >
                          Admin
                        </Button>
                        <Button 
                          onClick={() => rejectUser(user.role_id)}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-[10px] font-bold uppercase px-3"
                        >
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === "oficiais" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Diretório de Oficiais</h3>
                <span className="text-sm text-muted-foreground">{oficiais.length} oficiais registrados</span>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {oficiais.map(oficial => (
                  <div key={oficial.id} className="flex flex-col rounded-lg border border-border bg-card p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-muted/50 text-foreground">
                          <Users className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground uppercase tracking-wider">{oficial.full_name}</h4>
                          <span className="text-xs text-muted-foreground font-mono">DISTINTIVO: #{oficial.badge_number}</span>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => deleteOficial(oficial.id)}
                          title="Remover Acesso"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-4 border-t border-border pt-4 mt-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Permissão</p>
                          {isAdmin ? (
                            <Select 
                              defaultValue={oficial.role} 
                              onValueChange={(v: any) => changeUserRole(oficial.id, v)}
                            >
                              <SelectTrigger className="bg-background border-border text-foreground font-bold text-[10px] uppercase h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-muted border-border text-foreground">
                                <SelectItem value="corregedor">Corregedor</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center h-9 px-3 rounded-md bg-background border border-border text-foreground font-bold text-[10px] uppercase">
                              {oficial.role}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Patente / Cargo</p>
                          {isAdmin ? (
                            <div className="flex gap-1">
                              <Input 
                                defaultValue={oficial.patente || "Oficial"}
                                id={`patente-${oficial.id}`}
                                className="bg-background border-border text-foreground font-mono text-[10px] uppercase h-9 flex-1"
                              />
                              <Button 
                                size="sm"
                                onClick={() => {
                                  const el = document.getElementById(`patente-${oficial.id}`) as HTMLInputElement;
                                  updatePatente(oficial.id, el.value);
                                }}
                                className="bg-zinc-800 hover:bg-slate-700 text-white h-9 px-2"
                              >
                                Salvar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center h-9 px-3 rounded-md bg-background border border-border text-foreground font-mono text-[10px] uppercase">
                              {oficial.patente || "Oficial"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* DIALOG DE EDIÇÃO DE RELATÓRIO */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground">
          <DialogHeader>
            <div className="text-center pb-2 border-b border-border">
              <p className="text-[9px] font-bold uppercase tracking-widest text-foreground mb-1">Corregedoria Geral (PMESP)</p>
              <DialogTitle className="text-foreground uppercase tracking-wider text-sm">Editar {relatorioForm.tipo_denuncia}</DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={updateRelatorio} className="space-y-4 mt-2">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-5 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Título / Número do Caso</Label><Input className="bg-background border-border text-foreground h-8 text-xs" value={relatorioForm.titulo} onChange={(e) => setRelatorioForm({ ...relatorioForm, titulo: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Status</Label><Select value={relatorioForm.status} onValueChange={(v: Status) => setRelatorioForm({ ...relatorioForm, status: v })}><SelectTrigger className="bg-background border-border text-foreground h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent className="bg-muted border-border text-foreground">{Object.entries(STATUS_LABEL).map(([val, lab]) => <SelectItem key={val} value={val}>{lab}</SelectItem>)}</SelectContent></Select></div>
              </div>

              {relatorioForm.tipo_denuncia === "Inquérito Policial" ? (
                <>
                  {/* 0. DADOS DO CORREGEDOR */}
                  <div className="space-y-2 border-l-2 border-red-600 pl-4 bg-red-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500">0. Dados do Corregedor</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Número do Caso (IP-Nº)</Label><Input value={relatorioForm.dados_detalhados.numero_caso} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, numero_caso: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Data de Abertura</Label><Input value={relatorioForm.dados_detalhados.data_abertura} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, data_abertura: e.target.value}})} type="date" className="h-8 bg-background border-border text-foreground text-xs" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Corregedor Responsável</Label><Input value={relatorioForm.oficial} className="h-8 bg-background border-border text-foreground text-xs" onChange={(e) => setRelatorioForm({ ...relatorioForm, oficial: e.target.value })} /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Patente do Corregedor</Label><Input value={relatorioForm.dados_detalhados.corregedor_patente} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, corregedor_patente: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Data de Recebimento</Label><Input value={relatorioForm.dados_detalhados.data_recebimento} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, data_recebimento: e.target.value}})} type="date" className="h-8 bg-background border-border text-foreground text-xs" /></div>
                  </div>

                  {/* 1. DADOS DO RECLAMANTE */}
                  <div className="space-y-2 border-l-2 border-zinc-500 pl-4 bg-muted/50 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">1. Dados do Reclamante / Denunciante</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Nome Completo</Label><Input value={relatorioForm.dados_detalhados.reclamante_nome} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_nome: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Número do ID</Label><Input value={relatorioForm.dados_detalhados.reclamante_id} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_id: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Telefone</Label><Input value={relatorioForm.dados_detalhados.reclamante_telefone} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_telefone: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Discord</Label><Input value={relatorioForm.dados_detalhados.reclamante_discord} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_discord: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase text-muted-foreground">Denúncia Anônima?</Label>
                      <RadioGroup value={relatorioForm.dados_detalhados.reclamante_anonimo} onValueChange={(v) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_anonimo: v}})} className="flex gap-4 mt-1">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Sim" id="edit-anon-sim" className="border-border text-blue-600" /><Label htmlFor="edit-anon-sim" className="text-xs text-foreground font-normal">Sim</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Não" id="edit-anon-nao" className="border-border text-blue-600" /><Label htmlFor="edit-anon-nao" className="text-xs text-foreground font-normal">Não</Label></div>
                      </RadioGroup>
                    </div>
                  </div>

                  {/* 2. DADOS DO POLICIAL DENUNCIADO */}
                  <div className="space-y-2 border-l-2 border-slate-600 pl-4 bg-slate-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">2. Dados do Policial Denunciado</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Nome do Policial</Label><Input value={relatorioForm.dados_detalhados.denunciado_nome} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_nome: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Patente / Cargo</Label><Input value={relatorioForm.dados_detalhados.denunciado_patente} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_patente: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Badge / Nº de Identificação</Label><Input value={relatorioForm.dados_detalhados.denunciado_badge} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_badge: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Divisão / Unidade</Label><Input value={relatorioForm.dados_detalhados.denunciado_unidade} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_unidade: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Prefixo / Modelo da Viatura (se houver)</Label><Input value={relatorioForm.dados_detalhados.denunciado_viatura} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_viatura: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                  </div>

                  {/* 3. TIPO DE DENÚNCIA */}
                  <div className="space-y-2 border-l-2 border-zinc-600 pl-4 bg-muted/50 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">3. Tipo de Denúncia</h4>
                    <div className="grid grid-cols-2 gap-y-2">
                      {["Uso excessivo da força","Abuso de autoridade","Corrupção","Conduta imprópria","Discriminação / Racismo","Ameaça / Intimidação","Violação de procedimentos","Falsificação de relatório","Assédio","Outro"].map(tipo => (
                        <div key={tipo} className="flex items-center space-x-2">
                          <Checkbox id={`edit-tipo-ip-${tipo}`} checked={relatorioForm.dados_detalhados.tipo_denuncia_selecionado === tipo} onCheckedChange={() => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, tipo_denuncia_selecionado: tipo}})} className="border-border data-[state=checked]:bg-amber-600 data-[state=checked]:border-zinc-600" />
                          <Label htmlFor={`edit-tipo-ip-${tipo}`} className="text-[10px] text-foreground font-normal">{tipo}</Label>
                        </div>
                      ))}
                    </div>
                    {relatorioForm.dados_detalhados.tipo_denuncia_selecionado === "Outro" && <Input placeholder="Especifique..." value={relatorioForm.dados_detalhados.tipo_denuncia_outro} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, tipo_denuncia_outro: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" />}
                  </div>

                  {/* 4. INFORMAÇÕES DO INCIDENTE */}
                  <div className="space-y-2 border-l-2 border-zinc-600 pl-4 bg-muted/50 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">4. Informações do Incidente</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Data do Ocorrido</Label><Input value={relatorioForm.dados_detalhados.incidente_data} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_data: e.target.value}})} type="date" className="h-8 bg-background border-border text-foreground text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Horário Aproximado</Label><Input value={relatorioForm.dados_detalhados.incidente_horario} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_horario: e.target.value}})} type="time" className="h-8 bg-background border-border text-foreground text-xs" /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Local do Incidente</Label><Input value={relatorioForm.dados_detalhados.incidente_local} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_local: e.target.value}})} className="h-8 bg-background border-border text-foreground text-xs" /></div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase text-muted-foreground">Havia Testemunhas?</Label>
                      <RadioGroup value={relatorioForm.dados_detalhados.incidente_testemunhas} onValueChange={(v) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_testemunhas: v}})} className="flex gap-4 mt-1">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Sim" id="edit-test-sim" className="border-border text-violet-600" /><Label htmlFor="edit-test-sim" className="text-xs text-foreground font-normal">Sim</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Não" id="edit-test-nao" className="border-border text-violet-600" /><Label htmlFor="edit-test-nao" className="text-xs text-foreground font-normal">Não</Label></div>
                      </RadioGroup>
                    </div>
                    {relatorioForm.dados_detalhados.incidente_testemunhas === "Sim" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Nome(s) da(s) Testemunha(s)</Label><Textarea rows={2} value={relatorioForm.dados_detalhados.incidente_testemunhas_nomes} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_testemunhas_nomes: e.target.value}})} className="bg-background border-border text-foreground text-xs" /></div>
                        <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Contato(s) da(s) Testemunha(s)</Label><Textarea rows={2} value={relatorioForm.dados_detalhados.incidente_testemunhas_contatos} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_testemunhas_contatos: e.target.value}})} className="bg-background border-border text-foreground text-xs" /></div>
                      </div>
                    )}
                  </div>

                  {/* 5. RELATÓRIO DOS FATOS */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">5. Relatório dos Fatos Anexado à Denúncia</Label>
                    <Textarea rows={5} className="bg-background border-border text-foreground text-xs leading-relaxed" value={relatorioForm.conteudo} onChange={(e) => setRelatorioForm({ ...relatorioForm, conteudo: e.target.value })} />
                  </div>

                  {/* 6. PROVAS E EVIDÊNCIAS */}
                  <div className="space-y-2 border-l-2 border-emerald-600 pl-4 bg-emerald-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">6. Provas e Evidências</h4>
                    <div className="grid grid-cols-3 gap-y-2">
                      {["Fotos","Vídeos","Áudios","Documentos","Bodycam / Dashcam","Outro"].map(prova => (
                        <div key={prova} className="flex items-center space-x-2">
                          <Checkbox id={`edit-prova-ip-${prova}`} checked={relatorioForm.dados_detalhados.provas_selecionadas?.includes(prova)} onCheckedChange={(checked) => { const c=[...(relatorioForm.dados_detalhados.provas_selecionadas||[])]; if(checked) c.push(prova); else c.splice(c.indexOf(prova),1); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, provas_selecionadas: c}}); }} className="border-border data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                          <Label htmlFor={`edit-prova-ip-${prova}`} className="text-[10px] text-foreground font-normal">{prova}</Label>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 mt-2"><Label className="text-[9px] uppercase text-muted-foreground">Descrição das Provas</Label><Textarea rows={2} value={relatorioForm.dados_detalhados.provas_descricao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, provas_descricao: e.target.value}})} className="bg-background border-border text-foreground text-xs" /></div>
                  </div>

                  {/* 7. DOCUMENTOS E VÍNCULOS */}
                  <div className="pt-2 border-t border-border space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">7. Documentos Anexos e Vínculos</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] text-muted-foreground uppercase">Denúncia</Label>
                        <Select value={relatorioForm.denuncia_id} onValueChange={(v) => setRelatorioForm({ ...relatorioForm, denuncia_id: v })}>
                          <SelectTrigger className="bg-background border-border text-foreground h-8 text-[10px] uppercase">
                            <SelectValue placeholder="Nenhum" />
                          </SelectTrigger>
                          <SelectContent className="bg-muted border-border text-foreground">
                            <SelectItem value="none">Nenhum</SelectItem>
                            {denuncias.map(d => (
                              <SelectItem key={d.id} value={d.id} className="text-[10px]">#{d.numero_registro} - {d.titulo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-muted-foreground uppercase">Investigações Vinculadas</Label>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {relatorioForm.investigacao_ids.map(id => {
                            const inv = investigacoes.find(i => i.id === id);
                            return (
                              <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                #{inv?.numero_registro || '?'} - {inv?.titulo || 'N/A'}
                                <button type="button" onClick={() => setRelatorioForm({...relatorioForm, investigacao_ids: relatorioForm.investigacao_ids.filter(x => x !== id)})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <select className="flex-1 h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v && !relatorioForm.investigacao_ids.includes(v)) setRelatorioForm({...relatorioForm, investigacao_ids: [...relatorioForm.investigacao_ids, v]}); }}>
                            <option value="">Adicionar investigação...</option>
                            {investigacoes.filter(i => !relatorioForm.investigacao_ids.includes(i.id)).map(i => (
                              <option key={i.id} value={i.id}>#{i.numero_registro} - {i.titulo}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-muted-foreground uppercase">Atos Adm Vinculados</Label>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {(relatorioForm.dados_detalhados.ato_ids_vinculados || []).map((id: string) => {
                            const r = relatorios.find(x => x.id === id);
                            return (
                              <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                #{r?.numero_registro || '?'} - {r?.titulo || 'N/A'}
                                <button type="button" onClick={() => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_ids_vinculados: (relatorioForm.dados_detalhados.ato_ids_vinculados || []).filter((x: string) => x !== id)}})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <select className="flex-1 h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v) { const arr = [...(relatorioForm.dados_detalhados.ato_ids_vinculados || [])]; if (!arr.includes(v)) arr.push(v); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_ids_vinculados: arr}}); }}}>
                            <option value="">Adicionar ato adm...</option>
                            {relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo").filter(r => !(relatorioForm.dados_detalhados.ato_ids_vinculados || []).includes(r.id)).map(r => (
                              <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-muted-foreground uppercase">Depoimentos Vinculados</Label>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {(relatorioForm.dados_detalhados.depoimento_ids || []).map((id: string) => {
                            const dep = depoimentos.find(d => d.id === id);
                            return (
                              <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                {dep?.oficial_nome || 'N/A'}
                                <button type="button" onClick={() => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, depoimento_ids: (relatorioForm.dados_detalhados.depoimento_ids || []).filter((x: string) => x !== id)}})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <select className="flex-1 h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v) { const arr = [...(relatorioForm.dados_detalhados.depoimento_ids || [])]; if (!arr.includes(v)) arr.push(v); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, depoimento_ids: arr}}); }}}>
                            <option value="">Adicionar depoimento...</option>
                            {depoimentos.filter(d => !(relatorioForm.dados_detalhados.depoimento_ids || []).includes(d.id)).map(d => (
                              <option key={d.id} value={d.id}>{d.oficial_nome} - {d.data_depoimento}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* 1. IDENTIFICAÇÃO DO ATO */}
                  <div className="space-y-2 border-l-2 border-red-600 pl-4 bg-red-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500">1. IDENTIFICAÇÃO DO ATO</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Nº do Inquérito</Label><Input value={relatorioForm.dados_detalhados.ato_numero_inquerito} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_numero_inquerito: e.target.value}})} className="h-8 bg-background border-border text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Número do Ato</Label><Input value={relatorioForm.dados_detalhados.ato_numero} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_numero: e.target.value}})} className="h-8 bg-background border-border text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Data de Emissão</Label><Input type="date" value={relatorioForm.dados_detalhados.ato_data_emissao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_data_emissao: e.target.value}})} className="h-8 bg-background border-border text-xs" /></div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase text-muted-foreground">Tipo de Ato</Label>
                      <Select value={relatorioForm.dados_detalhados.ato_tipo} onValueChange={(v) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_tipo: v}})}>
                        <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-muted border-border text-foreground">
                          {["Portaria","Ofício","Despacho","Parecer","Mandado","Notificação","Intimação","Outro"].map(t => (
                            <SelectItem key={t} value={t} className="text-[10px]">{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {relatorioForm.dados_detalhados.ato_tipo === "Outro" && <Input placeholder="Especifique..." value={relatorioForm.dados_detalhados.ato_tipo_outro} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_tipo_outro: e.target.value}})} className="h-8 bg-background border-border text-xs" />}
                  </div>

                  {/* 2. AUTORIDADE EMISSORA */}
                  <div className="space-y-2 border-l-2 border-zinc-500 pl-4 bg-muted/50 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">2. AUTORIDADE EMISSORA</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Nome</Label><Input value={relatorioForm.dados_detalhados.ato_autoridade_nome} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_autoridade_nome: e.target.value}})} className="h-8 bg-background border-border text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Cargo</Label><Input value={relatorioForm.dados_detalhados.ato_autoridade_cargo} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_autoridade_cargo: e.target.value}})} className="h-8 bg-background border-border text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Departamento</Label><Input value={relatorioForm.dados_detalhados.ato_autoridade_unidade} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_autoridade_unidade: e.target.value}})} className="h-8 bg-background border-border text-xs" /></div>
                    </div>
                  </div>

                  {/* 3. OBJETO DO ATO */}
                  <div className="space-y-2 border-l-2 border-slate-600 pl-4 bg-slate-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">3. OBJETO DO ATO</h4>
                    <Textarea value={relatorioForm.dados_detalhados.ato_objeto_descricao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_objeto_descricao: e.target.value}})} rows={3} className="bg-background border-border text-xs" />
                  </div>

                  {/* 4. FUNDAMENTAÇÃO */}
                  <div className="space-y-2 border-l-2 border-zinc-600 pl-4 bg-muted/50 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">4. FUNDAMENTAÇÃO</h4>
                    <div className="grid grid-cols-2 gap-y-2">
                      {["Art. 40 da Lei 8.112/90","Art. 143 da Lei 8.112/90","CF Art. 37, §4º","Lei 4.898/65 (Abuso de Autoridade)","Código Penal Militar","Regularmento Disciplinar PMESP","Jurisprudência Corregedoria","Outro"].map(f => (
                        <div key={f} className="flex items-center space-x-2">
                          <Checkbox id={`edit-fund-${f}`} checked={relatorioForm.dados_detalhados.ato_fundamentacao_selecionada?.includes(f)} onCheckedChange={(checked) => { const current = [...(relatorioForm.dados_detalhados.ato_fundamentacao_selecionada || [])]; if (checked) current.push(f); else current.splice(current.indexOf(f), 1); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_fundamentacao_selecionada: current}}); }} className="border-border" />
                          <Label htmlFor={`edit-fund-${f}`} className="text-[10px] text-foreground font-normal">{f}</Label>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Descrição Complementar</Label><Textarea value={relatorioForm.dados_detalhados.ato_fundamentacao_complementar} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_fundamentacao_complementar: e.target.value}})} rows={2} className="bg-background border-border text-xs" /></div>
                  </div>

                  {/* 5. DECISÃO */}
                  <div className="space-y-2 border-l-2 border-zinc-600 pl-4 bg-muted/50 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">5. DECISÃO</h4>
                    <Textarea rows={5} className="bg-background border-border text-foreground text-xs leading-relaxed" value={relatorioForm.dados_detalhados.ato_decisao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_decisao: e.target.value}})} />
                  </div>

                  {/* 6. MEDIDAS DETERMINADAS */}
                  <div className="space-y-2 border-l-2 border-emerald-600 pl-4 bg-emerald-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">6. MEDIDAS DETERMINADAS</h4>
                    <div className="grid grid-cols-2 gap-y-2">
                      {["Abertura de IP","Afastamento preventivo","Suspensão","Advertência","Recomendação","Arquivamento","Encaminhamento ao MP","Outro"].map(m => (
                        <div key={m} className="flex items-center space-x-2">
                          <Checkbox id={`edit-med-${m}`} checked={relatorioForm.dados_detalhados.ato_medidas_selecionadas?.includes(m)} onCheckedChange={(checked) => { const current = [...(relatorioForm.dados_detalhados.ato_medidas_selecionadas || [])]; if (checked) current.push(m); else current.splice(current.indexOf(m), 1); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_medidas_selecionadas: current}}); }} className="border-border data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                          <Label htmlFor={`edit-med-${m}`} className="text-[10px] text-foreground font-normal">{m}</Label>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1"><Label className="text-[9px] uppercase text-muted-foreground">Detalhamento das Medidas</Label><Textarea value={relatorioForm.dados_detalhados.ato_medidas_detalhamento} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_medidas_detalhamento: e.target.value}})} rows={3} className="bg-background border-border text-xs" /></div>
                  </div>

                  {/* 7. CONTEÚDO DETALHADO */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">7. Conteúdo Detalhado do Ato</Label>
                    <Textarea rows={6} className="bg-background border-border text-foreground font-mono text-xs leading-relaxed" value={relatorioForm.conteudo} onChange={(e) => setRelatorioForm({ ...relatorioForm, conteudo: e.target.value })} />
                  </div>

                  {/* 8. VÍNCULOS */}
                  <div className="pt-2 border-t border-border space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">8. Documentos Anexos e Vínculos</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] text-muted-foreground uppercase">Denúncia</Label>
                        <Select value={relatorioForm.denuncia_id} onValueChange={(v) => setRelatorioForm({ ...relatorioForm, denuncia_id: v })}>
                          <SelectTrigger className="bg-background border-border text-foreground h-8 text-[10px] uppercase">
                            <SelectValue placeholder="Nenhum" />
                          </SelectTrigger>
                          <SelectContent className="bg-muted border-border text-foreground">
                            <SelectItem value="none">Nenhum</SelectItem>
                            {denuncias.map(d => (
                              <SelectItem key={d.id} value={d.id} className="text-[10px]">#{d.numero_registro} - {d.titulo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-muted-foreground uppercase">Investigações Vinculadas</Label>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {relatorioForm.investigacao_ids.map(id => {
                            const inv = investigacoes.find(i => i.id === id);
                            return (
                              <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                #{inv?.numero_registro || '?'} - {inv?.titulo || 'N/A'}
                                <button type="button" onClick={() => setRelatorioForm({...relatorioForm, investigacao_ids: relatorioForm.investigacao_ids.filter(x => x !== id)})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <select className="flex-1 h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v && !relatorioForm.investigacao_ids.includes(v)) setRelatorioForm({...relatorioForm, investigacao_ids: [...relatorioForm.investigacao_ids, v]}); }}>
                            <option value="">Adicionar investigação...</option>
                            {investigacoes.filter(i => !relatorioForm.investigacao_ids.includes(i.id)).map(i => (
                              <option key={i.id} value={i.id}>#{i.numero_registro} - {i.titulo}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-muted-foreground uppercase">IPs Vinculados</Label>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {(relatorioForm.dados_detalhados.ip_ids_vinculados || []).map((id: string) => {
                            const r = relatorios.find(x => x.id === id);
                            return (
                              <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                #{r?.numero_registro || '?'} - {r?.titulo || 'N/A'}
                                <button type="button" onClick={() => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ip_ids_vinculados: (relatorioForm.dados_detalhados.ip_ids_vinculados || []).filter((x: string) => x !== id)}})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <select className="flex-1 h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v) { const arr = [...(relatorioForm.dados_detalhados.ip_ids_vinculados || [])]; if (!arr.includes(v)) arr.push(v); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ip_ids_vinculados: arr}}); }}}>
                            <option value="">Adicionar IP...</option>
                            {relatorios.filter(r => r.tipo_denuncia === "Inquérito Policial").filter(r => !(relatorioForm.dados_detalhados.ip_ids_vinculados || []).includes(r.id)).map(r => (
                              <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-muted-foreground uppercase">Depoimentos Vinculados</Label>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {(relatorioForm.dados_detalhados.depoimento_ids || []).map((id: string) => {
                            const dep = depoimentos.find(d => d.id === id);
                            return (
                              <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                {dep?.oficial_nome || 'N/A'}
                                <button type="button" onClick={() => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, depoimento_ids: (relatorioForm.dados_detalhados.depoimento_ids || []).filter((x: string) => x !== id)}})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <select className="flex-1 h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v) { const arr = [...(relatorioForm.dados_detalhados.depoimento_ids || [])]; if (!arr.includes(v)) arr.push(v); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, depoimento_ids: arr}}); }}}>
                            <option value="">Adicionar depoimento...</option>
                            {depoimentos.filter(d => !(relatorioForm.dados_detalhados.depoimento_ids || []).includes(d.id)).map(d => (
                              <option key={d.id} value={d.id}>{d.oficial_nome} - {d.data_depoimento}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="pt-4 border-t border-border flex justify-end">
              <Button type="submit" disabled={submitting} className="bg-zinc-700 hover:bg-blue-500 text-white px-8 font-bold tracking-widest text-[10px] uppercase">
                {submitting ? "Salvando..." : "SALVAR ALTERAÇÕES"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Componentes Menores ---

function SidebarItem({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  badge 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md px-4 py-3 text-sm font-medium transition-all ${
        active 
          ? "bg-muted text-foreground shadow-[inset_2px_0_0_0_rgba(59,130,246,1)]" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {badge !== undefined && (
        <span className="flex h-5 items-center justify-center rounded-full bg-blue-500 px-2 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string, icon: React.ElementType, color: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="text-4xl font-bold text-foreground tracking-wider">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}


