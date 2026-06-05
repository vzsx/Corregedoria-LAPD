import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Shield, FileText, Loader2, Plus, FileSignature, LayoutDashboard, 
  Users, UserPlus, LogOut, Activity, Link as LinkIcon, Trash2, Edit, Pencil,
  MessageSquare, Printer, Menu, X
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Skeleton, SkeletonTable } from "@/components/skeleton";
import { logAudit } from "@/lib/audit-log";
import { SidebarItem } from "@/components/corregedoria/SidebarItem";
import { StatCard } from "@/components/corregedoria/StatCard";
import { Field } from "@/components/corregedoria/Field";
import { STATUS_LABEL, STATUS_COLOR } from "@/lib/corregedoria/constants";
import { formatDateSafe, printRelatorio, printDepoimento } from "@/lib/corregedoria/utils";
import type { Status, Tab, Denuncia, Relatorio, Investigacao, InvestigacaoRelatorio, DenunciaRelatorio, DenunciaInvestigacao, DenunciaDepoimento, Depoimento, RelatorioGeralVinculo, Profile, PendingUser } from "@/lib/corregedoria/types";

export const Route = createFileRoute("/corregedoria")({
  component: Corregedoria,
});

// Types, constants and utils moved to src/lib/corregedoria/

const RelatorioCard = ({ 
  relatorio, expanded, onToggle, isAdmin, onApprove, onEdit, onDelete, onUpdateStatus,
  denuncias, investigacoes, relatorios, denunciaRelatorios, investigacaoRelatorios,
  onLinkDenuncia, onUnlinkDenuncia, onLinkInvestigacao, onUnlinkInvestigacaoRelatorio,
  linking, linkDenunciaId, setLinkDenunciaId,
  linkInvestigacaoId, setLinkInvestigacaoId, depoimentos, onPrint
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
              <Badge variant="outline" className="bg-muted border-border text-foreground font-mono text-[10px]">
                #{relatorio.numero_registro?.toString().padStart(4, '0') || '???'}
              </Badge>
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
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-foreground hover:text-foreground hover:bg-muted/50"
              onClick={(e) => { e.stopPropagation(); onPrint(relatorio); }}
              title="Imprimir / Exportar PDF"
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/50 bg-muted/50 p-6 space-y-6">
          {/* Documentos Anexados (IP mostra AAs, AA mostra IPs) */}
          <div className="rounded border border-border bg-muted p-4">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <LinkIcon className="h-4 w-4" /> Documentos Anexados
            </div>
            {(() => {
              const linkedDocIds = relatorio.tipo_denuncia === "Inquérito Policial"
                ? (relatorio.dados_detalhados?.ato_ids_vinculados || [])
                : (relatorio.dados_detalhados?.ip_ids_vinculados || []);
              const linkedDocs = relatorios.filter(r => linkedDocIds.includes(r.id));
              return linkedDocs.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {linkedDocs.map(r => (
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
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-foreground"
                        onClick={() => { setActiveTab(r.tipo_denuncia === "Inquérito Policial" ? "inqueritos" : "atos"); setExpandedId(r.id); }}>
                        Ver Documento
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-4">Nenhum documento anexado.</p>
              );
            })()}
          </div>

          {/* Denúncias Vinculadas */}
          <div className="rounded border border-border bg-muted p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Activity className="h-4 w-4" /> Denúncias Vinculadas
            </div>
            {linkedDenuncias.length > 0 ? (
              <div className="space-y-2 mb-4">
                {linkedDenuncias.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-foreground shrink-0" />
                      <span className="text-foreground font-bold">{d.titulo}</span>
                      <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">Denúncia</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-foreground"
                        onClick={() => { setActiveTab("denuncias"); setExpandedId(d.id); }}>
                        Ver Denúncia
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        onClick={() => onUnlinkDenuncia?.(d.id, relatorio.id)}
                        title="Desanexar"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
                    <SelectValue placeholder="Selecione uma denúncia para vincular..." />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border text-foreground">
                    {availableDenuncias.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                onClick={() => onLinkDenuncia?.(relatorio.id)}
                disabled={linking || !linkDenunciaId}
                className="bg-card hover:bg-slate-700 text-white text-xs"
              >
                {linking ? "Vinculando..." : "Vincular"}
              </Button>
              {availableDenuncias.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={linking}
                  className="border-border text-muted-foreground hover:text-foreground text-xs"
                >
                  {linking ? "Vinculando..." : "Vincular Todos"}
                </Button>
              )}
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
                  <div key={i.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-foreground shrink-0" />
                      <span className="text-foreground font-bold">{i.titulo}</span>
                      <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">Investigação</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-foreground"
                        onClick={() => { setActiveTab("investigacoes"); setExpandedId(i.id); }}>
                        Ver Investigação
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        onClick={() => onUnlinkInvestigacaoRelatorio?.(i.id, relatorio.id)}
                        title="Desanexar"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mb-4">Nenhuma investigação anexada.</p>
            )}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select value={linkInvestigacaoId} onValueChange={setLinkInvestigacaoId}>
                  <SelectTrigger className="bg-muted border-border text-foreground text-xs">
                    <SelectValue placeholder="Selecione uma investigação para vincular..." />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border text-foreground">
                    {availableInvestigacoes.map((i: any) => (
                      <SelectItem key={i.id} value={i.id}>{i.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                onClick={() => onLinkInvestigacao?.(relatorio.id)}
                disabled={linking || !linkInvestigacaoId}
                className="bg-card hover:bg-slate-700 text-white text-xs"
              >
                {linking ? "Vinculando..." : "Vincular"}
              </Button>
            </div>
          </div>

          {/* Depoimentos Vinculados */}
          <div className="rounded border border-border bg-muted p-4">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <MessageSquare className="h-4 w-4" /> Depoimentos Vinculados
            </div>
            {(() => {
              const depIds = relatorio.dados_detalhados?.depoimento_ids || [];
              const linkedDeps = depoimentos?.filter(d => depIds.includes(d.id)) || [];
              return linkedDeps.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {linkedDeps.map(dep => (
                    <div key={dep.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-4 w-4 text-foreground shrink-0" />
                        <span className="text-foreground font-bold">{dep.oficial_nome}</span>
                        <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">
                          {format(new Date(dep.data_depoimento), "dd/MM/yyyy")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-4">Nenhum depoimento anexado.</p>
              );
            })()}
          </div>

          {/* Relatórios Gerais Vinculados */}
          <div className="rounded border border-border bg-muted p-4">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <FileSignature className="h-4 w-4" /> Relatórios Gerais Vinculados
            </div>
            {(() => {
              const linkedRg = relatorioGeralVinculos
                .filter(v => v.entidade_id === relatorio.id && (v.entidade_tipo === "inquerito" || v.entidade_tipo === "ato"))
                .map(v => relatorios.find(r => r.id === v.relatorio_id))
                .filter(Boolean) as Relatorio[];
              return linkedRg.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {linkedRg.map(rg => (
                    <div key={rg.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                      <div className="flex items-center gap-3">
                        <FileSignature className="h-4 w-4 text-foreground shrink-0" />
                        <span className="text-foreground font-bold">{rg.titulo}</span>
                        <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">Rel. Geral</Badge>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-foreground"
                        onClick={() => { setActiveTab("relatorios_gerais"); setExpandedId(rg.id); }}>
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-4">Nenhum Relatório Geral vinculado.</p>
              );
            })()}
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
    if (!loading && !user) navigate({ to: "/" });
  }, [user, loading, navigate]);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };
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
  const [denunciaDepoimentos, setDenunciaDepoimentos] = useState<DenunciaDepoimento[]>([]);
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [oficiais, setOficiais] = useState<Profile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Relatório Geral State
  const [relatorioGeralVinculos, setRelatorioGeralVinculos] = useState<RelatorioGeralVinculo[]>([]);
  const [isRelatorioGeralDialogOpen, setIsRelatorioGeralDialogOpen] = useState(false);
  const [isEditRelatorioGeralDialogOpen, setIsEditRelatorioGeralDialogOpen] = useState(false);
  const [editingRelatorioGeralId, setEditingRelatorioGeralId] = useState<string | null>(null);
  const [relatorioGeralForm, setRelatorioGeralForm] = useState({
    titulo: "",
    conteudo: "",
    vinculos: [] as { entidade_id: string; entidade_tipo: "denuncia" | "investigacao" | "depoimento" | "inquerito" | "ato" }[]
  });
  const [submittingRelatorioGeral, setSubmittingRelatorioGeral] = useState(false);
  const [selectedEntidadeTipo, setSelectedEntidadeTipo] = useState<"denuncia" | "investigacao" | "depoimento" | "inquerito" | "ato">("denuncia");
  const [selectedEntidadeId, setSelectedEntidadeId] = useState("");

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
    denuncia_ids: [] as string[],
    relatorio_ids_ip: [] as string[],
    relatorio_ids_ato: [] as string[],
    depoimento_ids: [] as string[],
    
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
  const [editingDepoimentoId, setEditingDepoimentoId] = useState<string | null>(null);
  const [isEditDepoimentoDialogOpen, setIsEditDepoimentoDialogOpen] = useState(false);
  const [depoimentoForm, setDepoimentoForm] = useState({
    oficial_nome: "",
    oficial_patente: "",
    oficial_re: "",
    depoimento: "",
    data_depoimento: format(new Date(), "yyyy-MM-dd"),
    oficial_batalhao: "",
    relatorio_id_ip: "",
    relatorio_id_ato: "",
    investigacao_id: "",
    observacao: ""
  });

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    loading?: boolean;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const [submitting, setSubmitting] = useState(false);
  const [denunciaPage, setDenunciaPage] = useState(1);
  const [investigacaoPage, setInvestigacaoPage] = useState(1);
  const PAGE_SIZE = 10;
  
  // Link Relatório State
  const [linkRelatorioId, setLinkRelatorioId] = useState<string>("");
  const [linkDenunciaId, setLinkDenunciaId] = useState<string>("");
  const [linkInvestigacaoId, setLinkInvestigacaoId] = useState<string>("");
  const [linkInvestigacaoDenunciaId, setLinkInvestigacaoDenunciaId] = useState<string>("");
  const [linkDepoimentoDenunciaId, setLinkDepoimentoDenunciaId] = useState<string>("");
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
      const [denunciasRes, investigacoesRes, relatoriosRes, drRes, irRes, diRes, depoimentosRes, ddRes, perfisRes, rgvRes] = await Promise.all([
        supabase.from("denuncias").select("*").order("created_at", { ascending: false }),
        supabase.from("investigacoes").select("*").order("created_at", { ascending: false }),
        supabase.from("relatorios").select("*").order("created_at", { ascending: false }),
        supabase.from("denuncia_relatorio").select("*"),
        supabase.from("investigacao_relatorio").select("*"),
        supabase.from("denuncia_investigacao").select("*"),
        supabase.from("depoimentos").select("*").order("created_at", { ascending: false }),
        supabase.from("denuncia_depoimento").select("*"),
        supabase.from("profiles").select("*").order("full_name", { ascending: true }),
        supabase.from("relatorio_geral_vinculos").select("*")
      ]);
      
      if (denunciasRes.data) setDenuncias(denunciasRes.data as Denuncia[]);
      if (investigacoesRes.data) setInvestigacoes(investigacoesRes.data as Investigacao[]);
      if (relatoriosRes.data) setRelatorios(relatoriosRes.data as Relatorio[]);
      if (drRes.data) setDenunciaRelatorios(drRes.data as DenunciaRelatorio[]);
      if (irRes.data) setInvestigacaoRelatorios(irRes.data as InvestigacaoRelatorio[]);
      if (diRes.data) setDenunciaInvestigacoes(diRes.data as DenunciaInvestigacao[]);
      if (depoimentosRes.data) setDepoimentos(depoimentosRes.data as Depoimento[]);
      if (ddRes.data) setDenunciaDepoimentos(ddRes.data as DenunciaDepoimento[]);
      if (rgvRes.data) setRelatorioGeralVinculos(rgvRes.data as RelatorioGeralVinculo[]);
      
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
        if (payload.eventType === 'INSERT') setDenuncias(prev => prev.some(d => d.id === payload.new.id) ? prev : [payload.new as Denuncia, ...prev]);
        if (payload.eventType === 'UPDATE') setDenuncias(prev => prev.map(d => d.id === payload.new.id ? payload.new as Denuncia : d));
        if (payload.eventType === 'DELETE') setDenuncias(prev => prev.filter(d => d.id !== payload.old.id));
      })
      .subscribe();

    const investigacoesSub = supabase.channel('investigacoes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investigacoes' }, (payload) => {
        if (payload.eventType === 'INSERT') setInvestigacoes(prev => prev.some(i => i.id === payload.new.id) ? prev : [payload.new as Investigacao, ...prev]);
        if (payload.eventType === 'UPDATE') setInvestigacoes(prev => prev.map(i => i.id === payload.new.id ? payload.new as Investigacao : i));
        if (payload.eventType === 'DELETE') setInvestigacoes(prev => prev.filter(i => i.id !== payload.old.id));
      })
      .subscribe();

    const relatoriosSub = supabase.channel('relatorios-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relatorios' }, (payload) => {
        if (payload.eventType === 'INSERT') setRelatorios(prev => prev.some(r => r.id === payload.new.id) ? prev : [payload.new as Relatorio, ...prev]);
        if (payload.eventType === 'UPDATE') setRelatorios(prev => prev.map(r => r.id === payload.new.id ? payload.new as Relatorio : r));
        if (payload.eventType === 'DELETE') setRelatorios(prev => prev.filter(r => r.id !== payload.old.id));
      })
      .subscribe();

    const depoimentosSub = supabase.channel('depoimentos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'depoimentos' }, (payload) => {
        if (payload.eventType === 'INSERT') setDepoimentos(prev => prev.some(d => d.id === payload.new.id) ? prev : [payload.new as Depoimento, ...prev]);
        if (payload.eventType === 'UPDATE') setDepoimentos(prev => prev.map(d => d.id === payload.new.id ? payload.new as Depoimento : d));
        if (payload.eventType === 'DELETE') setDepoimentos(prev => prev.filter(d => d.id !== payload.old.id));
      })
      .subscribe();

    const drSub = supabase.channel('denuncia-relatorio-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'denuncia_relatorio' }, (payload) => {
        if (payload.eventType === 'INSERT') setDenunciaRelatorios(prev => 
          prev.some(dr => dr.denuncia_id === payload.new.denuncia_id && dr.relatorio_id === payload.new.relatorio_id)
            ? prev
            : [...prev, payload.new as DenunciaRelatorio]
        );
        if (payload.eventType === 'DELETE') setDenunciaRelatorios(prev => prev.filter(dr => !(dr.denuncia_id === payload.old.denuncia_id && dr.relatorio_id === payload.old.relatorio_id)));
      })
      .subscribe();

    const irSub = supabase.channel('investigacao-relatorio-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investigacao_relatorio' }, (payload) => {
        if (payload.eventType === 'INSERT') setInvestigacaoRelatorios(prev =>
          prev.some(ir => ir.investigacao_id === payload.new.investigacao_id && ir.relatorio_id === payload.new.relatorio_id)
            ? prev
            : [...prev, payload.new as InvestigacaoRelatorio]
        );
        if (payload.eventType === 'DELETE') setInvestigacaoRelatorios(prev => prev.filter(ir => !(ir.investigacao_id === payload.old.investigacao_id && ir.relatorio_id === payload.old.relatorio_id)));
      })
      .subscribe();

    const diSub = supabase.channel('denuncia-investigacao-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'denuncia_investigacao' }, (payload) => {
        if (payload.eventType === 'INSERT') setDenunciaInvestigacoes(prev =>
          prev.some(di => di.denuncia_id === payload.new.denuncia_id && di.investigacao_id === payload.new.investigacao_id)
            ? prev
            : [...prev, payload.new as DenunciaInvestigacao]
        );
        if (payload.eventType === 'DELETE') setDenunciaInvestigacoes(prev => prev.filter(di => !(di.denuncia_id === payload.old.denuncia_id && di.investigacao_id === payload.old.investigacao_id)));
      })
      .subscribe();

    const ddSub = supabase.channel('denuncia-depoimento-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'denuncia_depoimento' }, (payload) => {
        if (payload.eventType === 'INSERT') setDenunciaDepoimentos(prev =>
          prev.some(dd => dd.denuncia_id === payload.new.denuncia_id && dd.depoimento_id === payload.new.depoimento_id)
            ? prev
            : [...prev, payload.new as DenunciaDepoimento]
        );
        if (payload.eventType === 'DELETE') setDenunciaDepoimentos(prev => prev.filter(dd => !(dd.denuncia_id === payload.old.denuncia_id && dd.depoimento_id === payload.old.depoimento_id)));
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
      supabase.removeChannel(ddSub);
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
      investigacao_id: depoimentoForm.investigacao_id && depoimentoForm.investigacao_id !== "none" ? depoimentoForm.investigacao_id : null,
      observacao: depoimentoForm.observacao || null
    }]).select();

    setSubmittingDepoimento(false);
    if (error || !data) return toast.error("Erro ao registrar depoimento: " + (error?.message || "Erro desconhecido"));

    toast.success("Depoimento registrado com sucesso!");
    setDepoimentos(prev => [data[0] as Depoimento, ...prev]);
    setIsDepoimentoDialogOpen(false);
    logAudit({
      user_id: user?.id,
      user_name: user?.user_metadata?.full_name,
      action: "create",
      entity_type: "depoimento",
      entity_id: data[0].id,
      details: { oficial_nome: depoimentoForm.oficial_nome }
    });
    setDepoimentoForm({
      oficial_nome: "",
      oficial_patente: "",
      oficial_re: "",
      depoimento: "",
      data_depoimento: format(new Date(), "yyyy-MM-dd"),
      oficial_batalhao: "",
      relatorio_id_ip: "",
      relatorio_id_ato: "",
      investigacao_id: "",
      observacao: ""
    });
  };

  const confirmDeleteDepoimento = (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Excluir Depoimento",
      description: "Tem certeza que deseja excluir este depoimento permanentemente? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
        const { error } = await supabase.from("depoimentos").delete().eq("id", id);
        setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
        if (error) return toast.error("Erro ao excluir depoimento");
        setDepoimentos(prev => prev.filter(d => d.id !== id));
        logAudit({
          user_id: user?.id,
          user_name: user?.user_metadata?.full_name,
          action: "delete",
          entity_type: "depoimento",
          entity_id: id,
        });
        toast.success("Depoimento excluído");
      },
    });
  };

  const handleEditDepoimento = (dep: Depoimento) => {
    setDepoimentoForm({
      oficial_nome: dep.oficial_nome || "",
      oficial_patente: dep.oficial_patente || "",
      oficial_re: dep.oficial_re || "",
      depoimento: dep.depoimento || "",
      data_depoimento: dep.data_depoimento || format(new Date(), "yyyy-MM-dd"),
      oficial_batalhao: dep.oficial_batalhao || "",
      relatorio_id_ip: dep.relatorio_id_ip || "",
      relatorio_id_ato: dep.relatorio_id_ato || "",
      investigacao_id: dep.investigacao_id || "",
      observacao: dep.observacao || ""
    });
    setEditingDepoimentoId(dep.id);
    setIsEditDepoimentoDialogOpen(true);
  };

  const updateDepoimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepoimentoId) return;
    if (!depoimentoForm.depoimento) return toast.error("Preencha o depoimento");
    setSubmittingDepoimento(true);
    const { error } = await supabase.from("depoimentos").update({
      oficial_nome: depoimentoForm.oficial_nome,
      oficial_patente: depoimentoForm.oficial_patente || null,
      oficial_re: depoimentoForm.oficial_re || null,
      depoimento: depoimentoForm.depoimento,
      data_depoimento: depoimentoForm.data_depoimento,
      oficial_batalhao: depoimentoForm.oficial_batalhao || null,
      relatorio_id_ip: depoimentoForm.relatorio_id_ip && depoimentoForm.relatorio_id_ip !== "none" ? depoimentoForm.relatorio_id_ip : null,
      relatorio_id_ato: depoimentoForm.relatorio_id_ato && depoimentoForm.relatorio_id_ato !== "none" ? depoimentoForm.relatorio_id_ato : null,
      investigacao_id: depoimentoForm.investigacao_id && depoimentoForm.investigacao_id !== "none" ? depoimentoForm.investigacao_id : null,
      observacao: depoimentoForm.observacao || null
    }).eq("id", editingDepoimentoId);

    setSubmittingDepoimento(false);
    if (error) return toast.error("Erro ao atualizar depoimento: " + error.message);

    toast.success("Depoimento atualizado!");
    setIsEditDepoimentoDialogOpen(false);
    setEditingDepoimentoId(null);
    setDepoimentoForm({
      oficial_nome: "",
      oficial_patente: "",
      oficial_re: "",
      depoimento: "",
      data_depoimento: format(new Date(), "yyyy-MM-dd"),
      oficial_batalhao: "",
      relatorio_id_ip: "",
      relatorio_id_ato: "",
      investigacao_id: "",
      observacao: ""
    });
  };

  // --- Relatório Geral Handlers ---

  const submitRelatorioGeral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relatorioGeralForm.titulo || !relatorioGeralForm.conteudo) {
      return toast.error("Preencha título e conteúdo do relatório");
    }
    setSubmittingRelatorioGeral(true);
    const { data, error } = await supabase.from("relatorios").insert([{
      titulo: relatorioGeralForm.titulo,
      tipo_denuncia: "Relatório Geral",
      oficial: user?.user_metadata?.full_name || user?.email || "Oficial",
      conteudo: relatorioGeralForm.conteudo,
      status: "pendente",
      dados_detalhados: {}
    }]).select();

    setSubmittingRelatorioGeral(false);
    if (error || !data) return toast.error("Erro ao criar relatório: " + (error?.message || "Erro desconhecido"));

    const newRgId = data[0].id;

    // Vincular documentos
    for (const v of relatorioGeralForm.vinculos) {
      await supabase.from("relatorio_geral_vinculos").insert({
        relatorio_id: newRgId,
        entidade_id: v.entidade_id,
        entidade_tipo: v.entidade_tipo
      });
    }
    setRelatorioGeralVinculos(prev => [...prev, ...relatorioGeralForm.vinculos.map(v => ({
      id: crypto.randomUUID(),
      relatorio_id: newRgId,
      entidade_id: v.entidade_id,
      entidade_tipo: v.entidade_tipo,
      created_at: new Date().toISOString()
    }))]);

    setRelatorios(prev => [data[0] as Relatorio, ...prev]);
    setRelatorioGeralForm({ titulo: "", conteudo: "", vinculos: [] });
    setIsRelatorioGeralDialogOpen(false);
    toast.success("Relatório Geral criado com sucesso!");
  };

  const handleEditRelatorioGeral = (rg: Relatorio) => {
    const vinculos = relatorioGeralVinculos.filter(v => v.relatorio_id === rg.id);
    setRelatorioGeralForm({
      titulo: rg.titulo,
      conteudo: rg.conteudo,
      vinculos: vinculos.map(v => ({ entidade_id: v.entidade_id, entidade_tipo: v.entidade_tipo }))
    });
    setEditingRelatorioGeralId(rg.id);
    setIsEditRelatorioGeralDialogOpen(true);
  };

  const updateRelatorioGeral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRelatorioGeralId) return;
    setSubmittingRelatorioGeral(true);
    const { error } = await supabase.from("relatorios").update({
      titulo: relatorioGeralForm.titulo,
      conteudo: relatorioGeralForm.conteudo
    }).eq("id", editingRelatorioGeralId);
    setSubmittingRelatorioGeral(false);
    if (error) return toast.error("Erro ao atualizar: " + error.message);
    setRelatorios(prev => prev.map(r => r.id === editingRelatorioGeralId ? { ...r, titulo: relatorioGeralForm.titulo, conteudo: relatorioGeralForm.conteudo } : r));
    setEditingRelatorioGeralId(null);
    setIsEditRelatorioGeralDialogOpen(false);
    toast.success("Relatório Geral atualizado!");
  };

  const confirmDeleteRelatorioGeral = (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Excluir Relatório Geral",
      description: "Tem certeza que deseja excluir este relatório permanentemente? Esta ação não pode ser desfeita.",
      loading: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
        const { error } = await supabase.from("relatorios").delete().eq("id", id);
        setConfirmDialog(prev => ({ ...prev, loading: false, open: false }));
        if (error) return toast.error("Erro ao excluir: " + error.message);
        setRelatorios(prev => prev.filter(r => r.id !== id));
        setRelatorioGeralVinculos(prev => prev.filter(v => v.relatorio_id !== id));
        toast.success("Relatório Geral excluído!");
      }
    });
  };

  const deleteRelatorioGeralVinculo = async (vinculoId: string) => {
    const { error } = await supabase.from("relatorio_geral_vinculos").delete().eq("id", vinculoId);
    if (error) return toast.error("Erro ao desanexar: " + error.message);
    setRelatorioGeralVinculos(prev => prev.filter(v => v.id !== vinculoId));
    toast.success("Documento desanexado!");
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

    // Vincular denúncias
    for (const denId of investigacaoForm.denuncia_ids) {
      await supabase.from("denuncia_investigacao").insert({
        denuncia_id: denId,
        investigacao_id: newInvId
      });
      setDenunciaInvestigacoes(prev => [...prev, { denuncia_id: denId, investigacao_id: newInvId }]);
    }

    // Vincular documentos
    for (const relId of [...investigacaoForm.relatorio_ids_ip, ...investigacaoForm.relatorio_ids_ato]) {
      await supabase.from("investigacao_relatorio").insert({
        investigacao_id: newInvId,
        relatorio_id: relId
      });
      setInvestigacaoRelatorios(prev => [...prev, { investigacao_id: newInvId, relatorio_id: relId }]);
    }

    // Vincular depoimentos
    for (const depId of investigacaoForm.depoimento_ids) {
      await supabase.from("depoimentos").update({ investigacao_id: newInvId }).eq("id", depId);
    }
    setDepoimentos(prev => prev.map(d => investigacaoForm.depoimento_ids.includes(d.id) ? { ...d, investigacao_id: newInvId } : d));

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
      denuncia_ids: [], 
      relatorio_ids_ip: [],
      relatorio_ids_ato: [],
      depoimento_ids: [],
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
    const linkedDenunciaIds = denunciaInvestigacoes.filter(di => di.investigacao_id === inv.id).map(di => di.denuncia_id);
    const linkedRelatorios = investigacaoRelatorios.filter(ir => ir.investigacao_id === inv.id).map(ir => ir.relatorio_id);
    const linkedRelatoriosIP = relatorios.filter(r => linkedRelatorios.includes(r.id) && r.tipo_denuncia === "Inquérito Policial").map(r => r.id);
    const linkedRelatoriosAto = relatorios.filter(r => linkedRelatorios.includes(r.id) && r.tipo_denuncia === "Ato Administrativo").map(r => r.id);
    const linkedDepoimentoIds = depoimentos.filter(d => d.investigacao_id === inv.id).map(d => d.id);
    setInvestigacaoForm({
      titulo: inv.titulo || "",
      descricao: inv.descricao || "",
      investigado: inv.investigado || "",
      status: inv.status || "pendente",
      denuncia_ids: linkedDenunciaIds,
      relatorio_ids_ip: linkedRelatoriosIP,
      relatorio_ids_ato: linkedRelatoriosAto,
      depoimento_ids: linkedDepoimentoIds,
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

    // Sincronizar junction tables
    const invId = editingInvestigacaoId;

    // Denúncias
    const currentDenIds = denunciaInvestigacoes.filter(di => di.investigacao_id === invId).map(di => di.denuncia_id);
    const toRemoveDen = currentDenIds.filter(id => !investigacaoForm.denuncia_ids.includes(id));
    const toAddDen = investigacaoForm.denuncia_ids.filter(id => !currentDenIds.includes(id));
    for (const denId of toRemoveDen) {
      await supabase.from("denuncia_investigacao").delete().eq("investigacao_id", invId).eq("denuncia_id", denId);
      setDenunciaInvestigacoes(prev => prev.filter(di => !(di.investigacao_id === invId && di.denuncia_id === denId)));
    }
    for (const denId of toAddDen) {
      await supabase.from("denuncia_investigacao").insert({ denuncia_id: denId, investigacao_id: invId });
      setDenunciaInvestigacoes(prev => [...prev, { denuncia_id: denId, investigacao_id: invId }]);
    }

    // Relatórios (IP + Ato)
    const currentRelIds = investigacaoRelatorios.filter(ir => ir.investigacao_id === invId).map(ir => ir.relatorio_id);
    const newRelIds = [...investigacaoForm.relatorio_ids_ip, ...investigacaoForm.relatorio_ids_ato];
    const toRemoveRel = currentRelIds.filter(id => !newRelIds.includes(id));
    const toAddRel = newRelIds.filter(id => !currentRelIds.includes(id));
    for (const relId of toRemoveRel) {
      await supabase.from("investigacao_relatorio").delete().eq("investigacao_id", invId).eq("relatorio_id", relId);
      setInvestigacaoRelatorios(prev => prev.filter(ir => !(ir.investigacao_id === invId && ir.relatorio_id === relId)));
    }
    for (const relId of toAddRel) {
      await supabase.from("investigacao_relatorio").insert({ investigacao_id: invId, relatorio_id: relId });
      setInvestigacaoRelatorios(prev => [...prev, { investigacao_id: invId, relatorio_id: relId }]);
    }

    // Depoimentos - update investigacao_id FK
    const currentDepIds = depoimentos.filter(d => d.investigacao_id === invId).map(d => d.id);
    const toRemoveDep = currentDepIds.filter(id => !investigacaoForm.depoimento_ids.includes(id));
    const toAddDep = investigacaoForm.depoimento_ids.filter(id => !currentDepIds.includes(id));
    for (const depId of toRemoveDep) {
      await supabase.from("depoimentos").update({ investigacao_id: null }).eq("id", depId);
    }
    for (const depId of toAddDep) {
      await supabase.from("depoimentos").update({ investigacao_id: invId }).eq("id", depId);
    }
    if (toRemoveDep.length > 0 || toAddDep.length > 0) {
      setDepoimentos(prev => prev.map(d => {
        if (toRemoveDep.includes(d.id)) return { ...d, investigacao_id: null };
        if (toAddDep.includes(d.id)) return { ...d, investigacao_id: invId };
        return d;
      }));
    }

    setInvestigacoes(prev => prev.map(i => i.id === invId ? { 
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

  const confirmDeleteDocumento = (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Excluir Documento",
      description: "Tem certeza que deseja excluir este documento permanentemente? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
        const { error } = await supabase.from("relatorios").delete().eq("id", id);
        setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
        if (error) return toast.error("Erro ao excluir documento");
        setRelatorios(prev => prev.filter(r => r.id !== id));
        toast.success("Documento excluído com sucesso");
      },
    });
  };

  const confirmDeleteInvestigacao = (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Excluir Investigação",
      description: "Tem certeza que deseja excluir esta investigação e todos os seus vínculos? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
        const { error } = await supabase.from("investigacoes").delete().eq("id", id);
        setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
        if (error) return toast.error("Erro ao excluir investigação");
        setInvestigacoes(prev => prev.filter(i => i.id !== id));
        toast.success("Investigação excluída com sucesso");
      },
    });
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
      setDenunciaRelatorios(prev => 
        prev.some(dr => dr.denuncia_id === denunciaId && dr.relatorio_id === linkRelatorioId)
          ? prev
          : [...prev, { denuncia_id: denunciaId, relatorio_id: linkRelatorioId }]
      );
      setLinkRelatorioId("");
    }
  };

  const handleUnlinkRelatorio = async (denunciaId: string, relatorioId: string) => {
    setLinking(true);
    const { error } = await supabase.from("denuncia_relatorio").delete().match({
      denuncia_id: denunciaId,
      relatorio_id: relatorioId
    });
    setLinking(false);
    if (error) return toast.error("Erro ao desanexar");
    setDenunciaRelatorios(prev => prev.filter(dr => !(dr.denuncia_id === denunciaId && dr.relatorio_id === relatorioId)));
    toast.success("Documento desanexado!");
  };

  const handleLinkAllRelatorios = async (denunciaId: string, relatorioIds: string[]) => {
    if (relatorioIds.length === 0) return toast.error("Nenhum documento disponível");
    setLinking(true);
    const inserts = relatorioIds.map(relatorio_id => ({
      denuncia_id: denunciaId,
      relatorio_id
    }));
    const { error } = await supabase.from("denuncia_relatorio").insert(inserts);
    setLinking(false);
    if (error) return toast.error("Erro ao vincular documentos");
    toast.success(`${relatorioIds.length} documento(s) anexado(s)!`);
    setLinkRelatorioId("");
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
      setDenunciaRelatorios(prev =>
        prev.some(dr => dr.denuncia_id === linkDenunciaId && dr.relatorio_id === relatorioId)
          ? prev
          : [...prev, { denuncia_id: linkDenunciaId, relatorio_id: relatorioId }]
      );
      setLinkDenunciaId("");
    }
  };

  const handleUnlinkDenuncia = async (denunciaId: string, relatorioId: string) => {
    setLinking(true);
    const { error } = await supabase.from("denuncia_relatorio").delete().match({
      denuncia_id: denunciaId,
      relatorio_id: relatorioId
    });
    setLinking(false);
    if (error) return toast.error("Erro ao desanexar denúncia");
    setDenunciaRelatorios(prev => prev.filter(dr => !(dr.denuncia_id === denunciaId && dr.relatorio_id === relatorioId)));
    toast.success("Denúncia desanexada!");
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
      setInvestigacaoRelatorios(prev =>
        prev.some(ir => ir.investigacao_id === linkInvestigacaoId && ir.relatorio_id === relatorioId)
          ? prev
          : [...prev, { investigacao_id: linkInvestigacaoId, relatorio_id: relatorioId }]
      );
      setLinkInvestigacaoId("");
    }
  };

  const handleUnlinkInvestigacaoRelatorio = async (investigacaoId: string, relatorioId: string) => {
    setLinking(true);
    const { error } = await supabase.from("investigacao_relatorio").delete().match({
      investigacao_id: investigacaoId,
      relatorio_id: relatorioId
    });
    setLinking(false);
    if (error) return toast.error("Erro ao desanexar investigação");
    setInvestigacaoRelatorios(prev => prev.filter(ir => !(ir.investigacao_id === investigacaoId && ir.relatorio_id === relatorioId)));
    toast.success("Investigação desanexada!");
  };

  const confirmDeleteOficial = (userId: string) => {
    setConfirmDialog({
      open: true,
      title: "Remover Acesso",
      description: "Tem certeza que deseja REMOVER o acesso deste oficial permanentemente? Ele não poderá mais acessar o sistema.",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
        setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
        if (error) {
          console.error("Erro ao remover oficial:", error);
          toast.error("Erro ao remover acesso");
        } else {
          toast.success("Acesso removido com sucesso");
          setOficiais(prev => prev.filter(o => o.id !== userId));
        }
      },
    });
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
    navigate({ to: "/" });
  };

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-4xl space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <SkeletonTable rows={6} />
        </div>
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
    <>
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-mono">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:translate-x-0`}>
        <div className="flex items-center justify-between border-b border-border p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
              <Shield className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">MDT Policial</h1>
              <p className="text-[10px] text-muted-foreground tracking-widest">SECURE TERMINAL</p>
            </div>
          </div>
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 mt-4">Operações</p>
          
          <SidebarItem 
            active={activeTab === "dashboard"} 
            onClick={() => handleTabChange("dashboard")} 
            icon={LayoutDashboard} 
            label="Dashboard" 
          />
          <SidebarItem 
            active={activeTab === "denuncias"} 
            onClick={() => handleTabChange("denuncias")} 
            icon={Activity} 
            label="Denúncias" 
          />
          <SidebarItem 
            active={activeTab === "investigacoes"} 
            onClick={() => handleTabChange("investigacoes")} 
            icon={Shield} 
            label="Investigações" 
          />
          <SidebarItem 
            active={activeTab === "inqueritos"} 
            onClick={() => handleTabChange("inqueritos")} 
            icon={FileSignature} 
            label="Inquéritos" 
          />
          <SidebarItem 
            active={activeTab === "atos"} 
            onClick={() => handleTabChange("atos")} 
            icon={FileText} 
            label="Atos Adm." 
          />
          <SidebarItem 
            active={activeTab === "depoimentos"} 
            onClick={() => handleTabChange("depoimentos")} 
            icon={MessageSquare} 
            label="Depoimentos" 
          />
          <SidebarItem 
            active={activeTab === "relatorios_gerais"} 
            onClick={() => handleTabChange("relatorios_gerais")} 
            icon={FileSignature} 
            label="Rel. Gerais" 
          />
          <SidebarItem 
            active={activeTab === "oficiais"} 
            onClick={() => handleTabChange("oficiais")} 
            icon={Users} 
            label="Oficiais" 
          />

          {isAdmin && (
            <>
              <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 mt-8">Administrativo</p>
              <SidebarItem 
                active={activeTab === "solicitacoes"} 
                onClick={() => handleTabChange("solicitacoes")} 
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
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 lg:px-8 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Sistema Operacional</span>
              <h2 className="text-lg lg:text-2xl font-bold uppercase tracking-wider text-foreground">
                Bem-Vindo, {user?.user_metadata?.full_name || "Oficial"}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-foreground">{user?.user_metadata?.full_name}</div>
            <div className="text-xs text-muted-foreground">Badge #{user?.user_metadata?.badge_number || "000"}</div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          
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
            <div className="space-y-6 animate-fade-in">
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
                      <div key={d.id} className="rounded-lg border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_20px_-8px_rgba(201,160,58,0.15)]">
                        <button
                          onClick={() => setExpandedId(expanded ? null : d.id)}
                          className="flex w-full items-start justify-between gap-4 p-5 text-left transition-all duration-200 hover:bg-muted"
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
                                        <div className="flex items-center gap-1">
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
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                            onClick={() => handleUnlinkRelatorio(d.id, r.id)}
                                            title="Desanexar"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
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
                                  className="bg-card hover:bg-slate-700 text-white"
                                >
                                  {linking ? "Vinculando..." : "Vincular"}
                                </Button>
                                {availableRelatorios.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleLinkAllRelatorios(d.id, availableRelatorios.map(r => r.id))}
                                    disabled={linking}
                                    className="border-border text-muted-foreground hover:text-foreground text-xs"
                                  >
                                    {linking ? "Vinculando..." : "Vincular Todos"}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Investigações Vinculadas */}
                            <div className="rounded border border-border bg-muted p-4">
                              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                <Shield className="h-4 w-4" /> Investigações Vinculadas
                              </div>

                              {(() => {
                                const linkedInvestigacoes = denunciaInvestigacoes
                                  .filter(di => di.denuncia_id === d.id)
                                  .map(di => investigacoes.find(inv => inv.id === di.investigacao_id))
                                  .filter(Boolean) as Investigacao[];

                                const availableInvestigacoes = investigacoes.filter(
                                  inv => !denunciaInvestigacoes.some(di => di.denuncia_id === d.id && di.investigacao_id === inv.id)
                                );

                                return (
                                  <>
                                    {linkedInvestigacoes.length > 0 ? (
                                      <div className="space-y-2 mb-4">
                                        {linkedInvestigacoes.map(inv => (
                                          <div key={inv.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                            <div className="flex items-center gap-3">
                                              <Shield className="h-4 w-4 text-foreground" />
                                              <span className="text-foreground font-bold">{inv.titulo}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Button size="sm" variant="ghost" className="h-7 text-xs text-foreground"
                                                onClick={() => { setActiveTab("investigacoes"); setExpandedId(inv.id); }}>
                                                Ver Investigação
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                                onClick={async () => {
                                                  setLinking(true);
                                                  await supabase.from("denuncia_investigacao").delete().match({ denuncia_id: d.id, investigacao_id: inv.id });
                                                  setLinking(false);
                                                  setDenunciaInvestigacoes(prev => prev.filter(di => !(di.denuncia_id === d.id && di.investigacao_id === inv.id)));
                                                  toast.success("Investigação desanexada!");
                                                }}
                                                title="Desanexar"
                                              >
                                                <X className="h-3.5 w-3.5" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground mb-4">Nenhuma investigação vinculada a esta denúncia.</p>
                                    )}

                                    <div className="flex gap-2 items-end">
                                      <div className="flex-1">
                                        <select
                                          value={linkInvestigacaoDenunciaId}
                                          onChange={(e) => setLinkInvestigacaoDenunciaId(e.target.value)}
                                          className="w-full h-9 bg-muted border border-border text-foreground text-xs rounded px-2"
                                        >
                                          <option value="">Selecione uma investigação...</option>
                                          {availableInvestigacoes.map(inv => (
                                            <option key={inv.id} value={inv.id}>{inv.titulo}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={async () => {
                                          if (!linkInvestigacaoDenunciaId) return toast.error("Selecione uma investigação");
                                          setLinking(true);
                                          const { error } = await supabase.from("denuncia_investigacao").insert({
                                            denuncia_id: d.id,
                                            investigacao_id: linkInvestigacaoDenunciaId
                                          });
                                          setLinking(false);
                                          if (error) return toast.error("Erro ao vincular investigação");
                                          toast.success("Investigação anexada!");
                                          setDenunciaInvestigacoes(prev =>
                                            prev.some(di => di.denuncia_id === d.id && di.investigacao_id === linkInvestigacaoDenunciaId)
                                              ? prev
                                              : [...prev, { denuncia_id: d.id, investigacao_id: linkInvestigacaoDenunciaId }]
                                          );
                                          setLinkInvestigacaoDenunciaId("");
                                        }}
                                        disabled={linking || !linkInvestigacaoDenunciaId}
                                        className="bg-card hover:bg-slate-700 text-white text-xs h-9"
                                      >
                                        {linking ? "Vinculando..." : "Vincular"}
                                      </Button>
                                      {availableInvestigacoes.length > 0 && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={async () => {
                                            setLinking(true);
                                            const inserts = availableInvestigacoes.map(inv => ({
                                              denuncia_id: d.id,
                                              investigacao_id: inv.id
                                            }));
                                            const { error } = await supabase.from("denuncia_investigacao").insert(inserts);
                                            setLinking(false);
                                            if (error) return toast.error("Erro ao vincular investigações");
                                            toast.success(`${inserts.length} investigação(ões) anexada(s)!`);
                                            setDenunciaInvestigacoes(prev => {
                                              const existing = prev.filter(di => di.denuncia_id === d.id);
                                              const newOnes = inserts.filter(
                                                ins => !existing.some(ex => ex.investigacao_id === ins.investigacao_id)
                                              );
                                              return [...prev, ...newOnes] as DenunciaInvestigacao[];
                                            });
                                          }}
                                          disabled={linking}
                                          className="border-border text-muted-foreground hover:text-foreground text-xs h-9"
                                        >
                                          {linking ? "Vinculando..." : "Vincular Todas"}
                                        </Button>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            {/* Depoimentos Vinculados */}
                            <div className="rounded border border-border bg-muted p-4">
                              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                <MessageSquare className="h-4 w-4" /> Depoimentos Vinculados
                              </div>

                              {(() => {
                                const linkedDepoimentos = denunciaDepoimentos
                                  .filter(dd => dd.denuncia_id === d.id)
                                  .map(dd => depoimentos.find(dep => dep.id === dd.depoimento_id))
                                  .filter(Boolean) as Depoimento[];

                                const availableDepoimentos = depoimentos.filter(
                                  dep => !denunciaDepoimentos.some(dd => dd.denuncia_id === d.id && dd.depoimento_id === dep.id)
                                );

                                return (
                                  <>
                                    {linkedDepoimentos.length > 0 ? (
                                      <div className="space-y-2 mb-4">
                                        {linkedDepoimentos.map(dep => (
                                          <div key={dep.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                            <div className="flex items-center gap-3">
                                              <MessageSquare className="h-4 w-4 text-foreground" />
                                              <span className="text-foreground font-bold">{dep.oficial_nome}</span>
                                              <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">
                                                {format(new Date(dep.data_depoimento), "dd/MM/yyyy")}
                                              </Badge>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                              onClick={async () => {
                                                setLinking(true);
                                                await supabase.from("denuncia_depoimento").delete().match({ denuncia_id: d.id, depoimento_id: dep.id });
                                                setLinking(false);
                                                setDenunciaDepoimentos(prev => prev.filter(dd => !(dd.denuncia_id === d.id && dd.depoimento_id === dep.id)));
                                                toast.success("Depoimento desanexado!");
                                              }}
                                              title="Desanexar"
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground mb-4">Nenhum depoimento vinculado a esta denúncia.</p>
                                    )}

                                    <div className="flex gap-2 items-end">
                                      <div className="flex-1">
                                        <select
                                          value={linkDepoimentoDenunciaId}
                                          onChange={(e) => setLinkDepoimentoDenunciaId(e.target.value)}
                                          className="w-full h-9 bg-muted border border-border text-foreground text-xs rounded px-2"
                                        >
                                          <option value="">Selecione um depoimento...</option>
                                          {availableDepoimentos.map(dep => (
                                            <option key={dep.id} value={dep.id}>{dep.oficial_nome} - {format(new Date(dep.data_depoimento), "dd/MM/yyyy")}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={async () => {
                                          if (!linkDepoimentoDenunciaId) return toast.error("Selecione um depoimento");
                                          setLinking(true);
                                          const { error } = await supabase.from("denuncia_depoimento").insert({
                                            denuncia_id: d.id,
                                            depoimento_id: linkDepoimentoDenunciaId
                                          });
                                          setLinking(false);
                                          if (error) return toast.error("Erro ao vincular depoimento");
                                          toast.success("Depoimento anexado!");
                                          setDenunciaDepoimentos(prev =>
                                            prev.some(dd => dd.denuncia_id === d.id && dd.depoimento_id === linkDepoimentoDenunciaId)
                                              ? prev
                                              : [...prev, { denuncia_id: d.id, depoimento_id: linkDepoimentoDenunciaId }]
                                          );
                                          setLinkDepoimentoDenunciaId("");
                                        }}
                                        disabled={linking || !linkDepoimentoDenunciaId}
                                        className="bg-card hover:bg-slate-700 text-white text-xs h-9"
                                      >
                                        {linking ? "Vinculando..." : "Vincular"}
                                      </Button>
                                      {availableDepoimentos.length > 0 && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={async () => {
                                            setLinking(true);
                                            const inserts = availableDepoimentos.map(dep => ({
                                              denuncia_id: d.id,
                                              depoimento_id: dep.id
                                            }));
                                            const { error } = await supabase.from("denuncia_depoimento").insert(inserts);
                                            setLinking(false);
                                            if (error) return toast.error("Erro ao vincular depoimentos");
                                            toast.success(`${inserts.length} depoimento(s) anexado(s)!`);
                                            setDenunciaDepoimentos(prev => {
                                              const existing = prev.filter(dd => dd.denuncia_id === d.id);
                                              const newOnes = inserts.filter(
                                                ins => !existing.some(ex => ex.depoimento_id === ins.depoimento_id)
                                              );
                                              return [...prev, ...newOnes] as DenunciaDepoimento[];
                                            });
                                          }}
                                          disabled={linking}
                                          className="border-border text-muted-foreground hover:text-foreground text-xs h-9"
                                        >
                                          {linking ? "Vinculando..." : "Vincular Todos"}
                                        </Button>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            {/* Relatórios Gerais Vinculados */}
                            <div className="rounded border border-border bg-muted p-4">
                              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                <FileSignature className="h-4 w-4" /> Relatórios Gerais Vinculados
                              </div>
                              {(() => {
                                const linkedRg = relatorioGeralVinculos
                                  .filter(v => v.entidade_id === d.id && v.entidade_tipo === "denuncia")
                                  .map(v => relatorios.find(r => r.id === v.relatorio_id))
                                  .filter(Boolean) as Relatorio[];
                                return linkedRg.length > 0 ? (
                                  <div className="space-y-2 mb-4">
                                    {linkedRg.map(rg => (
                                      <div key={rg.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                        <div className="flex items-center gap-3">
                                          <FileSignature className="h-4 w-4 text-foreground shrink-0" />
                                          <span className="text-foreground font-bold">{rg.titulo}</span>
                                          <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">Rel. Geral</Badge>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs text-foreground"
                                          onClick={() => { setActiveTab("relatorios_gerais"); setExpandedId(rg.id); }}>
                                          Ver
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground mb-4">Nenhum Relatório Geral vinculado.</p>
                                );
                              })()}
                            </div>

                            {/* DADOS DETALHADOS (SE EXISTIREM) */}
                            {d.dados_detalhados && (
                              <div className="mt-4 space-y-4 animate-in fade-in duration-500">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="border-l-2 border-primary pl-3 bg-muted/50 py-2">
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
                                      <Badge variant="outline" className="text-[9px] bg-card text-muted-foreground">
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
                                    {d.dados_detalhados.provas_outro && <Badge variant="outline" className="text-[9px] bg-card text-muted-foreground">{d.dados_detalhados.provas_outro}</Badge>}
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
                                      <SelectItem key={s} value={s} className="hover:bg-muted">{STATUS_LABEL[s]}</SelectItem>
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
                                className="mt-3 bg-card hover:bg-slate-700 text-white"
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
            <div className="space-y-6 animate-fade-in">
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
                              disabled
                              className="bg-background border-border text-muted-foreground h-8 text-xs" 
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
                          <div className="space-y-4 mt-2">
                            <div className="space-y-1">
                              <Label className="text-muted-foreground text-[10px] uppercase">Depoimentos Vinculados</Label>
                              <div className="flex flex-wrap gap-1 mb-1">
                                {investigacaoForm.depoimento_ids.map((id: string) => {
                                  const dep = depoimentos.find(x => x.id === id);
                                  return (
                                    <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                      {dep?.oficial_nome || 'N/A'}
                                      <button type="button" onClick={() => setInvestigacaoForm({...investigacaoForm, depoimento_ids: investigacaoForm.depoimento_ids.filter(x => x !== id)})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                                    </Badge>
                                  );
                                })}
                              </div>
                              <select className="w-full h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v && !investigacaoForm.depoimento_ids.includes(v)) { setInvestigacaoForm({...investigacaoForm, depoimento_ids: [...investigacaoForm.depoimento_ids, v]}); }}}>
                                <option value="">Adicionar depoimento...</option>
                                {depoimentos.filter(d => !investigacaoForm.depoimento_ids.includes(d.id)).map(d => (
                                  <option key={d.id} value={d.id}>{d.oficial_nome} - {format(new Date(d.data_depoimento), "dd/MM/yyyy")}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-muted-foreground text-[10px] uppercase">Denúncias Vinculadas</Label>
                              <div className="flex flex-wrap gap-1 mb-1">
                                {investigacaoForm.denuncia_ids.map((id: string) => {
                                  const d = denuncias.find(x => x.id === id);
                                  return (
                                    <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                      #{d?.numero_registro || '?'} - {d?.titulo || 'N/A'}
                                      <button type="button" onClick={() => setInvestigacaoForm({...investigacaoForm, denuncia_ids: investigacaoForm.denuncia_ids.filter(x => x !== id)})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                                    </Badge>
                                  );
                                })}
                              </div>
                              <select className="w-full h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v && !investigacaoForm.denuncia_ids.includes(v)) { setInvestigacaoForm({...investigacaoForm, denuncia_ids: [...investigacaoForm.denuncia_ids, v]}); }}}>
                                <option value="">Adicionar denúncia...</option>
                                {denuncias.filter(d => !investigacaoForm.denuncia_ids.includes(d.id)).map(d => (
                                  <option key={d.id} value={d.id}>#{d.numero_registro} - {d.titulo}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-muted-foreground text-[10px] uppercase">Inquéritos Vinculados</Label>
                              <div className="flex flex-wrap gap-1 mb-1">
                                {investigacaoForm.relatorio_ids_ip.map((id: string) => {
                                  const r = relatorios.find(x => x.id === id);
                                  return (
                                    <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                      #{r?.numero_registro || '?'} - {r?.titulo || 'N/A'}
                                      <button type="button" onClick={() => setInvestigacaoForm({...investigacaoForm, relatorio_ids_ip: investigacaoForm.relatorio_ids_ip.filter(x => x !== id)})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                                    </Badge>
                                  );
                                })}
                              </div>
                              <select className="w-full h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v && !investigacaoForm.relatorio_ids_ip.includes(v)) { setInvestigacaoForm({...investigacaoForm, relatorio_ids_ip: [...investigacaoForm.relatorio_ids_ip, v]}); }}}>
                                <option value="">Adicionar inquérito...</option>
                                {relatorios.filter(r => r.tipo_denuncia === "Inquérito Policial").filter(r => !investigacaoForm.relatorio_ids_ip.includes(r.id)).map(r => (
                                  <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-muted-foreground text-[10px] uppercase">Atos Adm Vinculados</Label>
                              <div className="flex flex-wrap gap-1 mb-1">
                                {investigacaoForm.relatorio_ids_ato.map((id: string) => {
                                  const r = relatorios.find(x => x.id === id);
                                  return (
                                    <Badge key={id} variant="secondary" className="text-[9px] flex items-center gap-1">
                                      #{r?.numero_registro || '?'} - {r?.titulo || 'N/A'}
                                      <button type="button" onClick={() => setInvestigacaoForm({...investigacaoForm, relatorio_ids_ato: investigacaoForm.relatorio_ids_ato.filter(x => x !== id)})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                                    </Badge>
                                  );
                                })}
                              </div>
                              <select className="w-full h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value="" onChange={(e) => { const v = e.target.value; if (v && !investigacaoForm.relatorio_ids_ato.includes(v)) { setInvestigacaoForm({...investigacaoForm, relatorio_ids_ato: [...investigacaoForm.relatorio_ids_ato, v]}); }}}>
                                <option value="">Adicionar ato adm...</option>
                                {relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo").filter(r => !investigacaoForm.relatorio_ids_ato.includes(r.id)).map(r => (
                                  <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                                ))}
                              </select>
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
                                  onClick={() => confirmDeleteInvestigacao(inv.id)}
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
                              </div>

                              <div className="rounded border border-border bg-muted p-4">
                                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                  <MessageSquare className="h-4 w-4" /> Depoimentos Vinculados
                                </div>
                                {(() => {
                                  const linkedDepoimentos = depoimentos.filter(d => d.investigacao_id === inv.id);
                                  return linkedDepoimentos.length > 0 ? (
                                    <div className="space-y-2 mb-4">
                                      {linkedDepoimentos.map(dep => (
                                        <div key={dep.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                          <div className="flex items-center gap-3">
                                            <MessageSquare className="h-4 w-4 text-foreground shrink-0" />
                                            <span className="text-foreground font-bold">{dep.oficial_nome}</span>
                                            <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">
                                              {format(new Date(dep.data_depoimento), "dd/MM/yyyy")}
                                            </Badge>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground mb-4">Nenhum depoimento anexado.</p>
                                  );
                                })()}
                              </div>

                              {/* Relatórios Gerais Vinculados */}
                              <div className="rounded border border-border bg-muted p-4">
                                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                  <FileSignature className="h-4 w-4" /> Relatórios Gerais Vinculados
                                </div>
                                {(() => {
                                  const linkedRg = relatorioGeralVinculos
                                    .filter(v => v.entidade_id === inv.id && v.entidade_tipo === "investigacao")
                                    .map(v => relatorios.find(r => r.id === v.relatorio_id))
                                    .filter(Boolean) as Relatorio[];
                                  return linkedRg.length > 0 ? (
                                    <div className="space-y-2 mb-4">
                                      {linkedRg.map(rg => (
                                        <div key={rg.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                          <div className="flex items-center gap-3">
                                            <FileSignature className="h-4 w-4 text-foreground shrink-0" />
                                            <span className="text-foreground font-bold">{rg.titulo}</span>
                                            <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">Rel. Geral</Badge>
                                          </div>
                                          <Button size="sm" variant="ghost" className="h-7 text-xs text-foreground"
                                            onClick={() => { setActiveTab("relatorios_gerais"); setExpandedId(rg.id); }}>
                                            Ver
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground mb-4">Nenhum Relatório Geral vinculado.</p>
                                  );
                                })()}
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
                                    className="mt-3 bg-card hover:bg-slate-700 text-white text-xs"
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
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col gap-4 border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Inquéritos Policiais</h3>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setRelatorioForm({...relatorioForm, tipo_denuncia: "Inquérito Policial", oficial: user?.user_metadata?.full_name || ""})}
                        className="bg-primary hover:bg-primary/80 text-white font-bold tracking-wider uppercase text-xs"
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
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Sim" id="anon-sim" className="border-border text-primary" /><Label htmlFor="anon-sim" className="text-xs text-foreground font-normal">Sim</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Não" id="anon-nao" className="border-border text-primary" /><Label htmlFor="anon-nao" className="text-xs text-foreground font-normal">Não</Label></div>
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
                          <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/80 text-white font-bold tracking-widest px-8 uppercase text-[10px]">
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
                          onDelete={confirmDeleteDocumento}
                          onUpdateStatus={updateRelatorioStatus}
                          denuncias={denuncias}
                          investigacoes={investigacoes}
                          denunciaRelatorios={denunciaRelatorios}
                          investigacaoRelatorios={investigacaoRelatorios}
                          onLinkDenuncia={handleLinkDenuncia}
                          onUnlinkDenuncia={handleUnlinkDenuncia}
                          onLinkInvestigacao={handleLinkInvestigacao}
                          onUnlinkInvestigacaoRelatorio={handleUnlinkInvestigacaoRelatorio}
                          linking={linking}
                          linkDenunciaId={linkDenunciaId}
                          setLinkDenunciaId={setLinkDenunciaId}
                          linkInvestigacaoId={linkInvestigacaoId}
                          setLinkInvestigacaoId={setLinkInvestigacaoId}
                          depoimentos={depoimentos}
                          onPrint={printRelatorio}
                        />
                      ))
                  )
                }
              </div>
            </div>
          )}

          {/* ATOS ADMINISTRATIVOS TAB */}
          {activeTab === "atos" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col gap-4 border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Atos Administrativos</h3>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setRelatorioForm({...relatorioForm, tipo_denuncia: "Ato Administrativo", oficial: user?.user_metadata?.full_name || ""})}
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
                           onDelete={confirmDeleteDocumento}
                          onUpdateStatus={updateRelatorioStatus}
                          denuncias={denuncias}
                          investigacoes={investigacoes}
                          denunciaRelatorios={denunciaRelatorios}
                          investigacaoRelatorios={investigacaoRelatorios}
                          onLinkDenuncia={handleLinkDenuncia}
                          onUnlinkDenuncia={handleUnlinkDenuncia}
                          onLinkInvestigacao={handleLinkInvestigacao}
                          onUnlinkInvestigacaoRelatorio={handleUnlinkInvestigacaoRelatorio}
                          linking={linking}
                          linkDenunciaId={linkDenunciaId}
                          setLinkDenunciaId={setLinkDenunciaId}
                          linkInvestigacaoId={linkInvestigacaoId}
                          setLinkInvestigacaoId={setLinkInvestigacaoId}
                          depoimentos={depoimentos}
                          onPrint={printRelatorio}
                        />
                      ))
                  )
                }
              </div>
            </div>
          )}

          {/* DEPOIMENTOS */}
          {activeTab === "depoimentos" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Depoimentos
                </h3>
                <Dialog open={isDepoimentoDialogOpen} onOpenChange={setIsDepoimentoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setDepoimentoForm({
                      oficial_nome: "",
                      oficial_patente: "",
                      oficial_re: "",
                      depoimento: "",
                      data_depoimento: format(new Date(), "yyyy-MM-dd"),
                      oficial_batalhao: "",
                      relatorio_id_ip: "",
                      relatorio_id_ato: "",
                      investigacao_id: "",
                      observacao: ""
                    })} className="bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] uppercase tracking-widest">
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
                          <Input value={depoimentoForm.oficial_nome} onChange={(e) => setDepoimentoForm({...depoimentoForm, oficial_nome: e.target.value})} className="h-8 bg-background border-border text-foreground text-xs" placeholder="Nome do oficial" />
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
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase text-muted-foreground">Observações (Interno)</Label>
                        <Textarea rows={3} value={depoimentoForm.observacao} onChange={(e) => setDepoimentoForm({...depoimentoForm, observacao: e.target.value})} className="bg-background border-border text-foreground text-xs leading-relaxed" placeholder="Observações internas sobre o depoimento..." />
                      </div>
                      <div className="pt-2 border-t border-border space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Documentos Anexados</h4>
                        <div className="space-y-1">
                          <Label className="text-[9px] text-muted-foreground uppercase">Inquérito Policial</Label>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {depoimentoForm.relatorio_id_ip && depoimentoForm.relatorio_id_ip !== "none" ? (
                              <Badge variant="secondary" className="text-[9px] flex items-center gap-1">
                                #{relatorios.find(r => r.id === depoimentoForm.relatorio_id_ip)?.numero_registro || '?'} - {relatorios.find(r => r.id === depoimentoForm.relatorio_id_ip)?.titulo || 'N/A'}
                                <button type="button" onClick={() => setDepoimentoForm({...depoimentoForm, relatorio_id_ip: "none"})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                              </Badge>
                            ) : null}
                          </div>
                          <select className="w-full h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value={depoimentoForm.relatorio_id_ip || "none"} onChange={(e) => setDepoimentoForm({...depoimentoForm, relatorio_id_ip: e.target.value})}>
                            <option value="none">Nenhum</option>
                            {relatorios.filter(r => r.tipo_denuncia === "Inquérito Policial").map(r => (
                              <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] text-muted-foreground uppercase">Ato Administrativo</Label>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {depoimentoForm.relatorio_id_ato && depoimentoForm.relatorio_id_ato !== "none" ? (
                              <Badge variant="secondary" className="text-[9px] flex items-center gap-1">
                                #{relatorios.find(r => r.id === depoimentoForm.relatorio_id_ato)?.numero_registro || '?'} - {relatorios.find(r => r.id === depoimentoForm.relatorio_id_ato)?.titulo || 'N/A'}
                                <button type="button" onClick={() => setDepoimentoForm({...depoimentoForm, relatorio_id_ato: "none"})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                              </Badge>
                            ) : null}
                          </div>
                          <select className="w-full h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value={depoimentoForm.relatorio_id_ato || "none"} onChange={(e) => setDepoimentoForm({...depoimentoForm, relatorio_id_ato: e.target.value})}>
                            <option value="none">Nenhum</option>
                            {relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo").map(r => (
                              <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1 border-t border-border/30 pt-3">
                          <Label className="text-[9px] text-muted-foreground uppercase">Investigação Vinculada</Label>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {depoimentoForm.investigacao_id && depoimentoForm.investigacao_id !== "none" ? (
                              <Badge variant="secondary" className="text-[9px] flex items-center gap-1">
                                #{investigacoes.find(i => i.id === depoimentoForm.investigacao_id)?.numero_registro || '?'} - {investigacoes.find(i => i.id === depoimentoForm.investigacao_id)?.titulo || 'N/A'}
                                <button type="button" onClick={() => setDepoimentoForm({...depoimentoForm, investigacao_id: "none"})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                              </Badge>
                            ) : null}
                          </div>
                          <select className="w-full h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value={depoimentoForm.investigacao_id || "none"} onChange={(e) => setDepoimentoForm({...depoimentoForm, investigacao_id: e.target.value})}>
                            <option value="none">Nenhum</option>
                            {investigacoes.map(i => (
                              <option key={i.id} value={i.id}>#{i.numero_registro} - {i.titulo || i.tipo_procedimento}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border flex justify-end">
                        <Button type="submit" disabled={submittingDepoimento} className="bg-primary hover:bg-primary/80 text-white font-bold tracking-widest px-8 uppercase text-[10px]">
                          {submittingDepoimento ? "Registrando..." : "REGISTRAR DEPOIMENTO"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Edit Depoimento Dialog */}
                <Dialog open={isEditDepoimentoDialogOpen} onOpenChange={(open) => {
                  if (!open) {
                    setIsEditDepoimentoDialogOpen(false);
                    setEditingDepoimentoId(null);
                    setDepoimentoForm({
                      oficial_nome: "",
                      oficial_patente: "",
                      oficial_re: "",
                      depoimento: "",
                      data_depoimento: format(new Date(), "yyyy-MM-dd"),
                      oficial_batalhao: "",
                      relatorio_id_ip: "",
                      relatorio_id_ato: "",
                      investigacao_id: "",
                      observacao: ""
                    });
                  }
                }}>
                  <DialogContent className="bg-background border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-foreground uppercase tracking-wider text-sm">Editar Depoimento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={updateDepoimento} className="space-y-5">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase text-muted-foreground">Nome do Oficial *</Label>
                          <Input value={depoimentoForm.oficial_nome} onChange={(e) => setDepoimentoForm({...depoimentoForm, oficial_nome: e.target.value})} className="h-8 bg-background border-border text-foreground text-xs" placeholder="Nome do oficial" />
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
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase text-muted-foreground">Observações (Interno)</Label>
                        <Textarea rows={3} value={depoimentoForm.observacao} onChange={(e) => setDepoimentoForm({...depoimentoForm, observacao: e.target.value})} className="bg-background border-border text-foreground text-xs leading-relaxed" placeholder="Observações internas sobre o depoimento..." />
                      </div>
                      <div className="pt-2 border-t border-border space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Documentos Anexados</h4>
                        <div className="space-y-1">
                          <Label className="text-[9px] text-muted-foreground uppercase">Inquérito Policial</Label>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {depoimentoForm.relatorio_id_ip && depoimentoForm.relatorio_id_ip !== "none" ? (
                              <Badge variant="secondary" className="text-[9px] flex items-center gap-1">
                                #{relatorios.find(r => r.id === depoimentoForm.relatorio_id_ip)?.numero_registro || '?'} - {relatorios.find(r => r.id === depoimentoForm.relatorio_id_ip)?.titulo || 'N/A'}
                                <button type="button" onClick={() => setDepoimentoForm({...depoimentoForm, relatorio_id_ip: "none"})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                              </Badge>
                            ) : null}
                          </div>
                          <select className="w-full h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value={depoimentoForm.relatorio_id_ip || "none"} onChange={(e) => setDepoimentoForm({...depoimentoForm, relatorio_id_ip: e.target.value})}>
                            <option value="none">Nenhum</option>
                            {relatorios.filter(r => r.tipo_denuncia === "Inquérito Policial").map(r => (
                              <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] text-muted-foreground uppercase">Ato Administrativo</Label>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {depoimentoForm.relatorio_id_ato && depoimentoForm.relatorio_id_ato !== "none" ? (
                              <Badge variant="secondary" className="text-[9px] flex items-center gap-1">
                                #{relatorios.find(r => r.id === depoimentoForm.relatorio_id_ato)?.numero_registro || '?'} - {relatorios.find(r => r.id === depoimentoForm.relatorio_id_ato)?.titulo || 'N/A'}
                                <button type="button" onClick={() => setDepoimentoForm({...depoimentoForm, relatorio_id_ato: "none"})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                              </Badge>
                            ) : null}
                          </div>
                          <select className="w-full h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value={depoimentoForm.relatorio_id_ato || "none"} onChange={(e) => setDepoimentoForm({...depoimentoForm, relatorio_id_ato: e.target.value})}>
                            <option value="none">Nenhum</option>
                            {relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo").map(r => (
                              <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1 border-t border-border/30 pt-3">
                          <Label className="text-[9px] text-muted-foreground uppercase">Investigação Vinculada</Label>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {depoimentoForm.investigacao_id && depoimentoForm.investigacao_id !== "none" ? (
                              <Badge variant="secondary" className="text-[9px] flex items-center gap-1">
                                #{investigacoes.find(i => i.id === depoimentoForm.investigacao_id)?.numero_registro || '?'} - {investigacoes.find(i => i.id === depoimentoForm.investigacao_id)?.titulo || 'N/A'}
                                <button type="button" onClick={() => setDepoimentoForm({...depoimentoForm, investigacao_id: "none"})} className="text-red-400 hover:text-red-300 ml-1">&times;</button>
                              </Badge>
                            ) : null}
                          </div>
                          <select className="w-full h-8 bg-background border border-border text-foreground text-[10px] rounded px-2" value={depoimentoForm.investigacao_id || "none"} onChange={(e) => setDepoimentoForm({...depoimentoForm, investigacao_id: e.target.value})}>
                            <option value="none">Nenhum</option>
                            {investigacoes.map(i => (
                              <option key={i.id} value={i.id}>#{i.numero_registro} - {i.titulo || i.tipo_procedimento}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsEditDepoimentoDialogOpen(false)} className="text-[10px] uppercase tracking-widest">Cancelar</Button>
                        <Button type="submit" disabled={submittingDepoimento} className="bg-primary hover:bg-primary/80 text-white font-bold tracking-widest px-8 uppercase text-[10px]">
                          {submittingDepoimento ? "Salvando..." : "SALVAR ALTERAÇÕES"}
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
                  {depoimentos.map(d => {
                    const depExpanded = expandedId === d.id;
                    return (
                      <div key={d.id} className="rounded-lg border border-border bg-card overflow-hidden">
                        <div
                          onClick={() => setExpandedId(depExpanded ? null : d.id)}
                          className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-muted cursor-pointer"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted/50">
                              <MessageSquare className="h-5 w-5 text-foreground" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-3 whitespace-nowrap overflow-hidden">
                                <Badge variant="outline" className="bg-muted border-border text-foreground font-mono text-[10px]">
                                  #{d.numero_registro?.toString().padStart(4, '0') || '???'}
                                </Badge>
                                <h4 className="text-sm font-bold text-foreground truncate max-w-[200px]">{d.oficial_nome}</h4>
                                {d.oficial_patente && (
                                  <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground bg-muted/50">
                                    {d.oficial_patente}
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                                <span>{formatDateSafe(d.data_depoimento, "dd/MM/yyyy")}</span>
                                {d.oficial_re && <><span>·</span><span>RE: {d.oficial_re}</span></>}
                                {d.oficial_batalhao && <><span>·</span><span>{d.oficial_batalhao}</span></>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-foreground hover:bg-muted/50" onClick={() => printDepoimento(d)} title="Imprimir / Exportar PDF">
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10" onClick={() => handleEditDepoimento(d)} title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => confirmDeleteDepoimento(d.id)} title="Excluir">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {depExpanded && (
                          <div className="border-t border-border/50 bg-muted/50 p-6 space-y-6">
                            {/* Depoimento */}
                            <div className="border-l-2 border-primary pl-4 bg-primary/5 py-3">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Depoimento Prestado</h4>
                              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">{d.depoimento}</p>
                            </div>

                            {/* Observações */}
                            {d.observacao && (
                              <div className="border-l-2 border-zinc-500 pl-4 bg-muted/50 py-3">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Observações Internas</h4>
                                <p className="text-xs text-muted-foreground/80 whitespace-pre-wrap leading-relaxed">{d.observacao}</p>
                              </div>
                            )}

                            {/* Documentos Vinculados */}
                            <div className="rounded border border-border bg-muted p-4">
                              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                <LinkIcon className="h-4 w-4" /> Documentos Vinculados
                              </div>
                              {(d.relatorio_id_ip || d.relatorio_id_ato || d.investigacao_id) ? (
                                <div className="space-y-2">
                                  {d.relatorio_id_ip && (
                                    <div className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                      <div className="flex items-center gap-3">
                                        <FileSignature className="h-4 w-4 text-foreground" />
                                        <span className="text-foreground font-bold">{relatorios.find(r => r.id === d.relatorio_id_ip)?.titulo || "N/A"}</span>
                                        <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">Inquérito Policial</Badge>
                                      </div>
                                      <Button size="sm" variant="ghost" className="h-7 text-xs text-foreground"
                                        onClick={() => { setActiveTab("inqueritos"); setExpandedId(d.relatorio_id_ip); }}>
                                        Ver Documento
                                      </Button>
                                    </div>
                                  )}
                                  {d.relatorio_id_ato && (
                                    <div className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                      <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-emerald-400" />
                                        <span className="text-foreground font-bold">{relatorios.find(r => r.id === d.relatorio_id_ato)?.titulo || "N/A"}</span>
                                        <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">Ato Administrativo</Badge>
                                      </div>
                                      <Button size="sm" variant="ghost" className="h-7 text-xs text-foreground"
                                        onClick={() => { setActiveTab("atos"); setExpandedId(d.relatorio_id_ato); }}>
                                        Ver Documento
                                      </Button>
                                    </div>
                                  )}
                                  {d.investigacao_id && (
                                    <div className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                      <div className="flex items-center gap-3">
                                        <Shield className="h-4 w-4 text-foreground" />
                                        <span className="text-foreground font-bold">{investigacoes.find(i => i.id === d.investigacao_id)?.titulo || "N/A"}</span>
                                        <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">Investigação</Badge>
                                      </div>
                                      <Button size="sm" variant="ghost" className="h-7 text-xs text-foreground"
                                        onClick={() => { setActiveTab("investigacoes"); setExpandedId(d.investigacao_id); }}>
                                        Ver Investigação
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">Nenhum documento vinculado.</p>
                              )}
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

          {activeTab === "relatorios_gerais" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <FileSignature className="h-5 w-5" /> Relatórios em Geral
                </h3>
                <Dialog open={isRelatorioGeralDialogOpen} onOpenChange={setIsRelatorioGeralDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setRelatorioGeralForm({ titulo: "", conteudo: "", vinculos: [] });
                      setSelectedEntidadeTipo("denuncia");
                      setSelectedEntidadeId("");
                    }} className="bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] uppercase tracking-widest">
                      <Plus className="h-3 w-3 mr-1" /> Novo Relatório Geral
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background border-border max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-foreground uppercase tracking-wider text-sm">Criar Relatório Geral</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitRelatorioGeral} className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">Título do Relatório *</Label>
                        <Input value={relatorioGeralForm.titulo} onChange={(e) => setRelatorioGeralForm({...relatorioGeralForm, titulo: e.target.value})} className="bg-background border-border text-foreground" placeholder="Ex: Relatório Consolidado - Operação X" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">Conteúdo / Descrição *</Label>
                        <Textarea rows={8} value={relatorioGeralForm.conteudo} onChange={(e) => setRelatorioGeralForm({...relatorioGeralForm, conteudo: e.target.value})} className="bg-background border-border text-foreground text-sm leading-relaxed font-mono" placeholder="Descreva o relatório geral..." required />
                      </div>
                      <div className="border-t border-border pt-4 space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Documentos Vinculados</h4>
                        {relatorioGeralForm.vinculos.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {relatorioGeralForm.vinculos.map((v, i) => {
                              const label = v.entidade_tipo === "denuncia" ? denuncias.find(d => d.id === v.entidade_id)?.titulo :
                                v.entidade_tipo === "investigacao" ? investigacoes.find(inv => inv.id === v.entidade_id)?.titulo :
                                v.entidade_tipo === "depoimento" ? depoimentos.find(d => d.id === v.entidade_id)?.oficial_nome :
                                v.entidade_tipo === "inquerito" ? relatorios.find(r => r.id === v.entidade_id && r.tipo_denuncia === "Inquérito Policial")?.titulo :
                                v.entidade_tipo === "ato" ? relatorios.find(r => r.id === v.entidade_id && r.tipo_denuncia === "Ato Administrativo")?.titulo : "N/A";
                              return (
                                <div key={i} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-[9px] uppercase border-border">{v.entidade_tipo}</Badge>
                                    <span className="text-foreground font-bold">{label || "N/A"}</span>
                                  </div>
                                  <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                                    onClick={() => setRelatorioGeralForm({...relatorioGeralForm, vinculos: relatorioGeralForm.vinculos.filter((_, idx) => idx !== i)})}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <select value={selectedEntidadeTipo} onChange={(e) => { setSelectedEntidadeTipo(e.target.value as any); setSelectedEntidadeId(""); }}
                              className="w-full h-9 bg-background border border-border text-foreground text-xs rounded px-2 mb-2">
                              <option value="denuncia">Denúncia</option>
                              <option value="investigacao">Investigação</option>
                              <option value="depoimento">Depoimento</option>
                              <option value="inquerito">Inquérito Policial</option>
                              <option value="ato">Ato Administrativo</option>
                            </select>
                            <select value={selectedEntidadeId} onChange={(e) => setSelectedEntidadeId(e.target.value)}
                              className="w-full h-9 bg-background border border-border text-foreground text-xs rounded px-2">
                              <option value="">Selecione...</option>
                              {selectedEntidadeTipo === "denuncia" && denuncias.filter(d => !relatorioGeralForm.vinculos.some(v => v.entidade_id === d.id && v.entidade_tipo === "denuncia")).map(d => (
                                <option key={d.id} value={d.id}>#{d.numero_registro} - {d.titulo}</option>
                              ))}
                              {selectedEntidadeTipo === "investigacao" && investigacoes.filter(inv => !relatorioGeralForm.vinculos.some(v => v.entidade_id === inv.id && v.entidade_tipo === "investigacao")).map(inv => (
                                <option key={inv.id} value={inv.id}>#{inv.numero_registro} - {inv.titulo}</option>
                              ))}
                              {selectedEntidadeTipo === "depoimento" && depoimentos.filter(d => !relatorioGeralForm.vinculos.some(v => v.entidade_id === d.id && v.entidade_tipo === "depoimento")).map(d => (
                                <option key={d.id} value={d.id}>#{d.numero_registro} - {d.oficial_nome}</option>
                              ))}
                              {selectedEntidadeTipo === "inquerito" && relatorios.filter(r => r.tipo_denuncia === "Inquérito Policial" && !relatorioGeralForm.vinculos.some(v => v.entidade_id === r.id && v.entidade_tipo === "inquerito")).map(r => (
                                <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                              ))}
                              {selectedEntidadeTipo === "ato" && relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo" && !relatorioGeralForm.vinculos.some(v => v.entidade_id === r.id && v.entidade_tipo === "ato")).map(r => (
                                <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                              ))}
                            </select>
                          </div>
                          <Button type="button" size="sm" onClick={() => {
                            if (!selectedEntidadeId) return toast.error("Selecione um documento");
                            if (relatorioGeralForm.vinculos.some(v => v.entidade_id === selectedEntidadeId && v.entidade_tipo === selectedEntidadeTipo)) return toast.error("Documento já vinculado");
                            setRelatorioGeralForm({...relatorioGeralForm, vinculos: [...relatorioGeralForm.vinculos, { entidade_id: selectedEntidadeId, entidade_tipo: selectedEntidadeTipo }]});
                            setSelectedEntidadeId("");
                          }} className="bg-card hover:bg-slate-700 text-white text-xs h-9">
                            Adicionar
                          </Button>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border flex justify-end">
                        <Button type="submit" disabled={submittingRelatorioGeral} className="bg-primary hover:bg-primary/80 text-white font-bold tracking-widest px-8 uppercase text-[10px]">
                          {submittingRelatorioGeral ? "Criando..." : "CRIAR RELATÓRIO GERAL"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Edit Relatório Geral Dialog */}
                <Dialog open={isEditRelatorioGeralDialogOpen} onOpenChange={(open) => {
                  if (!open) { setIsEditRelatorioGeralDialogOpen(false); setEditingRelatorioGeralId(null); }
                }}>
                  <DialogContent className="bg-background border-border max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-foreground uppercase tracking-wider text-sm">Editar Relatório Geral</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={updateRelatorioGeral} className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">Título do Relatório *</Label>
                        <Input value={relatorioGeralForm.titulo} onChange={(e) => setRelatorioGeralForm({...relatorioGeralForm, titulo: e.target.value})} className="bg-background border-border text-foreground" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">Conteúdo / Descrição *</Label>
                        <Textarea rows={8} value={relatorioGeralForm.conteudo} onChange={(e) => setRelatorioGeralForm({...relatorioGeralForm, conteudo: e.target.value})} className="bg-background border-border text-foreground text-sm leading-relaxed font-mono" required />
                      </div>
                      <div className="pt-4 border-t border-border flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsEditRelatorioGeralDialogOpen(false)} className="text-[10px] uppercase tracking-widest">Cancelar</Button>
                        <Button type="submit" disabled={submittingRelatorioGeral} className="bg-primary hover:bg-primary/80 text-white font-bold tracking-widest px-8 uppercase text-[10px]">
                          {submittingRelatorioGeral ? "Salvando..." : "SALVAR ALTERAÇÕES"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {(() => {
                const relatoriosGerais = relatorios.filter(r => r.tipo_denuncia === "Relatório Geral");
                return relatoriosGerais.length === 0 ? (
                  <div className="rounded-lg border border-border border-dashed bg-card/50 p-12 text-center text-muted-foreground">
                    <FileSignature className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Nenhum Relatório Geral registrado.</p>
                    <p className="text-[10px] mt-1">Clique em "Novo Relatório Geral" para criar um.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relatoriosGerais.map(rg => {
                      const rgExpanded = expandedId === rg.id;
                      const vinculos = relatorioGeralVinculos.filter(v => v.relatorio_id === rg.id);
                      return (
                        <div key={rg.id} className="rounded-lg border border-border bg-card overflow-hidden">
                          <div
                            onClick={() => setExpandedId(rgExpanded ? null : rg.id)}
                            className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-muted cursor-pointer"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted/50">
                                <FileSignature className="h-5 w-5 text-foreground" />
                              </div>
                              <div className="overflow-hidden">
                                <div className="flex items-center gap-3 whitespace-nowrap overflow-hidden">
                                  <Badge variant="outline" className="bg-muted border-border text-foreground font-mono text-[10px]">
                                    #{rg.numero_registro?.toString().padStart(4, '0') || '???'}
                                  </Badge>
                                  <h4 className="text-sm font-bold text-foreground truncate max-w-[300px]">{rg.titulo}</h4>
                                  <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground bg-muted/50">
                                    Relatório Geral
                                  </Badge>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                                  <span>{format(new Date(rg.created_at), "dd/MM/yy HH:mm")}</span>
                                  <span>·</span>
                                  <span>{vinculos.length} documento(s) vinculado(s)</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Select value={rg.status} onValueChange={(v: Status) => updateStatus(rg.id, v)}>
                                <SelectTrigger className="h-8 bg-muted border-border text-[10px] text-muted-foreground uppercase tracking-widest w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-muted border-border text-foreground">
                                  {Object.entries(STATUS_LABEL).map(([val, lab]) => (
                                    <SelectItem key={val} value={val} className="text-[10px] uppercase">{lab}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-foreground hover:bg-muted/50" onClick={() => printRelatorio(rg)} title="Imprimir">
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10" onClick={() => handleEditRelatorioGeral(rg)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => confirmDeleteRelatorioGeral(rg.id)} title="Excluir">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {rgExpanded && (
                            <div className="border-t border-border/50 bg-muted/50 p-6 space-y-6">
                              <div className="border-l-2 border-primary pl-4 bg-primary/5 py-3">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Conteúdo do Relatório</h4>
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">{rg.conteudo}</p>
                              </div>

                              {/* Documentos Vinculados */}
                              <div className="rounded border border-border bg-muted p-4">
                                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                  <LinkIcon className="h-4 w-4" /> Documentos Vinculados ({vinculos.length})
                                </div>
                                {vinculos.length > 0 ? (
                                  <div className="space-y-2 mb-4">
                                    {vinculos.map(v => {
                                      const isDenuncia = v.entidade_tipo === "denuncia";
                                      const isInvestigacao = v.entidade_tipo === "investigacao";
                                      const isDepoimento = v.entidade_tipo === "depoimento";
                                      const isInquerito = v.entidade_tipo === "inquerito";
                                      const isAto = v.entidade_tipo === "ato";
                                      const entity = isDenuncia ? denuncias.find(d => d.id === v.entidade_id) :
                                        isInvestigacao ? investigacoes.find(i => i.id === v.entidade_id) :
                                        isDepoimento ? depoimentos.find(d => d.id === v.entidade_id) :
                                        relatorios.find(r => r.id === v.entidade_id);
                                      const tabTarget = isDenuncia ? "denuncias" : isInvestigacao ? "investigacoes" : isDepoimento ? "depoimentos" : isInquerito ? "inqueritos" : "atos";
                                      const icon = isInquerito ? FileSignature : isAto ? FileText : isInvestigacao ? Shield : isDepoimento ? MessageSquare : Activity;
                                      const label = isDenuncia ? "Denúncia" : isInvestigacao ? "Investigação" : isDepoimento ? "Depoimento" : isInquerito ? "Inquérito Policial" : "Ato Administrativo";
                                      const name = entity ? (isDepoimento ? (entity as Depoimento).oficial_nome : (entity as any).titulo) : "N/A";
                                      return (
                                        <div key={v.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                          <div className="flex items-center gap-3">
                                            {React.createElement(icon, { className: "h-4 w-4 text-foreground shrink-0" })}
                                            <span className="text-foreground font-bold">{name}</span>
                                            <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">{label}</Badge>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button size="sm" variant="ghost" className="h-7 text-xs text-foreground"
                                              onClick={() => { setActiveTab(tabTarget as Tab); setExpandedId(v.entidade_id); }}>
                                              Ver
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                              onClick={() => deleteRelatorioGeralVinculo(v.id)} title="Desanexar">
                                              <X className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground mb-4">Nenhum documento vinculado.</p>
                                )}
                                {/* Add vinculação */}
                                <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <select value={selectedEntidadeTipo} onChange={(e) => { setSelectedEntidadeTipo(e.target.value as any); setSelectedEntidadeId(""); }}
                                      className="w-full h-9 bg-muted border border-border text-foreground text-xs rounded px-2 mb-1">
                                      <option value="denuncia">Denúncia</option>
                                      <option value="investigacao">Investigação</option>
                                      <option value="depoimento">Depoimento</option>
                                      <option value="inquerito">Inquérito Policial</option>
                                      <option value="ato">Ato Administrativo</option>
                                    </select>
                                    <select value={selectedEntidadeId} onChange={(e) => setSelectedEntidadeId(e.target.value)}
                                      className="w-full h-9 bg-muted border border-border text-foreground text-xs rounded px-2">
                                      <option value="">Selecione...</option>
                                      {selectedEntidadeTipo === "denuncia" && denuncias.filter(d => !vinculos.some(v => v.entidade_id === d.id)).map(d => (
                                        <option key={d.id} value={d.id}>#{d.numero_registro} - {d.titulo}</option>
                                      ))}
                                      {selectedEntidadeTipo === "investigacao" && investigacoes.filter(i => !vinculos.some(v => v.entidade_id === i.id)).map(i => (
                                        <option key={i.id} value={i.id}>#{i.numero_registro} - {i.titulo}</option>
                                      ))}
                                      {selectedEntidadeTipo === "depoimento" && depoimentos.filter(d => !vinculos.some(v => v.entidade_id === d.id)).map(d => (
                                        <option key={d.id} value={d.id}>#{d.numero_registro} - {d.oficial_nome}</option>
                                      ))}
                                      {selectedEntidadeTipo === "inquerito" && relatorios.filter(r => r.tipo_denuncia === "Inquérito Policial" && !vinculos.some(v => v.entidade_id === r.id)).map(r => (
                                        <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                                      ))}
                                      {selectedEntidadeTipo === "ato" && relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo" && !vinculos.some(v => v.entidade_id === r.id)).map(r => (
                                        <option key={r.id} value={r.id}>#{r.numero_registro} - {r.titulo}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <Button size="sm" className="bg-card hover:bg-slate-700 text-white text-xs"
                                    onClick={async () => {
                                      if (!selectedEntidadeId) return toast.error("Selecione um documento");
                                      setSubmittingRelatorioGeral(true);
                                      const { error } = await supabase.from("relatorio_geral_vinculos").insert({
                                        relatorio_id: rg.id,
                                        entidade_id: selectedEntidadeId,
                                        entidade_tipo: selectedEntidadeTipo,
                                      });
                                      setSubmittingRelatorioGeral(false);
                                      if (error) return toast.error("Erro ao vincular: " + error.message);
                                      toast.success("Documento vinculado!");
                                      setRelatorioGeralVinculos(prev => [...prev, { id: crypto.randomUUID(), relatorio_id: rg.id, entidade_id: selectedEntidadeId, entidade_tipo: selectedEntidadeTipo, created_at: new Date().toISOString() }]);
                                      setSelectedEntidadeId("");
                                    }}
                                    disabled={submittingRelatorioGeral || !selectedEntidadeId}
                                  >
                                    {submittingRelatorioGeral ? "..." : "Vincular"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* OFICIAIS & SOLICITACOES... (omitidos por brevidade caso não tivessem mudado, mas estão aqui em cima) */}
          {activeTab === "solicitacoes" && isAdmin && (
            <div className="space-y-6 animate-fade-in">
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
                          className="bg-muted text-foreground hover:bg-primary/20 border border-border text-[10px] font-bold uppercase px-3"
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
            <div className="space-y-6 animate-fade-in">
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
                          onClick={() => confirmDeleteOficial(oficial.id)}
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
                                className="bg-card hover:bg-slate-700 text-white h-9 px-2"
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
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Sim" id="edit-anon-sim" className="border-border text-primary" /><Label htmlFor="edit-anon-sim" className="text-xs text-foreground font-normal">Sim</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Não" id="edit-anon-nao" className="border-border text-primary" /><Label htmlFor="edit-anon-nao" className="text-xs text-foreground font-normal">Não</Label></div>
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
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/80 text-white px-8 font-bold tracking-widest text-[10px] uppercase">
                {submitting ? "Salvando..." : "SALVAR ALTERAÇÕES"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        loading={confirmDialog.loading}
      />
    </div>
    </>
  );
}


