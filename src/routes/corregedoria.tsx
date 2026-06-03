import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Shield, FileText, Loader2, Plus, FileSignature, LayoutDashboard, 
  Users, UserPlus, LogOut, Activity, Link as LinkIcon, Trash2, Edit
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
type Tab = "dashboard" | "denuncias" | "investigacoes" | "inqueritos" | "atos" | "oficiais" | "solicitacoes";

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
  pendente: "bg-red-500/20 text-red-400 border-red-500/40",
  em_analise: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  concluida: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  arquivada: "bg-slate-700/50 text-slate-400 border-slate-700",
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
    <div className="rounded-lg border border-slate-800 bg-[#0d141e] overflow-hidden">
      <div 
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-800/50 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-500/10">
            {relatorio.tipo_denuncia === "Inquérito Policial" ? (
              <FileSignature className="h-5 w-5 text-blue-400" />
            ) : (
              <FileText className="h-5 w-5 text-emerald-400" />
            )}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-3 whitespace-nowrap overflow-hidden">
              <h4 className="font-bold uppercase text-white tracking-wide truncate max-w-[200px]">{relatorio.titulo}</h4>
              <Badge variant="outline" className="text-[9px] uppercase border-slate-700 text-slate-400 bg-slate-900/50">
                {relatorio.tipo_denuncia}
              </Badge>
              <Badge className={(STATUS_COLOR[relatorio.status as Status] || STATUS_COLOR.pendente) + " text-[9px] uppercase border"}>
                {(STATUS_LABEL[relatorio.status as Status] || "Pendente")}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
              <span>{format(new Date(relatorio.created_at), "dd/MM/yy HH:mm")}</span>
              <span>·</span>
              <span>Oficial: {relatorio.oficial}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1 ml-4">
            <Select value={relatorio.status} onValueChange={(v: Status) => onUpdateStatus(relatorio.id, v)}>
              <SelectTrigger className="h-8 bg-slate-900 border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                {Object.entries(STATUS_LABEL).map(([val, lab]) => (
                  <SelectItem key={val} value={val} className="text-[10px] uppercase">{lab}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
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
        <div className="border-t border-slate-800/50 bg-slate-900/30 p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Denúncias Vinculadas */}
            <div className="rounded border border-slate-800 bg-slate-950/50 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Activity className="h-4 w-4" /> Denúncias Vinculadas
              </div>
              {linkedDenuncias.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {linkedDenuncias.map((d: any) => (
                    <div key={d.id} className="flex items-center gap-3 rounded bg-slate-900 px-3 py-2 text-sm border border-slate-800">
                      <Badge variant="outline" className="bg-slate-950 border-blue-900/50 text-blue-400 font-mono text-[10px]">
                        #{d.numero_registro?.toString().padStart(4, '0')}
                      </Badge>
                      <span className="text-slate-300">{d.titulo}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 mb-4">Nenhuma denúncia anexada.</p>
              )}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select value={linkDenunciaId} onValueChange={setLinkDenunciaId}>
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-300 text-xs h-8">
                    <SelectValue placeholder="Vincular denúncia..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                    {availableDenuncias.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>#{d.numero_registro?.toString().padStart(4, '0')} - {d.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={() => onLinkDenuncia(relatorio.id)} disabled={linking || !linkDenunciaId} className="h-8 bg-slate-800 hover:bg-slate-700 text-blue-400 text-[10px]">
                {linking ? "..." : "Link"}
              </Button>
            </div>
            </div>

            {/* Investigações Vinculadas */}
            <div className="rounded border border-slate-800 bg-slate-950/50 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Shield className="h-4 w-4" /> Investigações Vinculadas
              </div>
              {linkedInvestigacoes.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {linkedInvestigacoes.map((i: any) => (
                    <div key={i.id} className="flex items-center gap-3 rounded bg-slate-900 px-3 py-2 text-sm border border-slate-800">
                      <Badge variant="outline" className="bg-slate-950 border-red-900/50 text-red-400 font-mono text-[10px]">
                        #{i.numero_registro.toString().padStart(4, '0')}
                      </Badge>
                      <span className="text-slate-300">{i.titulo}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 mb-4">Nenhuma investigação anexada.</p>
              )}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select value={linkInvestigacaoId} onValueChange={setLinkInvestigacaoId}>
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-300 text-xs h-8">
                    <SelectValue placeholder="Vincular investigação..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                    {availableInvestigacoes.map((i: any) => (
                      <SelectItem key={i.id} value={i.id}>#{i.numero_registro.toString().padStart(4, '0')} - {i.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={() => onLinkInvestigacao(relatorio.id)} disabled={linking || !linkInvestigacaoId} className="h-8 bg-slate-800 hover:bg-slate-700 text-red-400 text-[10px]">
                {linking ? "..." : "Link"}
              </Button>
            </div>
            </div>
          </div>

          {relatorio.tipo_denuncia === "Inquérito Policial" && relatorio.dados_detalhados && (
            <div className="space-y-6 border-b border-slate-800 pb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-l-2 border-red-600 pl-3 bg-red-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">0. DADOS DO CORREGEDOR</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-[10px] text-slate-400">Caso: <span className="text-white">{relatorio.dados_detalhados.numero_caso}</span></p>
                      <p className="text-[10px] text-slate-400">Abertura: <span className="text-white">{formatDateSafe(relatorio.dados_detalhados.data_abertura, "dd/MM/yyyy")}</span></p>
                      <p className="text-[10px] text-slate-400">Patente: <span className="text-white">{relatorio.dados_detalhados.corregedor_patente}</span></p>
                      <p className="text-[10px] text-slate-400">Recebimento: <span className="text-white">{formatDateSafe(relatorio.dados_detalhados.data_recebimento, "dd/MM/yyyy")}</span></p>
                    </div>
                  </div>
                  <div className="border-l-2 border-blue-600 pl-3 bg-blue-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">1. DADOS DO RECLAMANTE</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-[10px] text-slate-400">Nome: <span className="text-white">{relatorio.dados_detalhados.reclamante_nome}</span></p>
                      <p className="text-[10px] text-slate-400">ID: <span className="text-white">{relatorio.dados_detalhados.reclamante_id}</span></p>
                      <p className="text-[10px] text-slate-400">Discord: <span className="text-white">{relatorio.dados_detalhados.reclamante_discord || "N/A"}</span></p>
                      <p className="text-[10px] text-slate-400">Anônimo: <span className="text-white font-bold">{relatorio.dados_detalhados.reclamante_anonimo}</span></p>
                    </div>
                  </div>
                  <div className="border-l-2 border-slate-600 pl-3 bg-slate-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">2. POLICIAL DENUNCIADO</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-[10px] text-slate-400">Nome: <span className="text-white">{relatorio.dados_detalhados.denunciado_nome}</span></p>
                      <p className="text-[10px] text-slate-400">Badge: <span className="text-white">#{relatorio.dados_detalhados.denunciado_badge}</span></p>
                      <p className="text-[10px] text-slate-400">Patente: <span className="text-white">{relatorio.dados_detalhados.denunciado_patente}</span></p>
                      <p className="text-[10px] text-slate-400">Viatura: <span className="text-white">{relatorio.dados_detalhados.denunciado_viatura || "N/A"}</span></p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border-l-2 border-amber-600 pl-3 bg-amber-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">3. TIPO DE DENÚNCIA</h4>
                    <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400 text-[10px] uppercase">
                      {relatorio.dados_detalhados.tipo_denuncia_selecionado}
                    </Badge>
                  </div>
                  <div className="border-l-2 border-violet-600 pl-3 bg-violet-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2">4. INFORMAÇÕES DO INCIDENTE</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <p className="text-[10px] text-slate-400">Data: <span className="text-white">{formatDateSafe(relatorio.dados_detalhados.incidente_data, "dd/MM/yyyy")}</span></p>
                      <p className="text-[10px] text-slate-400">Horário: <span className="text-white">{relatorio.dados_detalhados.incidente_horario}</span></p>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-1">Local: <span className="text-white">{relatorio.dados_detalhados.incidente_local}</span></p>
                    <p className="text-[10px] text-slate-400">Testemunhas: <span className="text-white">{relatorio.dados_detalhados.incidente_testemunhas}</span></p>
                  </div>
                  <div className="border-l-2 border-emerald-600 pl-3 bg-emerald-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">6. PROVAS E EVIDÊNCIAS</h4>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {relatorio.dados_detalhados.provas_selecionadas?.map((p: string) => (
                        <Badge key={p} variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[9px] uppercase">{p}</Badge>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 italic bg-slate-950/40 p-1.5 rounded border border-emerald-500/10">{relatorio.dados_detalhados.provas_descricao || "Nenhuma descrição adicional."}</p>
                  </div>
                </div>
              </div>
              
              {relatorio.dados_detalhados.ato_id_vinculado && (
                <div className="mt-4 p-3 rounded border border-blue-900/30 bg-blue-500/5">
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-2">
                    <LinkIcon className="h-3 w-3" /> Ato Administrativo Vinculado
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-slate-900 border-blue-500/30 text-blue-300 text-[10px]">
                      {relatorios?.find((r: Relatorio) => r.id === relatorio.dados_detalhados.ato_id_vinculado)?.titulo || "Documento não encontrado"}
                    </Badge>
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
                  <p className="text-xs text-slate-400">Inquérito: <span className="text-white">{relatorio.dados_detalhados.ato_numero_inquerito || "N/A"}</span></p>
                  <p className="text-xs text-slate-400">Ato: <span className="text-white">#{relatorio.dados_detalhados.ato_numero}</span></p>
                  <p className="text-xs text-slate-400">Emissão: <span className="text-white">{formatDateSafe(relatorio.dados_detalhados.ato_data_emissao, "dd/MM/yyyy")}</span></p>
                </div>
                <p className="text-xs text-slate-400 mt-2">Tipo: <Badge variant="outline" className="ml-1 text-[9px] bg-red-500/10 text-red-400 border-red-500/30">{relatorio.dados_detalhados.ato_tipo === "Outro" ? relatorio.dados_detalhados.ato_tipo_outro : relatorio.dados_detalhados.ato_tipo}</Badge></p>
              </div>

              {/* 2. AUTORIDADE */}
              <div className="border-l-2 border-blue-600 pl-4 bg-blue-500/5 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">2. AUTORIDADE EMISSORA</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <p className="text-xs text-slate-400">Corregedor: <span className="text-white">{relatorio.dados_detalhados.ato_autoridade_nome}</span></p>
                  <p className="text-xs text-slate-400">Cargo: <span className="text-white">{relatorio.dados_detalhados.ato_autoridade_cargo}</span></p>
                  <p className="text-xs text-slate-400">Unidade: <span className="text-white">{relatorio.dados_detalhados.ato_autoridade_unidade}</span></p>
                </div>
              </div>

              {/* 3. OBJETO */}
              <div className="border-l-2 border-slate-600 pl-4 bg-slate-500/5 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">3. OBJETO DO ATO</h4>
                <p className="text-sm text-slate-300 italic leading-relaxed">"{relatorio.dados_detalhados.ato_objeto_descricao}"</p>
              </div>

              {/* 4. FUNDAMENTAÇÃO */}
              <div className="border-l-2 border-amber-600 pl-4 bg-amber-500/5 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">4. FUNDAMENTAÇÃO</h4>
                <div className="flex flex-wrap gap-1 mb-3">
                  {relatorio.dados_detalhados.ato_fundamentacao_selecionada?.map((f: string) => (
                    <Badge key={f} variant="outline" className="text-[9px] bg-amber-500/5 border-amber-500/20 text-amber-500/70">{f}</Badge>
                  ))}
                </div>
                {relatorio.dados_detalhados.ato_fundamentacao_complementar && (
                  <p className="text-xs text-slate-400 bg-slate-950/30 p-2 rounded border border-amber-500/10 italic">
                    {relatorio.dados_detalhados.ato_fundamentacao_complementar}
                  </p>
                )}
              </div>

              {/* 5. DECISÃO */}
              <div className="border-l-2 border-indigo-600 pl-4 bg-indigo-500/5 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">5. DECISÃO</h4>
                <p className="text-sm text-white whitespace-pre-wrap">{relatorio.dados_detalhados.ato_decisao}</p>
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
                   <p className="text-xs text-slate-400 bg-slate-950/30 p-2 rounded border border-emerald-500/10 whitespace-pre-wrap">
                    {relatorio.dados_detalhados.ato_medidas_detalhamento}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-800 pb-1">Conteúdo do Documento</p>
            <p className="text-sm whitespace-pre-wrap text-slate-300 leading-relaxed font-mono mt-4">{relatorio.conteudo}</p>
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
    status: Status;
    dados_detalhados: any;
  }>({
    titulo: "",
    tipo_denuncia: "Inquérito Policial",
    oficial: "",
    conteudo: "",
    denuncia_id: "",
    investigacao_id: "",
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
      const [denunciasRes, investigacoesRes, relatoriosRes, drRes, irRes, diRes, perfisRes] = await Promise.all([
        supabase.from("denuncias").select("*").order("created_at", { ascending: false }),
        supabase.from("investigacoes").select("*").order("created_at", { ascending: false }),
        supabase.from("relatorios").select("*").order("created_at", { ascending: false }),
        supabase.from("denuncia_relatorio").select("*"),
        supabase.from("investigacao_relatorio").select("*"),
        supabase.from("denuncia_investigacao").select("*"),
        supabase.from("profiles").select("*").order("full_name", { ascending: true })
      ]);
      
      if (denunciasRes.data) setDenuncias(denunciasRes.data as Denuncia[]);
      if (investigacoesRes.data) setInvestigacoes(investigacoesRes.data as Investigacao[]);
      if (relatoriosRes.data) setRelatorios(relatoriosRes.data as Relatorio[]);
      if (drRes.data) setDenunciaRelatorios(drRes.data as DenunciaRelatorio[]);
      if (irRes.data) setInvestigacaoRelatorios(irRes.data as InvestigacaoRelatorio[]);
      if (diRes.data) setDenunciaInvestigacoes(diRes.data as DenunciaInvestigacao[]);
      
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

    if (relatorioForm.investigacao_id && relatorioForm.investigacao_id !== "none") {
      await supabase.from("investigacao_relatorio").insert({
        investigacao_id: relatorioForm.investigacao_id,
        relatorio_id: data[0].id
      });
      setInvestigacaoRelatorios(prev => [...prev, { investigacao_id: relatorioForm.investigacao_id, relatorio_id: data[0].id }]);
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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f16]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isCorregedor && roles.includes("pending")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f16] p-6 text-center text-slate-300">
        <div className="max-w-md rounded-lg border border-slate-800 bg-[#0d141e] p-8 shadow-2xl">
          <Shield className="mx-auto h-16 w-16 text-blue-500/50" />
          <h1 className="mt-6 text-2xl font-bold uppercase tracking-widest text-white shadow-blue-500/20 drop-shadow-md">
            Acesso Pendente
          </h1>
          <p className="mt-4 text-slate-400">
            Sua conta de oficial está aguardando aprovação administrativa para acessar o terminal seguro.
          </p>
          <Button onClick={handleLogout} variant="outline" className="mt-8 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">
            Voltar para o Login
          </Button>
        </div>
      </div>
    );
  }

  // Se não for corregedor e não for pendente, e também não for cidadão (ainda carregando ou erro), mostra loader ou redireciona
  if (!isCorregedor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f16]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0f16] text-slate-300 font-mono">
      {/* SIDEBAR */}
      <aside className="flex w-64 flex-col border-r border-slate-800 bg-[#0d141e]">
        <div className="flex items-center gap-3 border-b border-slate-800 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-500/20">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-white">MDT Policial</h1>
            <p className="text-[10px] text-blue-400/70 tracking-widest">SECURE TERMINAL</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 mt-4">Operações</p>
          
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
            active={activeTab === "oficiais"} 
            onClick={() => setActiveTab("oficiais")} 
            icon={Users} 
            label="Oficiais" 
          />

          {isAdmin && (
            <>
              <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 mt-8">Administrativo</p>
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

        <div className="border-t border-slate-800 p-4">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Desconectar
          </button>
          <div className="mt-4 px-4 text-[10px] text-slate-600">
            MDT v1.0 · CONFIDENCIAL
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header / Top Bar */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-800 bg-[#0a0f16]/80 px-8 backdrop-blur-sm z-10">
          <div className="flex flex-col">
            <span className="text-xs font-medium tracking-widest text-slate-500 uppercase">Sistema Operacional</span>
            <h2 className="text-2xl font-bold uppercase tracking-wider text-white" style={{ textShadow: '0 0 10px rgba(59, 130, 246, 0.5)'}}>
              Bem-Vindo, {user?.user_metadata?.full_name || "Oficial"}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white">{user?.user_metadata?.full_name}</div>
            <div className="text-xs text-slate-500">Badge #{user?.user_metadata?.badge_number || "000"}</div>
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
                  color="text-blue-400" 
                />
                <StatCard 
                  title="Investigações Ativas" 
                  value={investigacoes.filter(i => i.status !== "concluida" && i.status !== "arquivada").length.toString()} 
                  icon={Shield} 
                  color="text-red-400" 
                />
                <StatCard 
                  title="Inquéritos Policiais" 
                  value={relatorios.filter(r => r.tipo_denuncia === "Inquérito Policial").length.toString()} 
                  icon={FileSignature} 
                  color="text-blue-400" 
                />
                <StatCard 
                  title="Atos Administrativos" 
                  value={relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo").length.toString()} 
                  icon={FileText} 
                  color="text-emerald-400" 
                />
                <StatCard 
                  title="Aguardando Revisão" 
                  value={relatorios.filter(r => r.status === "pendente").length.toString()} 
                  icon={Shield} 
                  color="text-amber-400" 
                />
              </div>

              {/* Recent Records */}
              <div>
                <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-400">
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
                        <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-[#0d141e] p-5">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold uppercase text-white tracking-wide">
                              Denúncia #{item.numero_registro?.toString().padStart(4, '0')} - {item.titulo}
                            </h4>
                            <span className="text-xs text-slate-500">
                              {format(new Date(item.created_at), "dd/MM/yy HH:mm")}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">
                            Status: {item.status.toUpperCase()}
                          </p>
                        </div>
                      );
                    })}
                  {denuncias.filter(d => d.status === "pendente").length === 0 && (
                    <div className="rounded-lg border border-slate-800 border-dashed bg-[#0d141e]/50 p-8 text-center text-slate-500">
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
              <div className="flex flex-col gap-4 border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold uppercase tracking-wider text-white">Registro de Denúncias</h3>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mr-2">Filtro:</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className={`font-mono text-xs h-8 ${denunciaFilter === "todas" ? "bg-slate-700 text-white border-slate-600" : "bg-transparent text-slate-400 border-slate-800 hover:text-white"}`}
                    onClick={() => setDenunciaFilter("todas")}
                  >
                    TODAS
                  </Button>
                  {(Object.keys(STATUS_LABEL) as Status[]).map((status) => (
                    <Button 
                      key={status}
                      size="sm" 
                      variant="outline"
                      className={`font-mono text-xs h-8 ${denunciaFilter === status ? STATUS_COLOR[status].split(" ")[0] + " text-white border-transparent" : "bg-transparent text-slate-400 border-slate-800 hover:text-white"}`}
                      onClick={() => setDenunciaFilter(status)}
                    >
                      {STATUS_LABEL[status].toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {denuncias.filter(d => denunciaFilter === "todas" || d.status === denunciaFilter).length === 0 ? (
                <div className="rounded-lg border border-slate-800 border-dashed bg-[#0d141e]/50 p-12 text-center text-slate-500">
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
                      <div key={d.id} className="rounded-lg border border-slate-800 bg-[#0d141e] overflow-hidden">
                        <button
                          onClick={() => setExpandedId(expanded ? null : d.id)}
                          className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-800/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <Badge variant="outline" className="bg-slate-900 border-blue-900/50 text-blue-400 font-mono">
                                #{d.numero_registro?.toString().padStart(4, '0')}
                              </Badge>
                              <h3 className="font-bold uppercase text-white tracking-wide">
                                {d.titulo}
                              </h3>
                              <Badge variant="outline" className={`font-mono text-xs ${STATUS_COLOR[d.status]}`}>
                                {STATUS_LABEL[d.status]}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">
                              {format(new Date(d.created_at), "dd/MM/yyyy 'às' HH:mm")}
                              {d.policial_denunciado && ` · Acusado: ${d.policial_denunciado}`}
                            </p>
                          </div>
                        </button>

                        {expanded && (
                          <div className="space-y-6 border-t border-slate-800 bg-slate-900/30 p-6">
                            
                            {/* Anexos de Relatório */}
                            <div className="rounded border border-slate-800 bg-slate-950/50 p-4">
                              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                                <LinkIcon className="h-4 w-4" /> Documentos Anexados
                              </div>
                              
                               {linkedRelatorios.length > 0 ? (
                                 <div className="space-y-2 mb-4">
                                   {linkedRelatorios.map(r => (
                                     <div key={r.id} className="flex items-center justify-between rounded bg-slate-900 px-3 py-2 text-sm border border-slate-800">
                                       <div className="flex items-center gap-3">
                                         {r.tipo_denuncia === "Inquérito Policial" ? (
                                           <FileSignature className="h-4 w-4 text-blue-400" />
                                         ) : (
                                           <FileText className="h-4 w-4 text-emerald-400" />
                                         )}
                                         <span className="text-slate-300 font-bold">{r.titulo}</span>
                                         <Badge variant="outline" className="text-[9px] uppercase border-slate-800 text-slate-500">
                                           {r.tipo_denuncia}
                                         </Badge>
                                       </div>
                                       <Button 
                                         size="sm" 
                                         variant="ghost" 
                                         className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
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
                                <p className="text-xs text-slate-500 mb-4">Nenhum documento anexado a esta denúncia.</p>
                              )}

                              <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                  <Select value={linkRelatorioId} onValueChange={setLinkRelatorioId}>
                                    <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-300 text-xs">
                                      <SelectValue placeholder="Selecione um documento para vincular..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
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
                                  className="bg-slate-800 hover:bg-slate-700 text-blue-400"
                                >
                                  {linking ? "Vinculando..." : "Vincular"}
                                </Button>
                              </div>
                            </div>

                            {/* DADOS DETALHADOS (SE EXISTIREM) */}
                            {d.dados_detalhados && (
                              <div className="mt-4 space-y-4 animate-in fade-in duration-500">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="border-l-2 border-blue-500 pl-3 bg-blue-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">1. DADOS DO DENUNCIANTE</h4>
                                    <p className="text-xs text-slate-400">Nome: <span className="text-white">{d.dados_detalhados.reclamante_nome}</span></p>
                                    <p className="text-xs text-slate-400">ID: <span className="text-white">{d.dados_detalhados.reclamante_id}</span></p>
                                    <p className="text-xs text-slate-400">Contato: <span className="text-white">{d.dados_detalhados.reclamante_contato}</span></p>
                                    <p className="text-xs text-slate-400">Anônimo: <span className="text-white">{d.dados_detalhados.reclamante_anonimo}</span></p>
                                  </div>
                                  <div className="border-l-2 border-red-500 pl-3 bg-red-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">2. DADOS DO POLICIAL</h4>
                                    <p className="text-xs text-slate-400">Nome: <span className="text-white">{d.dados_detalhados.denunciado_nome}</span></p>
                                    <p className="text-xs text-slate-400">Patente: <span className="text-white">{d.dados_detalhados.denunciado_patente}</span></p>
                                    <p className="text-xs text-slate-400">Badge: <span className="text-white">{d.dados_detalhados.denunciado_badge}</span></p>
                                  </div>
                                </div>

                                <div className="border-l-2 border-amber-500 pl-3 bg-amber-500/5 py-2">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">3. TIPOS DE VIOLAÇÃO</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {(d.dados_detalhados.tipo_denuncia || d.dados_detalhados.tipo_denuncia)?.map((t: string) => (
                                      <Badge key={t} variant="outline" className="text-[9px] bg-amber-500/10 border-amber-500/30 text-amber-400 uppercase">{t}</Badge>
                                    ))}
                                    {(d.dados_detalhados.tipo_denuncia_outro || d.dados_detalhados.tipo_denuncia_outro) && (
                                      <Badge variant="outline" className="text-[9px] bg-slate-800 text-slate-400">
                                        {d.dados_detalhados.tipo_denuncia_outro || d.dados_detalhados.tipo_denuncia_outro}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="border-l-2 border-indigo-500 pl-3 bg-indigo-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">4. INF. OCORRIDO</h4>
                                    <p className="text-xs text-slate-400">Data: <span className="text-white">{d.dados_detalhados.incidente_data}</span></p>
                                    <p className="text-xs text-slate-400">Hora: <span className="text-white">{d.dados_detalhados.incidente_horario}</span></p>
                                    <p className="text-xs text-slate-400">Local: <span className="text-white">{d.dados_detalhados.incidente_local}</span></p>
                                  </div>
                                  <div className="border-l-2 border-emerald-500 pl-3 bg-emerald-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">6. TESTEMUNHAS</h4>
                                    <p className="text-xs text-slate-400">Presença: <span className="text-white">{d.dados_detalhados.testemunhas_tem}</span></p>
                                    {d.dados_detalhados.testemunhas_nomes && <p className="text-xs text-slate-400">Nomes: <span className="text-white">{d.dados_detalhados.testemunhas_nomes}</span></p>}
                                  </div>
                                </div>

                                <div className="border-l-2 border-purple-500 pl-3 bg-purple-500/5 py-2">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-2">7. PROVAS E EVIDÊNCIAS</h4>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {d.dados_detalhados.provas_selecionadas?.map((p: string) => (
                                      <Badge key={p} variant="outline" className="text-[9px] bg-purple-500/10 border-purple-500/30 text-purple-400 uppercase">{p}</Badge>
                                    ))}
                                    {d.dados_detalhados.provas_outro && <Badge variant="outline" className="text-[9px] bg-slate-800 text-slate-400">{d.dados_detalhados.provas_outro}</Badge>}
                                  </div>
                                  {d.dados_detalhados.provas_descricao && (
                                    <p className="text-xs text-slate-400 italic bg-slate-950/50 p-2 rounded border border-purple-500/10 whitespace-pre-wrap">{d.dados_detalhados.provas_descricao}</p>
                                  )}
                                </div>

                                <div className="border-l-2 border-red-800 pl-3 bg-red-950/10 py-2">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-1">8. ASSINATURA DIGITAL</h4>
                                  <p className="text-sm font-serif italic text-white">{d.dados_detalhados.declaracao_assinatura}</p>
                                </div>
                              </div>
                            )}

                             {/* FALLBACK PARA QUANDO NÃO HÁ DADOS DETALHADOS */}
                             {!d.dados_detalhados && (
                              <>
                                <Field label="Descrição">
                                  <p className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">{d.descricao}</p>
                                </Field>
                                {d.data_ocorrido && (
                                  <Field label="Quando ocorreu">
                                    <p className="text-sm text-slate-300">{d.data_ocorrido}</p>
                                  </Field>
                                )}
                                {d.contato_opcional && (
                                  <Field label="Contato do denunciante">
                                    <p className="text-sm text-slate-300">{d.contato_opcional}</p>
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
                                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                                      <SelectItem key={s} value={s} className="hover:bg-slate-800">{STATUS_LABEL[s]}</SelectItem>
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
                                className="bg-slate-950 border-slate-800 text-slate-300 placeholder:text-slate-700"
                                placeholder="Observações da investigação..."
                              />
                              <Button
                                size="sm"
                                className="mt-3 bg-slate-800 hover:bg-slate-700 text-white"
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
              <div className="flex flex-col gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold uppercase tracking-wider text-white">Investigações Internas</h3>
                  
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
                    <DialogContent className="sm:max-w-[600px] bg-[#0d141e] border-slate-800 text-slate-300">
                      <DialogHeader>
                        <DialogTitle className="text-white uppercase tracking-wider">
                          {editingInvestigacaoId ? "Editar Investigação Interna" : "Nova Investigação Interna"}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={editingInvestigacaoId ? updateInvestigacao : submitInvestigacao} className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                        {/* 1. IDENTIFICAÇÃO DO PROCEDIMENTO */}
                        <div className="space-y-4 border-l-2 border-red-600 pl-4 bg-red-500/5 py-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-red-500">1. IDENTIFICAÇÃO DO PROCEDIMENTO</h4>
                          <div className="space-y-2">
                            <Label className="text-slate-400 text-[10px] uppercase">Título da Investigação (Opcional)</Label>
                            <Input 
                              value={investigacaoForm.titulo} 
                              onChange={(e) => setInvestigacaoForm({...investigacaoForm, titulo: e.target.value})}
                              placeholder="Ex: Operação Limpeza"
                              className="bg-slate-950 border-slate-800 text-white h-8 text-xs" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-slate-400 text-[10px] uppercase">Número do Inquérito</Label>
                              <Input disabled value="AUTO-GERADO" className="bg-slate-950 border-slate-800 text-slate-500 h-8 text-xs" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400 text-[10px] uppercase">Data de Abertura</Label>
                              <Input disabled value={format(new Date(), "dd/MM/yyyy")} className="bg-slate-950 border-slate-800 text-slate-500 h-8 text-xs" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-400 text-[10px] uppercase">Tipo de Procedimento</Label>
                            <RadioGroup 
                              value={investigacaoForm.tipo_procedimento} 
                              onValueChange={(v) => setInvestigacaoForm({...investigacaoForm, tipo_procedimento: v})}
                              className="flex flex-col gap-2"
                            >
                              {["Investigação Administrativa", "Investigação Disciplinar", "Investigação Criminal Interna"].map(tipo => (
                                <div key={tipo} className="flex items-center space-x-2">
                                  <RadioGroupItem value={tipo} id={tipo} className="border-slate-700 text-red-600" />
                                  <Label htmlFor={tipo} className="text-xs text-slate-300 font-normal">{tipo}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        </div>

                        {/* 2. AUTORIDADE RESPONSÁVEL */}
                        <div className="space-y-4 border-l-2 border-blue-600 pl-4 bg-blue-500/5 py-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-blue-500">2. AUTORIDADE RESPONSÁVEL</h4>
                          <div className="space-y-2">
                            <Label className="text-slate-400 text-[10px] uppercase">Corregedor / Investigador Responsável</Label>
                            <Input 
                              value={investigacaoForm.autoridade_responsavel} 
                              onChange={(e) => setInvestigacaoForm({...investigacaoForm, autoridade_responsavel: e.target.value})}
                              className="bg-slate-950 border-slate-800 text-white h-8 text-xs" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-slate-400 text-[10px] uppercase">Patente</Label>
                              <Input 
                                value={investigacaoForm.autoridade_patente} 
                                onChange={(e) => setInvestigacaoForm({...investigacaoForm, autoridade_patente: e.target.value})}
                                className="bg-slate-950 border-slate-800 text-white h-8 text-xs" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400 text-[10px] uppercase">Departamento</Label>
                              <Input disabled value="Corregedoria Geral (PMESP)" className="bg-slate-950 border-slate-800 text-slate-500 h-8 text-xs" />
                            </div>
                          </div>
                        </div>

                        {/* 3. IDENTIFICAÇÃO DO POLICIAL INVESTIGADO */}
                        <div className="space-y-4 border-l-2 border-slate-600 pl-4 bg-slate-500/5 py-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">3. IDENTIFICAÇÃO DO POLICIAL INVESTIGADO</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-slate-400 text-[10px] uppercase">Nome do Policial</Label>
                              <Input 
                                value={investigacaoForm.investigado} 
                                onChange={(e) => setInvestigacaoForm({...investigacaoForm, investigado: e.target.value})}
                                className="bg-slate-950 border-slate-800 text-white h-8 text-xs" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400 text-[10px] uppercase">Badge Number</Label>
                              <Input 
                                value={investigacaoForm.investigado_badge} 
                                onChange={(e) => setInvestigacaoForm({...investigacaoForm, investigado_badge: e.target.value})}
                                className="bg-slate-950 border-slate-800 text-white h-8 text-xs" 
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-slate-400 text-[10px] uppercase">Patente/Cargo</Label>
                              <Input 
                                value={investigacaoForm.investigado_patente} 
                                onChange={(e) => setInvestigacaoForm({...investigacaoForm, investigado_patente: e.target.value})}
                                className="bg-slate-950 border-slate-800 text-white h-8 text-xs" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400 text-[10px] uppercase">Divisão/Unidade</Label>
                              <Input 
                                value={investigacaoForm.investigado_unidade} 
                                onChange={(e) => setInvestigacaoForm({...investigacaoForm, investigado_unidade: e.target.value})}
                                className="bg-slate-950 border-slate-800 text-white h-8 text-xs" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* 4. ORIGEM DA INVESTIGAÇÃO */}
                        <div className="space-y-4 border-l-2 border-amber-600 pl-4 bg-amber-500/5 py-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500">4. ORIGEM DA INVESTIGAÇÃO</h4>
                          <RadioGroup 
                            value={investigacaoForm.origem_caso} 
                            onValueChange={(v) => setInvestigacaoForm({...investigacaoForm, origem_caso: v})}
                            className="flex flex-col gap-2"
                          >
                            {["Denúncia de civil", "Denúncia interna", "Auditoria interna", "Supervisão superior", "Análise de bodycam / evidências", "Outro"].map(origem => (
                              <div key={origem} className="flex items-center space-x-2">
                                <RadioGroupItem value={origem} id={`origem-${origem}`} className="border-slate-700 text-amber-600" />
                                <Label htmlFor={`origem-${origem}`} className="text-xs text-slate-300 font-normal">{origem}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                          {investigacaoForm.origem_caso === "Outro" && (
                            <Input 
                              placeholder="Especifique a origem..." 
                              value={investigacaoForm.origem_outro}
                              onChange={(e) => setInvestigacaoForm({...investigacaoForm, origem_outro: e.target.value})}
                              className="bg-slate-950 border-slate-800 text-white h-8 text-xs" 
                            />
                          )}
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-2">
                              <Label className="text-slate-400 text-[10px] uppercase">Vincular Denúncia</Label>
                              <Select value={investigacaoForm.denuncia_id} onValueChange={(v) => setInvestigacaoForm({...investigacaoForm, denuncia_id: v})}>
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-8 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                  {denuncias.map(d => <SelectItem key={d.id} value={d.id}>#{d.numero_registro} - {d.titulo}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400 text-[10px] uppercase">Vincular Inquérito (Opcional)</Label>
                              <Select value={investigacaoForm.relatorio_id_ip} onValueChange={(v) => setInvestigacaoForm({...investigacaoForm, relatorio_id_ip: v})}>
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-8 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                  <SelectItem value="none" className="text-slate-500 italic">Nenhum</SelectItem>
                                  {relatorios.filter(r => r.tipo_denuncia === "Inquérito Policial").map(r => <SelectItem key={r.id} value={r.id}>{r.titulo}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400 text-[10px] uppercase">Vincular Ato Adm. (Opcional)</Label>
                              <Select value={investigacaoForm.relatorio_id_ato} onValueChange={(v) => setInvestigacaoForm({...investigacaoForm, relatorio_id_ato: v})}>
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-8 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                  <SelectItem value="none" className="text-slate-500 italic">Nenhum</SelectItem>
                                  {relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo").map(r => <SelectItem key={r.id} value={r.id}>{r.titulo}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* 5. DESCRIÇÃO SUMÁRIA DOS FATOS */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">5. DESCRIÇÃO SUMÁRIA DOS FATOS</Label>
                          <Textarea 
                            rows={4} 
                            value={investigacaoForm.descricao}
                            onChange={(e) => setInvestigacaoForm({...investigacaoForm, descricao: e.target.value})}
                            className="bg-slate-950 border-slate-800 text-white text-xs" 
                            placeholder="Descreva o que aconteceu..."
                          />
                        </div>

                        {/* 6. FUNDAMENTAÇÃO PARA ABERTURA */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">6. FUNDAMENTAÇÃO PARA ABERTURA</Label>
                          <Textarea 
                            rows={3} 
                            value={investigacaoForm.fundamentacao}
                            onChange={(e) => setInvestigacaoForm({...investigacaoForm, fundamentacao: e.target.value})}
                            className="bg-slate-950 border-slate-800 text-white text-xs" 
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
                                  className="border-slate-700 data-[state=checked]:bg-emerald-600" 
                                />
                                <Label htmlFor={`medida-${medida}`} className="text-xs text-slate-300 font-normal">{medida}</Label>
                              </div>
                            ))}
                          </div>
                          {investigacaoForm.medidas_iniciais.includes("Outro") && (
                            <Input 
                              placeholder="Especifique a medida..." 
                              value={investigacaoForm.medidas_outro}
                              onChange={(e) => setInvestigacaoForm({...investigacaoForm, medidas_outro: e.target.value})}
                              className="bg-slate-950 border-slate-800 text-white h-8 text-xs" 
                            />
                          )}
                          <div className="space-y-2 mt-2">
                            <Label className="text-[10px] text-slate-400 uppercase">Detalhes adicionais</Label>
                            <Textarea 
                              rows={2} 
                              value={investigacaoForm.detalhes_adicionais}
                              onChange={(e) => setInvestigacaoForm({...investigacaoForm, detalhes_adicionais: e.target.value})}
                              className="bg-slate-950 border-slate-800 text-white text-xs" 
                            />
                          </div>
                        </div>

                        <div className="pt-4 flex justify-between items-center border-t border-slate-800">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500 uppercase">Status Inicial</Label>
                            <Select value={investigacaoForm.status} onValueChange={(v: Status) => setInvestigacaoForm({...investigacaoForm, status: v})}>
                              <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800 text-white">
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
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mr-2">Filtro:</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className={`font-mono text-xs h-8 ${investigacaoFilter === "todas" ? "bg-slate-700 text-white border-slate-600" : "bg-transparent text-slate-400 border-slate-800 hover:text-white"}`}
                    onClick={() => setInvestigacaoFilter("todas")}
                  >
                    TODAS
                  </Button>
                  {(Object.keys(STATUS_LABEL) as Status[]).map((status) => (
                    <Button 
                      key={status}
                      size="sm" 
                      variant="outline"
                      className={`font-mono text-xs h-8 ${investigacaoFilter === status ? STATUS_COLOR[status].split(" ")[0] + " text-white border-transparent" : "bg-transparent text-slate-400 border-slate-800 hover:text-white"}`}
                      onClick={() => setInvestigacaoFilter(status)}
                    >
                      {STATUS_LABEL[status].toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {investigacoes.filter(i => investigacaoFilter === "todas" || i.status === investigacaoFilter).length === 0 ? (
                <div className="rounded-lg border border-slate-800 border-dashed bg-[#0d141e]/50 p-12 text-center text-slate-500">
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
                        <div key={inv.id} className="rounded-lg border border-slate-800 bg-[#0d141e] overflow-hidden">
                          <button 
                            onClick={() => setExpandedId(expanded ? null : inv.id)}
                            className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-800/50"
                          >
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-slate-900 border-red-900/50 text-red-400 font-mono">
                                  #{inv.numero_registro.toString().padStart(4, '0')}
                                </Badge>
                                <h3 className="font-bold uppercase text-white tracking-wide">{inv.titulo}</h3>
                                <Badge variant="outline" className={`font-mono text-xs ${STATUS_COLOR[inv.status]}`}>
                                  {STATUS_LABEL[inv.status]}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500">
                                {format(new Date(inv.created_at), "dd/MM/yyyy")} · Investigado: {inv.investigado || "Não informado"}
                              </p>
                            </div>
                             {isAdmin && (
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
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
                            <div className="space-y-6 border-t border-slate-800 bg-slate-900/30 p-6">
                              <div className="rounded border border-slate-800 bg-slate-950/50 p-4">
                                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                                  <LinkIcon className="h-4 w-4" /> Documentos Anexados
                                </div>
                                
                                {linkedRelatorios.length > 0 ? (
                                  <div className="space-y-2 mb-4">
                                    {linkedRelatorios.map(r => (
                                      <div key={r.id} className="flex items-center justify-between rounded bg-slate-900 px-3 py-2 text-sm border border-slate-800">
                                        <div className="flex items-center gap-3">
                                          {r.tipo_denuncia === "Inquérito Policial" ? (
                                            <FileSignature className="h-4 w-4 text-blue-400" />
                                          ) : (
                                            <FileText className="h-4 w-4 text-emerald-400" />
                                          )}
                                          <span className="text-slate-300 font-bold">{r.titulo}</span>
                                          <Badge variant="outline" className="text-[9px] uppercase border-slate-800 text-slate-500">
                                            {r.tipo_denuncia}
                                          </Badge>
                                        </div>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="h-7 text-xs text-blue-400"
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
                                  <p className="text-xs text-slate-500 mb-4">Nenhum documento anexado.</p>
                                )}

                                <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <Select value={linkRelatorioId} onValueChange={setLinkRelatorioId}>
                                      <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-300 text-xs">
                                        <SelectValue placeholder="Selecione um documento..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
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
                                    className="bg-slate-800 text-blue-400"
                                  >
                                    {linking ? "..." : "Vincular"}
                                  </Button>
                                </div>
                              </div>

                              <div className="rounded border border-slate-800 bg-slate-950/50 p-4">
                                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                                  <Activity className="h-4 w-4" /> Denúncias Vinculadas
                                </div>
                                
                                {linkedDenuncias.length > 0 ? (
                                  <div className="space-y-2 mb-4">
                                    {linkedDenuncias.map(d => (
                                      <div key={d.id} className="flex items-center justify-between rounded bg-slate-900 px-3 py-2 text-sm border border-slate-800">
                                        <div className="flex items-center gap-3">
                                          <Badge variant="outline" className="bg-slate-950 border-blue-900/50 text-blue-400 font-mono text-[10px]">
                                            #{d.numero_registro?.toString().padStart(4, '0')}
                                          </Badge>
                                          <span className="text-slate-300 font-bold">{d.titulo}</span>
                                        </div>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="h-7 text-xs text-blue-400"
                                          onClick={() => { setActiveTab("denuncias"); setExpandedId(d.id); }}
                                        >
                                          Ver Denúncia
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500 mb-4">Nenhuma denúncia anexada.</p>
                                )}

                                <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <Select value={linkDenunciaId} onValueChange={setLinkDenunciaId}>
                                      <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-300 text-xs">
                                        <SelectValue placeholder="Vincular denúncia..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
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
                                    className="bg-slate-800 text-blue-400"
                                  >
                                    {linking ? "..." : "Vincular"}
                                  </Button>
                                </div>
                              </div>

                              <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                  <div className="border-l-2 border-red-600 pl-3 bg-red-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">1. PROCEDIMENTO</h4>
                                    <p className="text-xs text-slate-400">Tipo: <span className="text-white">{inv.tipo_procedimento}</span></p>
                                    <p className="text-xs text-slate-400">Abertura: <span className="text-white">{format(new Date(inv.created_at), "dd/MM/yyyy")}</span></p>
                                  </div>

                                  <div className="border-l-2 border-blue-600 pl-3 bg-blue-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">2. AUTORIDADE</h4>
                                    <p className="text-xs text-slate-400">Resp: <span className="text-white">{inv.autoridade_responsavel}</span></p>
                                    <p className="text-xs text-slate-400">Patente: <span className="text-white">{inv.autoridade_patente}</span></p>
                                    <p className="text-xs text-slate-400">Dept: <span className="text-white">{inv.autoridade_departamento}</span></p>
                                  </div>

                                  <div className="border-l-2 border-slate-600 pl-3 bg-slate-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">3. INVESTIGADO</h4>
                                    <p className="text-xs text-slate-400">Nome: <span className="text-white">{inv.investigado}</span></p>
                                    <p className="text-xs text-slate-400">Badge: <span className="text-white">{inv.investigado_badge}</span></p>
                                    <p className="text-xs text-slate-400">Patente: <span className="text-white">{inv.investigado_patente}</span></p>
                                    <p className="text-xs text-slate-400">Unidade: <span className="text-white">{inv.investigado_unidade}</span></p>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="border-l-2 border-amber-600 pl-3 bg-amber-500/5 py-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">4. ORIGEM</h4>
                                    <p className="text-xs text-slate-400">Caso: <span className="text-white">{inv.origem_caso === "Outro" ? inv.origem_outro : inv.origem_caso}</span></p>
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
                                      <p className="text-[10px] text-slate-500 mt-2 italic">{inv.detalhes_adicionais}</p>
                                    )}
                                  </div>

                                  <Field label="Status da Investigação">
                                    <Select defaultValue={inv.status} onValueChange={(v) => updateInvestigacaoStatus(inv.id, v as Status)}>
                                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
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
                                  <p className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded border border-slate-800">{inv.descricao}</p>
                                </Field>

                                <Field label="6. FUNDAMENTAÇÃO PARA ABERTURA">
                                  <p className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded border border-slate-800">{inv.fundamentacao}</p>
                                </Field>

                                <Field label="Notas da Corregedoria">
                                  <Textarea
                                    defaultValue={inv.notas_internas || ""}
                                    rows={4}
                                    id={`notas-inv-${inv.id}`}
                                    className="bg-slate-950 border-slate-800 text-slate-300 text-xs"
                                    placeholder="Anotações internas restritas..."
                                  />
                                  <Button
                                    size="sm"
                                    className="mt-3 bg-slate-800 hover:bg-slate-700 text-white text-xs"
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
              <div className="flex flex-col gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold uppercase tracking-wider text-white">Inquéritos Policiais</h3>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setRelatorioForm({...relatorioForm, tipo_denuncia: "Inquérito Policial"})}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wider uppercase text-xs"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Inquérito
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-[#0d141e] border-slate-800 text-slate-300">
                      <DialogHeader>
                        <div className="text-center pb-2 border-b border-slate-800">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mb-1">Corregedoria Geral (PMESP)</p>
                          <DialogTitle className="text-white uppercase tracking-wider text-sm">Formulário Oficial de Abertura de Inquérito</DialogTitle>
                        </div>
                      </DialogHeader>
                      <form onSubmit={submitRelatorio} className="space-y-4 mt-2">
                        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><Label className="text-[10px] uppercase text-slate-500">Título / Número do Caso</Label><Input className="bg-slate-950 border-slate-800 text-white h-8 text-xs" value={relatorioForm.titulo} onChange={(e) => setRelatorioForm({ ...relatorioForm, titulo: e.target.value })} placeholder="EX: IP-001/26" /></div>
                            <div className="space-y-1"><Label className="text-[10px] uppercase text-slate-500">Status Inicial</Label><Select value={relatorioForm.status} onValueChange={(v: Status) => setRelatorioForm({ ...relatorioForm, status: v })}><SelectTrigger className="bg-slate-950 border-slate-800 text-white h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-slate-800 text-white">{Object.entries(STATUS_LABEL).map(([val, lab]) => <SelectItem key={val} value={val}>{lab}</SelectItem>)}</SelectContent></Select></div>
                          </div>

                          {/* 0. DADOS DO CORREGEDOR */}
                          <div className="space-y-2 border-l-2 border-red-600 pl-4 bg-red-500/5 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500">0. Dados do Corregedor</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Número do Caso (IP-Nº)</Label><Input value={relatorioForm.dados_detalhados.numero_caso} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, numero_caso: e.target.value}})} placeholder="IP-Nº000" className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Data de Abertura</Label><Input value={relatorioForm.dados_detalhados.data_abertura} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, data_abertura: e.target.value}})} type="date" className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Corregedor Responsável</Label><Input value={relatorioForm.oficial} disabled className="h-8 bg-slate-950 border-slate-800 text-slate-500 text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Patente do Corregedor</Label><Input value={relatorioForm.dados_detalhados.corregedor_patente} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, corregedor_patente: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                            </div>
                            <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Data de Recebimento</Label><Input value={relatorioForm.dados_detalhados.data_recebimento} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, data_recebimento: e.target.value}})} type="date" className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                          </div>

                          {/* 1. DADOS DO RECLAMANTE */}
                          <div className="space-y-2 border-l-2 border-blue-600 pl-4 bg-blue-500/5 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500">1. Dados do Reclamante / Denunciante</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Nome Completo</Label><Input value={relatorioForm.dados_detalhados.reclamante_nome} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_nome: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Número do ID</Label><Input value={relatorioForm.dados_detalhados.reclamante_id} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_id: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Telefone</Label><Input value={relatorioForm.dados_detalhados.reclamante_telefone} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_telefone: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Discord</Label><Input value={relatorioForm.dados_detalhados.reclamante_discord} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_discord: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[9px] uppercase text-slate-500">Denúncia Anônima?</Label>
                              <RadioGroup value={relatorioForm.dados_detalhados.reclamante_anonimo} onValueChange={(v) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_anonimo: v}})} className="flex gap-4 mt-1">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Sim" id="anon-sim" className="border-slate-700 text-blue-600" /><Label htmlFor="anon-sim" className="text-xs text-slate-300 font-normal">Sim</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Não" id="anon-nao" className="border-slate-700 text-blue-600" /><Label htmlFor="anon-nao" className="text-xs text-slate-300 font-normal">Não</Label></div>
                              </RadioGroup>
                            </div>
                          </div>

                          {/* 2. DADOS DO POLICIAL DENUNCIADO */}
                          <div className="space-y-2 border-l-2 border-slate-600 pl-4 bg-slate-500/5 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">2. Dados do Policial Denunciado</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Nome do Policial</Label><Input value={relatorioForm.dados_detalhados.denunciado_nome} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_nome: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Patente / Cargo</Label><Input value={relatorioForm.dados_detalhados.denunciado_patente} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_patente: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Badge / Nº de Identificação</Label><Input value={relatorioForm.dados_detalhados.denunciado_badge} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_badge: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Divisão / Unidade</Label><Input value={relatorioForm.dados_detalhados.denunciado_unidade} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_unidade: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                            </div>
                            <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Prefixo / Modelo da Viatura (se houver)</Label><Input value={relatorioForm.dados_detalhados.denunciado_viatura} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_viatura: e.target.value}})} placeholder="Ex: Adam-12 / Charger" className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                          </div>

                          {/* 3. TIPO DE DENÚNCIA */}
                          <div className="space-y-2 border-l-2 border-amber-600 pl-4 bg-amber-500/5 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500">3. Tipo de Denúncia</h4>
                            <div className="grid grid-cols-2 gap-y-2">
                              {["Uso excessivo da força","Abuso de autoridade","Corrupção","Conduta imprópria","Discriminação / Racismo","Ameaça / Intimidação","Violação de procedimentos","Falsificação de relatório","Assédio","Outro"].map(tipo => (
                                <div key={tipo} className="flex items-center space-x-2">
                                  <Checkbox id={`tipo-ip-${tipo}`} checked={relatorioForm.dados_detalhados.tipo_denuncia_selecionado === tipo} onCheckedChange={() => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, tipo_denuncia_selecionado: tipo}})} className="border-slate-700 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600" />
                                  <Label htmlFor={`tipo-ip-${tipo}`} className="text-[10px] text-slate-300 font-normal">{tipo}</Label>
                                </div>
                              ))}
                            </div>
                            {relatorioForm.dados_detalhados.tipo_denuncia_selecionado === "Outro" && <Input placeholder="Especifique..." value={relatorioForm.dados_detalhados.tipo_denuncia_outro} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, tipo_denuncia_outro: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" />}
                          </div>

                          {/* 4. INFORMAÇÕES DO INCIDENTE */}
                          <div className="space-y-2 border-l-2 border-violet-600 pl-4 bg-violet-500/5 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-400">4. Informações do Incidente</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Data do Ocorrido</Label><Input value={relatorioForm.dados_detalhados.incidente_data} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_data: e.target.value}})} type="date" className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Horário Aproximado</Label><Input value={relatorioForm.dados_detalhados.incidente_horario} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_horario: e.target.value}})} type="time" className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                            </div>
                            <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Local do Incidente</Label><Input value={relatorioForm.dados_detalhados.incidente_local} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_local: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                            <div className="space-y-1">
                              <Label className="text-[9px] uppercase text-slate-500">Havia Testemunhas?</Label>
                              <RadioGroup value={relatorioForm.dados_detalhados.incidente_testemunhas} onValueChange={(v) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_testemunhas: v}})} className="flex gap-4 mt-1">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Sim" id="test-sim" className="border-slate-700 text-violet-600" /><Label htmlFor="test-sim" className="text-xs text-slate-300 font-normal">Sim</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Não" id="test-nao" className="border-slate-700 text-violet-600" /><Label htmlFor="test-nao" className="text-xs text-slate-300 font-normal">Não</Label></div>
                              </RadioGroup>
                            </div>
                            {relatorioForm.dados_detalhados.incidente_testemunhas === "Sim" && (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Nome(s) da(s) Testemunha(s)</Label><Textarea rows={2} value={relatorioForm.dados_detalhados.incidente_testemunhas_nomes} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_testemunhas_nomes: e.target.value}})} className="bg-slate-950 border-slate-800 text-white text-xs" /></div>
                                <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Contato(s) da(s) Testemunha(s)</Label><Textarea rows={2} value={relatorioForm.dados_detalhados.incidente_testemunhas_contatos} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, incidente_testemunhas_contatos: e.target.value}})} className="bg-slate-950 border-slate-800 text-white text-xs" /></div>
                              </div>
                            )}
                          </div>

                          {/* 5. RELATÓRIO DOS FATOS */}
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">5. Relatório dos Fatos Anexado à Denúncia</Label>
                            <Textarea rows={5} className="bg-slate-950 border-slate-800 text-white text-xs leading-relaxed" value={relatorioForm.conteudo} onChange={(e) => setRelatorioForm({ ...relatorioForm, conteudo: e.target.value })} placeholder="Descreva os fatos em detalhes..." />
                          </div>

                          {/* 6. PROVAS E EVIDÊNCIAS */}
                          <div className="space-y-2 border-l-2 border-emerald-600 pl-4 bg-emerald-500/5 py-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">6. Provas e Evidências</h4>
                            <div className="grid grid-cols-3 gap-y-2">
                              {["Fotos","Vídeos","Áudios","Documentos","Bodycam / Dashcam","Outro"].map(prova => (
                                <div key={prova} className="flex items-center space-x-2">
                                  <Checkbox id={`prova-ip-${prova}`} checked={relatorioForm.dados_detalhados.provas_selecionadas?.includes(prova)} onCheckedChange={(checked) => { const c=[...(relatorioForm.dados_detalhados.provas_selecionadas||[])]; if(checked) c.push(prova); else c.splice(c.indexOf(prova),1); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, provas_selecionadas: c}}); }} className="border-slate-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                                  <Label htmlFor={`prova-ip-${prova}`} className="text-[10px] text-slate-300 font-normal">{prova}</Label>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-1 mt-2"><Label className="text-[9px] uppercase text-slate-500">Descrição das Provas</Label><Textarea rows={2} value={relatorioForm.dados_detalhados.provas_descricao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, provas_descricao: e.target.value}})} className="bg-slate-950 border-slate-800 text-white text-xs" placeholder="Descreva as provas..." /></div>
                          </div>

                          <div className="pt-4 border-t border-slate-800 space-y-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Documentos Anexos (Opcional)</h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <Label className="text-[9px] text-slate-500 uppercase">Denúncia</Label>
                                <Select value={relatorioForm.denuncia_id} onValueChange={(v) => setRelatorioForm({ ...relatorioForm, denuncia_id: v })}>
                                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-8 text-[10px] uppercase">
                                    <SelectValue placeholder="Nenhum" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {denuncias.map(d => (
                                      <SelectItem key={d.id} value={d.id} className="text-[10px]">#{d.numero_registro} - {d.titulo}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] text-slate-500 uppercase">Investigação</Label>
                                <Select value={relatorioForm.investigacao_id} onValueChange={(v) => setRelatorioForm({ ...relatorioForm, investigacao_id: v })}>
                                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-8 text-[10px] uppercase">
                                    <SelectValue placeholder="Nenhum" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {investigacoes.map(i => (
                                      <SelectItem key={i.id} value={i.id} className="text-[10px]">#{i.numero_registro} - {i.titulo}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                            </div>
                          </div>

                        </div>
                        <div className="pt-4 border-t border-slate-800 flex justify-end">
                          <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest px-8 uppercase text-[10px]">
                            {submitting ? "Processando..." : "ABRIR INQUÉRITO"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mr-2">Filtrar por Status:</span>
                  <Button 
                    size="sm" variant="outline"
                    className={`font-mono text-[10px] h-7 ${inqueritoFilter === "todas" ? "bg-slate-700 text-white" : "text-slate-400 border-slate-800"}`}
                    onClick={() => setInqueritoFilter("todas")}
                  >
                    TODOS
                  </Button>
                  {Object.entries(STATUS_LABEL).map(([val, lab]) => (
                    <Button 
                      key={val}
                      size="sm" variant="outline"
                      className={`font-mono text-[10px] h-7 ${inqueritoFilter === val ? "bg-slate-700 text-white border-slate-600" : "text-slate-400 border-slate-800"}`}
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
                    <div className="rounded-lg border border-slate-800 border-dashed bg-[#0d141e]/50 p-12 text-center text-slate-500">
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
                            setRelatorioForm({
                              titulo: rel.titulo || "",
                              tipo_denuncia: rel.tipo_denuncia || "Inquérito Policial",
                              oficial: rel.oficial || "",
                              conteudo: rel.conteudo || "",
                              denuncia_id: "",
                              investigacao_id: "",
                              
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
              <div className="flex flex-col gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold uppercase tracking-wider text-white">Atos Administrativos</h3>
                  
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
                    <DialogContent className="sm:max-w-[600px] bg-[#0d141e] border-slate-800 text-slate-300">
                      <DialogHeader>
                        <DialogTitle className="text-white uppercase tracking-wider">Registrar Ato Administrativo</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={submitRelatorio} className="space-y-5 mt-4">
                        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="titulo-ato" className="text-slate-400 text-xs uppercase tracking-wider">Título do Ato</Label>
                              <Input
                                id="titulo-ato"
                                className="bg-slate-950 border-slate-800 text-white"
                                value={relatorioForm.titulo}
                                onChange={(e) => setRelatorioForm({ ...relatorioForm, titulo: e.target.value })}
                                placeholder="EX: ATO-001/26 - SUSPENSÃO"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400 text-xs uppercase tracking-wider">Status do Ato</Label>
                              <Select value={relatorioForm.status} onValueChange={(v: Status) => setRelatorioForm({ ...relatorioForm, status: v })}>
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
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
                                  <Label className="text-[9px] uppercase text-slate-500">Número do Inquérito</Label>
                                  <Input value={relatorioForm.dados_detalhados.ato_numero_inquerito} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_numero_inquerito: e.target.value}})} placeholder="Nº000" className="h-8 bg-slate-950 border-slate-800 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] uppercase text-slate-500">Número do Ato Administrativo</Label>
                                  <Input value={relatorioForm.dados_detalhados.ato_numero} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_numero: e.target.value}})} placeholder="Nº000" className="h-8 bg-slate-950 border-slate-800 text-xs" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-[9px] uppercase text-slate-500">Data de Emissão</Label>
                                  <Input type="date" value={relatorioForm.dados_detalhados.ato_data_emissao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_data_emissao: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] uppercase text-slate-500">Tipo de Ato</Label>
                                  <Select value={relatorioForm.dados_detalhados.ato_tipo} onValueChange={(v) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_tipo: v}})}>
                                    <SelectTrigger className="h-8 bg-slate-950 border-slate-800 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                      <SelectItem value="Aplicação de Medida Disciplinar">Aplicação de Medida Disciplinar</SelectItem>
                                      <SelectItem value="Suspensão Preventiva">Suspensão Preventiva</SelectItem>
                                      <SelectItem value="Arquivamento">Arquivamento</SelectItem>
                                      <SelectItem value="Outro">Outro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              {relatorioForm.dados_detalhados.ato_tipo === "Outro" && <Input placeholder="Especifique..." value={relatorioForm.dados_detalhados.ato_tipo_outro} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_tipo_outro: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-xs mt-1" />}
                            </div>

                            {/* 2. AUTORIDADE EMISSORA */}
                            <div className="space-y-2 border-l-2 border-blue-600 pl-4 bg-blue-500/5 py-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500">2. AUTORIDADE EMISSORA</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-[9px] uppercase text-slate-500">Nome do Corregedor</Label>
                                  <Input value={relatorioForm.dados_detalhados.ato_autoridade_nome} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_autoridade_nome: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] uppercase text-slate-500">Cargo/Patente</Label>
                                  <Input value={relatorioForm.dados_detalhados.ato_autoridade_cargo} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_autoridade_cargo: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-xs" />
                                </div>
                              </div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Departamento / Unidade</Label><Input value={relatorioForm.dados_detalhados.ato_autoridade_unidade} disabled className="h-8 bg-slate-950 border-slate-800 text-slate-500 text-xs" /></div>
                            </div>

                            {/* 3. OBJETO DO ATO */}
                            <div className="space-y-2 border-l-2 border-slate-600 pl-4 bg-slate-500/5 py-3">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">3. OBJETO DO ATO</h4>
                              <Label className="text-[9px] uppercase text-slate-500">Descrição Resumida</Label>
                              <Textarea value={relatorioForm.dados_detalhados.ato_objeto_descricao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_objeto_descricao: e.target.value}})} rows={2} className="bg-slate-950 border-slate-800 text-xs" placeholder="Descreva o objeto..." />
                            </div>

                            {/* 4. FUNDAMENTAÇÃO */}
                            <div className="space-y-2 border-l-2 border-amber-600 pl-4 bg-amber-500/5 py-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500">4. FUNDAMENTAÇÃO</h4>
                              <Label className="text-[9px] uppercase text-slate-500">Base do Ato Administrativo</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {["Relatório interno", "Denúncia formal", "Evidências coletadas", "Ordem superior", "Auditoria interna", "Outro"].map(f => (
                                  <div key={f} className="flex items-center space-x-2">
                                    <Checkbox id={`f-${f}`} checked={relatorioForm.dados_detalhados.ato_fundamentacao_selecionada?.includes(f)} onCheckedChange={(checked) => { const current = [...(relatorioForm.dados_detalhados.ato_fundamentacao_selecionada || [])]; if (checked) current.push(f); else current.splice(current.indexOf(f), 1); setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_fundamentacao_selecionada: current}}); }} />
                                    <Label htmlFor={`f-${f}`} className="text-[10px] font-normal">{f}</Label>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Descrição Complementar</Label><Textarea value={relatorioForm.dados_detalhados.ato_fundamentacao_complementar} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_fundamentacao_complementar: e.target.value}})} rows={2} className="bg-slate-950 border-slate-800 text-xs mt-2" placeholder="Descreva a fundamentação..." /></div>
                            </div>

                            {/* 5. DECISÃO */}
                            <div className="space-y-2 border-l-2 border-emerald-600 pl-4 bg-emerald-500/5 py-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">5. DECISÃO</h4>
                              <div className="space-y-1">
                                <Label className="text-[9px] uppercase text-slate-500">Deliberação da Autoridade</Label>
                                <Textarea value={relatorioForm.dados_detalhados.ato_decisao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_decisao: e.target.value}})} rows={2} className="bg-slate-950 border-slate-800 text-xs" placeholder="Deliberação..." />
                              </div>
                            </div>

                            {/* 6. MEDIDAS DETERMINADAS */}
                            <div className="space-y-2 border-l-2 border-indigo-600 pl-4 bg-indigo-500/5 py-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">6. MEDIDAS DETERMINADAS</h4>
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
                                <Label className="text-[9px] uppercase text-slate-500">Detalhamento das medidas</Label>
                                <Textarea value={relatorioForm.dados_detalhados.ato_medidas_detalhamento} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_medidas_detalhamento: e.target.value}})} rows={3} className="bg-slate-950 border-slate-800 text-xs mt-2" placeholder="Detalhes das medidas..." />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conteúdo Detalhado do Ato</Label>
                              <Textarea rows={6} className="bg-slate-950 border-slate-800 text-white font-mono text-xs leading-relaxed" value={relatorioForm.conteudo} onChange={(e) => setRelatorioForm({ ...relatorioForm, conteudo: e.target.value })} placeholder="Texto integral do ato administrativo..." />
                            </div>

                            <div className="pt-4 border-t border-slate-800 space-y-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Documentos Anexos (Opcional)</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 uppercase">Denúncia</Label>
                                  <Select value={relatorioForm.denuncia_id} onValueChange={(v) => setRelatorioForm({ ...relatorioForm, denuncia_id: v })}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-8 text-[10px] uppercase">
                                      <SelectValue placeholder="Nenhum" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                      <SelectItem value="none">Nenhum</SelectItem>
                                      {denuncias.map(d => (
                                        <SelectItem key={d.id} value={d.id} className="text-[10px]">#{d.numero_registro} - {d.titulo}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 uppercase">Investigação</Label>
                                  <Select value={relatorioForm.investigacao_id} onValueChange={(v) => setRelatorioForm({ ...relatorioForm, investigacao_id: v })}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-8 text-[10px] uppercase">
                                      <SelectValue placeholder="Nenhum" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                      <SelectItem value="none">Nenhum</SelectItem>
                                      {investigacoes.map(i => (
                                        <SelectItem key={i.id} value={i.id} className="text-[10px]">#{i.numero_registro} - {i.titulo}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800 flex justify-end">
                          <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 font-bold tracking-widest text-[10px] uppercase">
                            {submitting ? "Registrando..." : "REGISTRAR ATO"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mr-2">Filtrar por Status:</span>
                  <Button 
                    size="sm" variant="outline"
                    className={`font-mono text-[10px] h-7 ${atoFilter === "todas" ? "bg-slate-700 text-white" : "text-slate-400 border-slate-800"}`}
                    onClick={() => setAtoFilter("todas")}
                  >
                    TODOS
                  </Button>
                  {Object.entries(STATUS_LABEL).map(([val, lab]) => (
                    <Button 
                      key={val}
                      size="sm" variant="outline"
                      className={`font-mono text-[10px] h-7 ${atoFilter === val ? "bg-slate-700 text-white border-slate-600" : "text-slate-400 border-slate-800"}`}
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
                    <div className="rounded-lg border border-slate-800 border-dashed bg-[#0d141e]/50 p-12 text-center text-slate-500">
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
                            setRelatorioForm({
                              titulo: rel.titulo || "",
                              tipo_denuncia: rel.tipo_denuncia || "Ato Administrativo",
                              oficial: rel.oficial || "",
                              conteudo: rel.conteudo || "",
                              denuncia_id: "",
                              investigacao_id: "",
                              
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

          {/* OFICIAIS & SOLICITACOES... (omitidos por brevidade caso não tivessem mudado, mas estão aqui em cima) */}
          {activeTab === "solicitacoes" && isAdmin && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold uppercase tracking-wider text-white">Solicitações de Acesso</h3>
                <span className="text-sm text-slate-400">{pendingUsers.length} pendentes</span>
              </div>
              
              {pendingUsers.length === 0 ? (
                <div className="rounded-lg border border-slate-800 border-dashed bg-[#0d141e]/50 p-12 text-center text-slate-500">
                  Nenhuma solicitação pendente no momento.
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingUsers.map(user => (
                    <div key={user.user_id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0d141e] p-5">
                      <div>
                        <h4 className="font-bold text-white uppercase">{user.full_name}</h4>
                        <div className="mt-1 flex items-center gap-4 text-sm text-slate-400">
                          <span>Placa: #{user.badge_number}</span>
                          <span>Cadastrado em: {format(new Date(user.created_at), "dd/MM/yyyy HH:mm")}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => approveUser(user.role_id, "corregedor")}
                          className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 text-[10px] font-bold uppercase px-3"
                        >
                          Corregedor
                        </Button>
                        <Button 
                          onClick={() => approveUser(user.role_id, "admin")}
                          className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 text-[10px] font-bold uppercase px-3"
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
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold uppercase tracking-wider text-white">Diretório de Oficiais</h3>
                <span className="text-sm text-slate-400">{oficiais.length} oficiais registrados</span>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {oficiais.map(oficial => (
                  <div key={oficial.id} className="flex flex-col rounded-lg border border-slate-800 bg-[#0d141e] p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-blue-500/10 text-blue-400">
                          <Users className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white uppercase tracking-wider">{oficial.full_name}</h4>
                          <span className="text-xs text-slate-500 font-mono">DISTINTIVO: #{oficial.badge_number}</span>
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
                    
                    <div className="flex flex-col gap-4 border-t border-slate-800 pt-4 mt-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Permissão</p>
                          {isAdmin ? (
                            <Select 
                              defaultValue={oficial.role} 
                              onValueChange={(v: any) => changeUserRole(oficial.id, v)}
                            >
                              <SelectTrigger className="bg-slate-950 border-slate-800 text-amber-500 font-bold text-[10px] uppercase h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                <SelectItem value="corregedor">Corregedor</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-amber-500 font-bold text-[10px] uppercase">
                              {oficial.role}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Patente / Cargo</p>
                          {isAdmin ? (
                            <div className="flex gap-1">
                              <Input 
                                defaultValue={oficial.patente || "Oficial"}
                                id={`patente-${oficial.id}`}
                                className="bg-slate-950 border-slate-800 text-blue-400 font-mono text-[10px] uppercase h-9 flex-1"
                              />
                              <Button 
                                size="sm"
                                onClick={() => {
                                  const el = document.getElementById(`patente-${oficial.id}`) as HTMLInputElement;
                                  updatePatente(oficial.id, el.value);
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-white h-9 px-2"
                              >
                                Salvar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-blue-400 font-mono text-[10px] uppercase">
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
        <DialogContent className="sm:max-w-[600px] bg-[#0d141e] border-slate-800 text-slate-300">
          <DialogHeader>
            <div className="text-center pb-2 border-b border-slate-800">
              <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mb-1">Corregedoria Geral (PMESP)</p>
              <DialogTitle className="text-white uppercase tracking-wider text-sm">Editar {relatorioForm.tipo_denuncia}</DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={updateRelatorio} className="space-y-4 mt-2">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-5 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] uppercase text-slate-500">Título / Número do Caso</Label><Input className="bg-slate-950 border-slate-800 text-white h-8 text-xs" value={relatorioForm.titulo} onChange={(e) => setRelatorioForm({ ...relatorioForm, titulo: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase text-slate-500">Status</Label><Select value={relatorioForm.status} onValueChange={(v: Status) => setRelatorioForm({ ...relatorioForm, status: v })}><SelectTrigger className="bg-slate-950 border-slate-800 text-white h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-slate-800 text-white">{Object.entries(STATUS_LABEL).map(([val, lab]) => <SelectItem key={val} value={val}>{lab}</SelectItem>)}</SelectContent></Select></div>
              </div>

              {relatorioForm.tipo_denuncia === "Inquérito Policial" ? (
                <>
                  {/* 0. DADOS DO CORREGEDOR */}
                  <div className="space-y-2 border-l-2 border-red-600 pl-4 bg-red-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500">0. Dados do Corregedor</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Número do Caso</Label><Input value={relatorioForm.dados_detalhados.numero_caso} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, numero_caso: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Data de Abertura</Label><Input value={relatorioForm.dados_detalhados.data_abertura} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, data_abertura: e.target.value}})} type="date" className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                    </div>
                  </div>

                  {/* 1. DADOS DO RECLAMANTE */}
                  <div className="space-y-2 border-l-2 border-blue-600 pl-4 bg-blue-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500">1. Dados do Reclamante</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Nome</Label><Input value={relatorioForm.dados_detalhados.reclamante_nome} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_nome: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">ID</Label><Input value={relatorioForm.dados_detalhados.reclamante_id} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, reclamante_id: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                    </div>
                  </div>

                  {/* 2. DADOS DO POLICIAL DENUNCIADO */}
                  <div className="space-y-2 border-l-2 border-slate-600 pl-4 bg-slate-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">2. Dados do Policial Denunciado</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Nome do Policial</Label><Input value={relatorioForm.dados_detalhados.denunciado_nome} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_nome: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Badge</Label><Input value={relatorioForm.dados_detalhados.denunciado_badge} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, denunciado_badge: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-white text-xs" /></div>
                    </div>
                  </div>

                  {/* 5. RELATÓRIO DOS FATOS */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">5. Relatório dos Fatos</Label>
                    <Textarea rows={5} className="bg-slate-950 border-slate-800 text-white text-xs leading-relaxed" value={relatorioForm.conteudo} onChange={(e) => setRelatorioForm({ ...relatorioForm, conteudo: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  {/* ATO ADMINISTRATIVO FIELDS */}
                  <div className="space-y-2 border-l-2 border-red-600 pl-4 bg-red-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500">1. IDENTIFICAÇÃO DO ATO</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Número do Ato</Label><Input value={relatorioForm.dados_detalhados.ato_numero} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_numero: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase text-slate-500">Data de Emissão</Label><Input type="date" value={relatorioForm.dados_detalhados.ato_data_emissao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_data_emissao: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-xs" /></div>
                    </div>
                  </div>

                  <div className="space-y-2 border-l-2 border-blue-600 pl-4 bg-blue-500/5 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500">2. AUTORIDADE EMISSORA</h4>
                    <Input value={relatorioForm.dados_detalhados.ato_autoridade_nome} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_autoridade_nome: e.target.value}})} className="h-8 bg-slate-950 border-slate-800 text-xs" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">5. DECISÃO</Label>
                    <Textarea rows={5} className="bg-slate-950 border-slate-800 text-white text-xs leading-relaxed" value={relatorioForm.dados_detalhados.ato_decisao} onChange={(e) => setRelatorioForm({...relatorioForm, dados_detalhados: {...relatorioForm.dados_detalhados, ato_decisao: e.target.value}})} />
                  </div>
                </>
              )}
            </div>
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-500 text-white px-8 font-bold tracking-widest text-[10px] uppercase">
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
          ? "bg-blue-500/10 text-blue-400 shadow-[inset_2px_0_0_0_rgba(59,130,246,1)]" 
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
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
    <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-[#0d141e] p-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</span>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="text-4xl font-bold text-white tracking-wider">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      {children}
    </div>
  );
}
