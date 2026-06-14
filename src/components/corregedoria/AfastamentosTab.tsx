import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Shield, FileText, Loader2, Plus, LayoutDashboard, Users, Trash2, Edit,
  Printer, Search, X, FileSignature, Activity, ClipboardList, Eye,
  ChevronDown, ChevronRight, AlertTriangle, UserCheck, ScrollText,
  BookOpen, Ban, Clock, Gavel, Download, Copy, History, FileDown
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Skeleton } from "@/components/skeleton";
import { StatCard } from "@/components/corregedoria/StatCard";
import { Field } from "@/components/corregedoria/Field";
import { logAudit } from "@/lib/audit-log";
import {
  AFASTAMENTO_STATUS_LABEL, AFASTAMENTO_STATUS_COLOR,
  INVESTIGACAO_POLICIAL_STATUS_LABEL, INVESTIGACAO_POLICIAL_STATUS_COLOR,
  INQUERITO_POLICIAL_STATUS_LABEL, INQUERITO_POLICIAL_STATUS_COLOR,
} from "@/lib/corregedoria/constants";
import type {
  Afastamento, AfastamentoStatus,
  InvestigacaoPolicial, InvestigacaoPolicialStatus,
  InqueritoPolicial, InqueritoPolicialStatus,
  Advertencia, VersaoDocumento,
} from "@/lib/corregedoria/types";
import { generatePortariaText, printPortaria } from "@/lib/corregedoria/portaria";
import type { PortariaData } from "@/lib/corregedoria/portaria";
import { PortariaPreview } from "@/components/corregedoria/PortariaPreview";

type AfastamentoSubTab = "dashboard" | "listagem" | "historico";

interface PortariaFormData {
  numero_portaria: string;
  ano: string;
  nome_policial: string;
  posto_graduacao: string;
  rg_pm: string;
  unidade: string;
  funcao: string;
  motivo_afastamento: string;
  prazo_afastamento: string;
  numero_procedimento: string;
  data_portaria: string;
  corregedor_responsavel: string;
  corregedor_cargo: string;
  status: AfastamentoStatus;
}

function toPortariaData(form: PortariaFormData): PortariaData {
  return {
    numero_portaria: form.numero_portaria,
    ano: form.ano,
    nome_policial: form.nome_policial,
    posto_graduacao: form.posto_graduacao,
    rg_pm: form.rg_pm,
    unidade: form.unidade,
    funcao: form.funcao,
    motivo_afastamento: form.motivo_afastamento,
    prazo_afastamento: form.prazo_afastamento,
    numero_procedimento: form.numero_procedimento,
    data_portaria: form.data_portaria,
    corregedor_responsavel: form.corregedor_responsavel,
    corregedor_cargo: form.corregedor_cargo,
  };
}

const defaultForm: PortariaFormData = {
  numero_portaria: "",
  ano: String(new Date().getFullYear()),
  nome_policial: "",
  posto_graduacao: "",
  rg_pm: "",
  unidade: "",
  funcao: "",
  motivo_afastamento: "",
  prazo_afastamento: "",
  numero_procedimento: "",
  data_portaria: format(new Date(), "yyyy-MM-dd"),
  corregedor_responsavel: "",
  corregedor_cargo: "Corregedor Geral da Polícia Militar",
  status: "ativo",
};

export function AfastamentosTab(_props: Record<string, never>) {
  const { user, isAdmin, roles } = useAuth();
  const currentRole = roles[0] || "consulta";
  const canDelete = currentRole === "corregedor_geral" || currentRole === "subcorregedor" || isAdmin;
  const canEdit = currentRole === "corregedor_geral" || currentRole === "subcorregedor" || currentRole === "corregedor" || currentRole === "investigador" || isAdmin;
  const canCreate = canEdit;

  const [loading, setLoading] = useState(true);
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);
  const [investigacoes, setInvestigacoes] = useState<InvestigacaoPolicial[]>([]);
  const [inqueritos, setInqueritos] = useState<InqueritoPolicial[]>([]);
  const [advertencias, setAdvertencias] = useState<Advertencia[]>([]);

  const [subTab, setSubTab] = useState<AfastamentoSubTab>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [afastamentoForm, setAfastamentoForm] = useState<PortariaFormData>(defaultForm);
  const [afastamentoDialogOpen, setAfastamentoDialogOpen] = useState(false);
  const [afastamentoEditDialogOpen, setAfastamentoEditDialogOpen] = useState(false);
  const [editingAfastamentoId, setEditingAfastamentoId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PortariaData | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyVersions, setHistoryVersions] = useState<VersaoDocumento[]>([]);
  const [historyTitle, setHistoryTitle] = useState("");

  const loadAfastamentos = async () => {
    const { data, error } = await supabase
      .from("afastamentos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Erro ao carregar afastamentos"); return; }
    setAfastamentos(data || []);
  };

  const loadLinkedData = async () => {
    const [invRes, inqRes, advRes] = await Promise.all([
      supabase.from("investigacoes_policial").select("*"),
      supabase.from("inqueritos_policial").select("*"),
      supabase.from("advertencias").select("*"),
    ]);
    if (invRes.data) setInvestigacoes(invRes.data);
    if (inqRes.data) setInqueritos(inqRes.data);
    if (advRes.data) setAdvertencias(advRes.data);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadAfastamentos(), loadLinkedData()]);
      setLoading(false);
    };
    init();
  }, []);

  const stats = {
    ativos: afastamentos.filter(a => a.status === "ativo").length,
    encerrados: afastamentos.filter(a => a.status === "encerrado").length,
    emInvestigacao: afastamentos.filter(a => a.status === "em_investigacao").length,
    emInquerito: afastamentos.filter(a => a.status === "em_inquerito").length,
  };

  const filteredAfastamentos = afastamentos.filter(a => {
    const matchesSearch = !searchTerm ||
      a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.rg_pm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.numero_portaria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "todos" || a.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getInvestigacoes = (afastamentoId: string) => investigacoes.filter(i => i.afastamento_id === afastamentoId);
  const getInqueritos = (afastamentoId: string) => inqueritos.filter(i => i.afastamento_id === afastamentoId);
  const getAdvertencias = (afastamentoId: string) => advertencias.filter(a => a.afastamento_id === afastamentoId);

  const resetForm = () => {
    setAfastamentoForm({
      ...defaultForm,
      ano: String(new Date().getFullYear()),
      data_portaria: format(new Date(), "yyyy-MM-dd"),
      corregedor_responsavel: user?.user_metadata?.full_name || "",
    });
  };

  const formToDb = (form: PortariaFormData) => {
    const docText = generatePortariaText(toPortariaData(form));
    return {
      numero_portaria: form.numero_portaria,
      ano: form.ano,
      data_portaria: form.data_portaria,
      posto_graduacao: form.posto_graduacao,
      nome_completo: form.nome_policial,
      rg_pm: form.rg_pm,
      unidade: form.unidade,
      funcao_cargo: form.funcao || null,
      motivo_afastamento: form.motivo_afastamento,
      prazo_afastamento: form.prazo_afastamento,
      numero_procedimento: form.numero_procedimento,
      responsavel_decisao: form.corregedor_responsavel,
      corregedor_cargo: form.corregedor_cargo,
      documento_conteudo: docText,
      autor_id: user?.id || null,
      autor_nome: user?.user_metadata?.full_name || form.corregedor_responsavel,
      status: form.status,
    };
  };

  const createAfastamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setSubmitting(true);
    const insertData = formToDb(afastamentoForm);
    const { error } = await supabase.from("afastamentos").insert(insertData);
    if (error) {
      toast.error("Erro ao criar afastamento: " + error.message);
    } else {
      toast.success("Afastamento cadastrado com sucesso!");
      setAfastamentoDialogOpen(false);
      resetForm();
      logAudit("create", "afastamentos", { nome: afastamentoForm.nome_policial });
      await loadAfastamentos();
    }
    setSubmitting(false);
  };

  const updateAfastamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !editingAfastamentoId) return;
    setSubmitting(true);
    const existing = afastamentos.find(a => a.id === editingAfastamentoId);
    const updateData = formToDb(afastamentoForm);
    let versoes: VersaoDocumento[] = [];
    if (existing?.historico_versoes) {
      try {
        versoes = typeof existing.historico_versoes === "string"
          ? JSON.parse(existing.historico_versoes)
          : existing.historico_versoes;
      } catch { versoes = []; }
    }
    const novaVersao: VersaoDocumento = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      data: new Date().toISOString(),
      autor: user?.user_metadata?.full_name || afastamentoForm.corregedor_responsavel,
      documento: existing?.documento_conteudo || "",
      alteracoes: "Atualização do documento",
    };
    versoes.unshift(novaVersao);
    updateData.historico_versoes = versoes;
    const { error } = await supabase
      .from("afastamentos")
      .update(updateData)
      .eq("id", editingAfastamentoId);
    if (error) {
      toast.error("Erro ao atualizar afastamento: " + error.message);
    } else {
      toast.success("Afastamento atualizado!");
      setAfastamentoEditDialogOpen(false);
      setEditingAfastamentoId(null);
      resetForm();
      logAudit("update", "afastamentos", { id: editingAfastamentoId });
      await loadAfastamentos();
    }
    setSubmitting(false);
  };

  const deleteAfastamento = async (id: string) => {
    if (!canDelete) {
      toast.error("Apenas Corregedor Geral e Subcorregedor podem excluir registros.");
      return;
    }
    const { error } = await supabase.from("afastamentos").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir: " + error.message); }
    else {
      toast.success("Afastamento excluído!");
      logAudit("delete", "afastamentos", { id });
      await loadAfastamentos();
    }
    setDeleteConfirmId(null);
  };

  const updateAfastamentoStatus = async (id: string, status: AfastamentoStatus) => {
    const { error } = await supabase.from("afastamentos").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
    else { toast.success("Status atualizado!"); await loadAfastamentos(); }
  };

  const duplicateAfastamento = async (a: Afastamento) => {
    if (!canCreate) return;
    const docText = a.documento_conteudo || generatePortariaText({
      numero_portaria: a.numero_portaria + "-copia",
      ano: String(new Date().getFullYear()),
      nome_policial: a.nome_completo,
      posto_graduacao: a.posto_graduacao,
      rg_pm: a.rg_pm,
      unidade: a.unidade,
      funcao: a.funcao_cargo || "",
      motivo_afastamento: a.motivo_afastamento,
      prazo_afastamento: a.prazo_afastamento,
      numero_procedimento: a.numero_procedimento,
      data_portaria: format(new Date(), "yyyy-MM-dd"),
      corregedor_responsavel: a.responsavel_decisao,
      corregedor_cargo: a.corregedor_cargo || "Corregedor Geral da Polícia Militar",
    });
    const { error } = await supabase.from("afastamentos").insert({
      numero_portaria: a.numero_portaria + "-copia",
      ano: String(new Date().getFullYear()),
      data_portaria: format(new Date(), "yyyy-MM-dd"),
      posto_graduacao: a.posto_graduacao,
      nome_completo: a.nome_completo,
      rg_pm: a.rg_pm,
      unidade: a.unidade,
      funcao_cargo: a.funcao_cargo,
      motivo_afastamento: a.motivo_afastamento,
      prazo_afastamento: a.prazo_afastamento,
      numero_procedimento: a.numero_procedimento,
      responsavel_decisao: a.responsavel_decisao,
      corregedor_cargo: a.corregedor_cargo,
      documento_conteudo: docText,
      autor_id: user?.id || null,
      autor_nome: user?.user_metadata?.full_name || a.responsavel_decisao,
      status: a.status,
    });
    if (error) toast.error("Erro ao duplicar: " + error.message);
    else { toast.success("Documento duplicado!"); await loadAfastamentos(); }
  };

  const openPreview = (form: PortariaFormData) => {
    setPreviewData(toPortariaData(form));
    setPreviewOpen(true);
  };

  const openHistory = (a: Afastamento) => {
    let versoes: VersaoDocumento[] = [];
    if (a.historico_versoes) {
      try {
        versoes = typeof a.historico_versoes === "string"
          ? JSON.parse(a.historico_versoes)
          : a.historico_versoes;
      } catch { versoes = []; }
    }
    setHistoryVersions(versoes);
    setHistoryTitle(`Histórico - Portaria nº ${a.numero_portaria}/${a.ano}`);
    setHistoryDialogOpen(true);
  };

  const editAfastamento = async (a: Afastamento) => {
    setAfastamentoForm({
      numero_portaria: a.numero_portaria,
      ano: a.ano,
      nome_policial: a.nome_completo,
      posto_graduacao: a.posto_graduacao,
      rg_pm: a.rg_pm,
      unidade: a.unidade,
      funcao: a.funcao_cargo || "",
      motivo_afastamento: a.motivo_afastamento,
      prazo_afastamento: a.prazo_afastamento,
      numero_procedimento: a.numero_procedimento,
      data_portaria: a.data_portaria,
      corregedor_responsavel: a.responsavel_decisao,
      corregedor_cargo: a.corregedor_cargo || "Corregedor Geral da Polícia Militar",
      status: a.status,
    });
    setEditingAfastamentoId(a.id);
    setAfastamentoEditDialogOpen(true);
  };

  const renderFormFields = (isEdit: boolean) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <Label className="text-xs font-semibold">Nº da Portaria *</Label>
        <Input value={afastamentoForm.numero_portaria} onChange={e => setAfastamentoForm(f => ({ ...f, numero_portaria: e.target.value }))} placeholder="Ex: 001" required />
      </div>
      <div>
        <Label className="text-xs font-semibold">Ano *</Label>
        <Input value={afastamentoForm.ano} onChange={e => setAfastamentoForm(f => ({ ...f, ano: e.target.value }))} placeholder={String(new Date().getFullYear())} required />
      </div>
      <div>
        <Label className="text-xs font-semibold">Data da Portaria *</Label>
        <Input type="date" value={afastamentoForm.data_portaria} onChange={e => setAfastamentoForm(f => ({ ...f, data_portaria: e.target.value }))} required />
      </div>
      <div>
        <Label className="text-xs font-semibold">Posto/Graduação *</Label>
        <Input value={afastamentoForm.posto_graduacao} onChange={e => setAfastamentoForm(f => ({ ...f, posto_graduacao: e.target.value }))} placeholder="Ex: 1º SGT PM" required />
      </div>
      <div>
        <Label className="text-xs font-semibold">Nome do Policial *</Label>
        <Input value={afastamentoForm.nome_policial} onChange={e => setAfastamentoForm(f => ({ ...f, nome_policial: e.target.value }))} placeholder="Nome completo" required />
      </div>
      <div>
        <Label className="text-xs font-semibold">RG PM *</Label>
        <Input value={afastamentoForm.rg_pm} onChange={e => setAfastamentoForm(f => ({ ...f, rg_pm: e.target.value }))} placeholder="Nº do RG PM" required />
      </div>
      <div>
        <Label className="text-xs font-semibold">Unidade *</Label>
        <Input value={afastamentoForm.unidade} onChange={e => setAfastamentoForm(f => ({ ...f, unidade: e.target.value }))} placeholder="Unidade de lotação" required />
      </div>
      <div>
        <Label className="text-xs font-semibold">Função</Label>
        <Input value={afastamentoForm.funcao} onChange={e => setAfastamentoForm(f => ({ ...f, funcao: e.target.value }))} placeholder="Função/cargo" />
      </div>
      <div>
        <Label className="text-xs font-semibold">Prazo do Afastamento *</Label>
        <Input value={afastamentoForm.prazo_afastamento} onChange={e => setAfastamentoForm(f => ({ ...f, prazo_afastamento: e.target.value }))} placeholder="Ex: 90 dias" required />
      </div>
      <div>
        <Label className="text-xs font-semibold">Nº do Procedimento *</Label>
        <Input value={afastamentoForm.numero_procedimento} onChange={e => setAfastamentoForm(f => ({ ...f, numero_procedimento: e.target.value }))} placeholder="Nº do procedimento apuratório" required />
      </div>
      <div className="md:col-span-2 lg:col-span-1">
        <Label className="text-xs font-semibold">Motivo do Afastamento *</Label>
        <Input value={afastamentoForm.motivo_afastamento} onChange={e => setAfastamentoForm(f => ({ ...f, motivo_afastamento: e.target.value }))} placeholder="Motivo" required />
      </div>
      <div>
        <Label className="text-xs font-semibold">Status</Label>
        <Select value={afastamentoForm.status} onValueChange={v => setAfastamentoForm(f => ({ ...f, status: v as AfastamentoStatus }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="em_investigacao">Em Investigação</SelectItem>
            <SelectItem value="em_inquerito">Em Inquérito</SelectItem>
            <SelectItem value="encerrado">Encerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label className="text-xs font-semibold">Corregedor Responsável *</Label>
        <Input value={afastamentoForm.corregedor_responsavel} onChange={e => setAfastamentoForm(f => ({ ...f, corregedor_responsavel: e.target.value }))} placeholder="Nome do Corregedor" required />
      </div>
      <div>
        <Label className="text-xs font-semibold">Cargo do Corregedor</Label>
        <Input value={afastamentoForm.corregedor_cargo} onChange={e => setAfastamentoForm(f => ({ ...f, corregedor_cargo: e.target.value }))} />
      </div>
      <div className="md:col-span-2 lg:col-span-3 flex items-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => openPreview(afastamentoForm)} className="gap-2">
          <Eye className="h-4 w-4" /> Visualizar Documento
        </Button>
        {!isEdit && (
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
            {submitting ? "Salvando..." : "Emitir Portaria"}
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-60" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  let content: React.ReactNode;

  if (subTab === "dashboard") {
    const recentAfastamentos = afastamentos.slice(0, 5);
    content = (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Ativos" value={stats.ativos} icon={Shield} color="bg-red-500/10 text-red-600 border-red-500/20" />
          <StatCard title="Em Investigação" value={stats.emInvestigacao} icon={Search} color="bg-amber-500/10 text-amber-600 border-amber-500/20" />
          <StatCard title="Em Inquérito" value={stats.emInquerito} icon={Gavel} color="bg-blue-500/10 text-blue-600 border-blue-500/20" />
          <StatCard title="Encerrados" value={stats.encerrados} icon={Ban} color="bg-gray-500/10 text-gray-600 border-gray-500/20" />
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h4 className="font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Distribuição por Status
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["ativo", "em_investigacao", "em_inquerito", "encerrado"] as const).map(s => {
              const count = stats[s === "em_investigacao" ? "emInvestigacao" : s === "em_inquerito" ? "emInquerito" : s === "encerrado" ? "encerrados" : "ativos"];
              const total = afastamentos.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={s} className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">{AFASTAMENTO_STATUS_LABEL[s]}</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className={`h-1.5 rounded-full ${AFASTAMENTO_STATUS_COLOR[s].replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {canCreate && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h4 className="font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileSignature className="h-4 w-4" /> Ações Rápidas
            </h4>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => { resetForm(); setAfastamentoDialogOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> Nova Portaria de Afastamento
              </Button>
            </div>
          </div>
        )}

        {recentAfastamentos.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h4 className="font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Últimas Portarias Emitidas
            </h4>
            <div className="space-y-2">
              {recentAfastamentos.map(a => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={AFASTAMENTO_STATUS_COLOR[a.status]}>
                      {AFASTAMENTO_STATUS_LABEL[a.status]}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{a.posto_graduacao} {a.nome_completo}</p>
                      <p className="text-xs text-muted-foreground">Portaria nº {a.numero_portaria}/{a.ano} • {a.unidade}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd/MM/yyyy")}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } else if (subTab === "listagem") {
    content = (
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, RG, unidade ou portaria..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              {searchTerm && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer text-muted-foreground" onClick={() => setSearchTerm("")} />}
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                {(["ativo", "em_investigacao", "em_inquerito", "encerrado"] as const).map(s => (
                  <SelectItem key={s} value={s}>{AFASTAMENTO_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canCreate && (
            <Button onClick={() => { resetForm(); setAfastamentoDialogOpen(true); }} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Nova Portaria
            </Button>
          )}
        </div>

        {filteredAfastamentos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma portaria encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAfastamentos.map(a => {
              const isExpanded = expandedId === a.id;
              return (
                <div key={a.id} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="p-4 flex items-start justify-between cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={AFASTAMENTO_STATUS_COLOR[a.status]}>{AFASTAMENTO_STATUS_LABEL[a.status]}</Badge>
                        <span className="text-xs font-mono text-muted-foreground">Portaria nº {a.numero_portaria}/{a.ano}</span>
                      </div>
                      <p className="font-semibold text-sm truncate">{a.posto_graduacao} {a.nome_completo}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span>RG PM: {a.rg_pm}</span>
                        <span>{a.unidade}</span>
                        <span>Prazo: {a.prazo_afastamento}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={e => { e.stopPropagation(); editAfastamento(a); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canCreate && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicar" onClick={e => { e.stopPropagation(); duplicateAfastamento(a); }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar documento" onClick={e => {
                        e.stopPropagation();
                        setPreviewData({
                          numero_portaria: a.numero_portaria,
                          ano: a.ano,
                          nome_policial: a.nome_completo,
                          posto_graduacao: a.posto_graduacao,
                          rg_pm: a.rg_pm,
                          unidade: a.unidade,
                          funcao: a.funcao_cargo || "",
                          motivo_afastamento: a.motivo_afastamento,
                          prazo_afastamento: a.prazo_afastamento,
                          numero_procedimento: a.numero_procedimento,
                          data_portaria: a.data_portaria,
                          corregedor_responsavel: a.responsavel_decisao,
                          corregedor_cargo: a.corregedor_cargo || "Corregedor Geral da Polícia Militar",
                        });
                        setPreviewOpen(true);
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {a.historico_versoes && <Button variant="ghost" size="icon" className="h-8 w-8" title="Histórico" onClick={e => { e.stopPropagation(); openHistory(a); }}>
                        <History className="h-4 w-4" />
                      </Button>}
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Imprimir" onClick={e => {
                        e.stopPropagation();
                        printPortaria({
                          numero_portaria: a.numero_portaria,
                          ano: a.ano,
                          nome_policial: a.nome_completo,
                          posto_graduacao: a.posto_graduacao,
                          rg_pm: a.rg_pm,
                          unidade: a.unidade,
                          funcao: a.funcao_cargo || "",
                          motivo_afastamento: a.motivo_afastamento,
                          prazo_afastamento: a.prazo_afastamento,
                          numero_procedimento: a.numero_procedimento,
                          data_portaria: a.data_portaria,
                          corregedor_responsavel: a.responsavel_decisao,
                          corregedor_cargo: a.corregedor_cargo || "Corregedor Geral da Polícia Militar",
                        });
                      }}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir" onClick={e => { e.stopPropagation(); setDeleteConfirmId(a.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-muted/20 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Field label="Procedimento"><span className="text-sm font-medium">{a.numero_procedimento}</span></Field>
                        <Field label="Motivo"><span className="text-sm font-medium">{a.motivo_afastamento}</span></Field>
                        <Field label="Responsável"><span className="text-sm font-medium">{a.responsavel_decisao}</span></Field>
                        <Field label="Data"><span className="text-sm font-medium">{format(new Date(a.data_portaria), "dd/MM/yyyy")}</span></Field>
                      </div>

                      {a.documento_conteudo && (
                        <div>
                          <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Documento</h5>
                          <pre className="text-xs font-mono bg-muted p-3 rounded-lg whitespace-pre-wrap border border-border max-h-60 overflow-y-auto">{a.documento_conteudo}</pre>
                        </div>
                      )}

                      <LinkedTables
                        afastamentoId={a.id}
                        investigacoes={getInvestigacoes(a.id)}
                        inqueritos={getInqueritos(a.id)}
                        advertencias={getAdvertencias(a.id)}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onReload={() => loadLinkedData()}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  } else if (subTab === "historico") {
    const [historicoSearch, setHistoricoSearch] = useState("");
    const uniquePoliciais = Array.from(new Map(afastamentos.map(a => [a.rg_pm, a])).values());
    const filteredPoliciais = uniquePoliciais.filter(p =>
      !historicoSearch || p.nome_completo.toLowerCase().includes(historicoSearch.toLowerCase()) || p.rg_pm.includes(historicoSearch)
    );
    content = (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-lg font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Histórico Individual do Policial
          </h3>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar policial por nome ou RG PM..." value={historicoSearch} onChange={e => setHistoricoSearch(e.target.value)} className="pl-9" />
            {historicoSearch && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer text-muted-foreground" onClick={() => setHistoricoSearch("")} />}
          </div>
        </div>

        {filteredPoliciais.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum policial encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPoliciais.map(p => {
              const registros = afastamentos.filter(a => a.rg_pm === p.rg_pm);
              return (
                <div key={p.rg_pm} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="p-4 bg-muted/30 flex items-center justify-between border-b border-border">
                    <div>
                      <h4 className="font-bold">{p.posto_graduacao} {p.nome_completo}</h4>
                      <p className="text-sm text-muted-foreground">RG PM: {p.rg_pm} • {p.unidade}</p>
                    </div>
                    <Badge variant="outline">{registros.length} registro(s)</Badge>
                  </div>
                  <div className="divide-y divide-border">
                    {registros.map(r => (
                      <div key={r.id} className="p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className={AFASTAMENTO_STATUS_COLOR[r.status]}>{AFASTAMENTO_STATUS_LABEL[r.status]}</Badge>
                          <span className="text-xs text-muted-foreground">Portaria nº {r.numero_portaria}/{r.ano}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Prazo: {r.prazo_afastamento} • Procedimento: {r.numero_procedimento}</p>
                        <p className="text-sm text-muted-foreground">Responsável: {r.responsavel_decisao}</p>
                        <div className="flex gap-2 mt-2">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                            setPreviewData({
                              numero_portaria: r.numero_portaria,
                              ano: r.ano,
                              nome_policial: r.nome_completo,
                              posto_graduacao: r.posto_graduacao,
                              rg_pm: r.rg_pm,
                              unidade: r.unidade,
                              funcao: r.funcao_cargo || "",
                              motivo_afastamento: r.motivo_afastamento,
                              prazo_afastamento: r.prazo_afastamento,
                              numero_procedimento: r.numero_procedimento,
                              data_portaria: r.data_portaria,
                              corregedor_responsavel: r.responsavel_decisao,
                              corregedor_cargo: r.corregedor_cargo || "Corregedor Geral da Polícia Militar",
                            });
                            setPreviewOpen(true);
                          }}>
                            <Eye className="h-3 w-3" /> Documento
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                            setHistoricoSearch(r.rg_pm);
                          }}>
                            <FileText className="h-3 w-3" /> Detalhes
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Criado em {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm")} por {r.autor_nome || r.responsavel_decisao}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Button variant={subTab === "dashboard" ? "default" : "ghost"} size="sm" onClick={() => setSubTab("dashboard")} className="gap-1.5">
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </Button>
        <Button variant={subTab === "listagem" ? "default" : "ghost"} size="sm" onClick={() => setSubTab("listagem")} className="gap-1.5">
          <ClipboardList className="h-4 w-4" /> Portarias
        </Button>
        <Button variant={subTab === "historico" ? "default" : "ghost"} size="sm" onClick={() => setSubTab("historico")} className="gap-1.5">
          <BookOpen className="h-4 w-4" /> Histórico
        </Button>
      </div>

      {content}

      {/* Create Dialog */}
      <Dialog open={afastamentoDialogOpen} onOpenChange={setAfastamentoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" /> Nova Portaria de Afastamento
            </DialogTitle>
            <DialogDescription>
              Preencha os dados para gerar a Portaria de Afastamento Cautelar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createAfastamento} className="space-y-6">
            {renderFormFields(false)}
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={afastamentoEditDialogOpen} onOpenChange={setAfastamentoEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" /> Editar Portaria de Afastamento
            </DialogTitle>
            <DialogDescription>
              Altere os dados da portaria. Uma nova versão será registrada no histórico.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={updateAfastamento} className="space-y-6">
            {renderFormFields(true)}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => openPreview(afastamentoForm)} className="gap-2">
                <Eye className="h-4 w-4" /> Visualizar
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
                {submitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> Pré-visualização da Portaria
            </DialogTitle>
            <DialogDescription>
              Documento oficial gerado. Use o botão abaixo para imprimir ou exportar.
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <PortariaPreview data={previewData} />
              <div className="flex justify-end gap-2 pt-2 border-t border-border no-print">
                <Button variant="outline" onClick={() => { if (previewData) printPortaria(previewData); }} className="gap-2">
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
                <Button variant="outline" onClick={() => {
                  if (!previewData) return;
                  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Portaria nº ${previewData.numero_portaria}/${previewData.ano}</title>
<style>
@page{margin:2.5cm 2cm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.6;color:#000;padding:0}
.header{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #000}
.header .gov{font-size:10pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px}
.header .org{font-size:9pt;margin-top:2px}
.header .title{font-size:14pt;font-weight:bold;text-transform:uppercase;margin-top:8px;letter-spacing:2px}
.header .subtitle{font-size:11pt;font-weight:bold;text-transform:uppercase;margin-top:4px}
.portaria-num{text-align:center;font-size:13pt;font-weight:bold;text-transform:uppercase;margin:30px 0 20px}
.ementa{text-align:justify;font-size:11pt;margin-bottom:25px;font-style:italic}
.resolve{text-align:center;font-size:12pt;font-weight:bold;text-transform:uppercase;margin:25px 0 20px;letter-spacing:3px}
.artigo{text-align:justify;font-size:12pt;margin-bottom:12px;text-indent:2cm}
.final{text-align:center;font-size:11pt;font-weight:bold;text-transform:uppercase;margin:25px 0 30px;letter-spacing:2px}
.rodape{text-align:center;margin-top:50px}
.rodape .local-data{font-size:11pt;margin-bottom:15px}
.rodape .linha{font-size:11pt;margin-bottom:5px}
.rodape .nome{font-size:11pt;font-weight:bold}
.rodape .cargo{font-size:10pt}
@media print{body{padding:0}.no-print{display:none}}
</style></head><body>${document.getElementById("portaria-document")?.innerHTML || ""}</body></html>`;
                  const blob = new Blob([html], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `Portaria_${previewData.numero_portaria}_${previewData.ano}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Documento exportado!");
                }} className="gap-2">
                  <FileDown className="h-4 w-4" /> Exportar HTML
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
        title="Excluir Portaria"
        description="Tem certeza que deseja excluir esta portaria? Esta ação não pode ser desfeita."
        onConfirm={() => deleteConfirmId && deleteAfastamento(deleteConfirmId)}
      />

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> {historyTitle}
            </DialogTitle>
            <DialogDescription>
              Versões anteriores do documento. Clique em uma versão para visualizar.
            </DialogDescription>
          </DialogHeader>
          {historyVersions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma versão anterior registrada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyVersions.map((v, i) => (
                <div key={v.id} className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">v{historyVersions.length - i}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(v.data), "dd/MM/yyyy 'às' HH:mm")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Autor: {v.autor}</p>
                  <p className="text-xs text-muted-foreground">{v.alteracoes}</p>
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-primary hover:underline">Ver documento</summary>
                    <pre className="text-xs font-mono bg-muted p-3 rounded-lg mt-2 whitespace-pre-wrap border border-border max-h-40 overflow-y-auto">{v.documento}</pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LinkedTables({ afastamentoId, investigacoes, inqueritos, advertencias, canEdit, canDelete, onReload }: {
  afastamentoId: string;
  investigacoes: InvestigacaoPolicial[];
  inqueritos: InqueritoPolicial[];
  advertencias: Advertencia[];
  canEdit: boolean;
  canDelete: boolean;
  onReload: () => void;
}) {
  const [invDialogOpen, setInvDialogOpen] = useState(false);
  const [inqDialogOpen, setInqDialogOpen] = useState(false);
  const [advDialogOpen, setAdvDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [invForm, setInvForm] = useState({ numero_investigacao: "", data_instauracao: format(new Date(), "yyyy-MM-dd"), encarregado: "", descricao_fatos: "", provas_anexadas: "", testemunhas: "" });
  const [inqForm, setInqForm] = useState({ numero_inquerito: "", data_instauracao: format(new Date(), "yyyy-MM-dd"), autoridade_responsavel: "", relatorio: "", parecer: "", resultado: "" });
  const [advForm, setAdvForm] = useState({ descricao: "", data_advertencia: format(new Date(), "yyyy-MM-dd"), autoridade_responsavel: "" });

  const createInvestigacao = async (e: React.FormEvent) => {
    e.preventDefault(); if (!canEdit) return;
    setSubmitting(true);
    const { error } = await supabase.from("investigacoes_policial").insert({ ...invForm, afastamento_id: afastamentoId, status: "em_andamento" });
    if (error) toast.error("Erro: " + error.message); else { toast.success("Investigação registrada!"); setInvDialogOpen(false); setInvForm({ numero_investigacao: "", data_instauracao: format(new Date(), "yyyy-MM-dd"), encarregado: "", descricao_fatos: "", provas_anexadas: "", testemunhas: "" }); onReload(); }
    setSubmitting(false);
  };

  const createInquerito = async (e: React.FormEvent) => {
    e.preventDefault(); if (!canEdit) return;
    setSubmitting(true);
    const { error } = await supabase.from("inqueritos_policial").insert({ ...inqForm, afastamento_id: afastamentoId, status: "em_andamento" });
    if (error) toast.error("Erro: " + error.message); else { toast.success("Inquérito registrado!"); setInqDialogOpen(false); setInqForm({ numero_inquerito: "", data_instauracao: format(new Date(), "yyyy-MM-dd"), autoridade_responsavel: "", relatorio: "", parecer: "", resultado: "" }); onReload(); }
    setSubmitting(false);
  };

  const createAdvertencia = async (e: React.FormEvent) => {
    e.preventDefault(); if (!canEdit) return;
    setSubmitting(true);
    const { error } = await supabase.from("advertencias").insert({ ...advForm, afastamento_id: afastamentoId });
    if (error) toast.error("Erro: " + error.message); else { toast.success("Advertência registrada!"); setAdvDialogOpen(false); setAdvForm({ descricao: "", data_advertencia: format(new Date(), "yyyy-MM-dd"), autoridade_responsavel: "" }); onReload(); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Search className="h-3 w-3" /> Investigações ({investigacoes.length})</h5>
            {canEdit && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setInvDialogOpen(true)}><Plus className="h-3 w-3" /></Button>}
          </div>
          {investigacoes.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma investigação vinculada.</p> : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {investigacoes.map(i => (
                <div key={i.id} className="text-xs p-1.5 bg-muted/30 rounded flex items-center justify-between">
                  <span>{i.numero_investigacao} - <Badge variant="outline" className="text-[10px] px-1 py-0">{INVESTIGACAO_POLICIAL_STATUS_LABEL[i.status]}</Badge></span>
                  {canDelete && <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={async () => { await supabase.from("investigacoes_policial").delete().eq("id", i.id); onReload(); }}><Trash2 className="h-3 w-3" /></Button>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Gavel className="h-3 w-3" /> Inquéritos ({inqueritos.length})</h5>
            {canEdit && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setInqDialogOpen(true)}><Plus className="h-3 w-3" /></Button>}
          </div>
          {inqueritos.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum inquérito vinculado.</p> : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {inqueritos.map(i => (
                <div key={i.id} className="text-xs p-1.5 bg-muted/30 rounded flex items-center justify-between">
                  <span>{i.numero_inquerito} - <Badge variant="outline" className="text-[10px] px-1 py-0">{INQUERITO_POLICIAL_STATUS_LABEL[i.status]}</Badge></span>
                  {canDelete && <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={async () => { await supabase.from("inqueritos_policial").delete().eq("id", i.id); onReload(); }}><Trash2 className="h-3 w-3" /></Button>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Advertências ({advertencias.length})</h5>
            {canEdit && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAdvDialogOpen(true)}><Plus className="h-3 w-3" /></Button>}
          </div>
          {advertencias.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma advertência registrada.</p> : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {advertencias.map(a => (
                <div key={a.id} className="text-xs p-1.5 bg-muted/30 rounded flex items-center justify-between">
                  <span className="truncate">{a.descricao}</span>
                  {canDelete && <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive shrink-0" onClick={async () => { await supabase.from("advertencias").delete().eq("id", a.id); onReload(); }}><Trash2 className="h-3 w-3" /></Button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={invDialogOpen} onOpenChange={setInvDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Investigação</DialogTitle></DialogHeader>
          <form onSubmit={createInvestigacao} className="space-y-3">
            <div><Label className="text-xs">Nº Investigação</Label><Input value={invForm.numero_investigacao} onChange={e => setInvForm(f => ({...f, numero_investigacao: e.target.value}))} required /></div>
            <div><Label className="text-xs">Data</Label><Input type="date" value={invForm.data_instauracao} onChange={e => setInvForm(f => ({...f, data_instauracao: e.target.value}))} required /></div>
            <div><Label className="text-xs">Encarregado</Label><Input value={invForm.encarregado} onChange={e => setInvForm(f => ({...f, encarregado: e.target.value}))} required /></div>
            <div><Label className="text-xs">Descrição dos Fatos</Label><Textarea value={invForm.descricao_fatos} onChange={e => setInvForm(f => ({...f, descricao_fatos: e.target.value}))} required /></div>
            <Button type="submit" disabled={submitting} className="w-full">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={inqDialogOpen} onOpenChange={setInqDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Inquérito</DialogTitle></DialogHeader>
          <form onSubmit={createInquerito} className="space-y-3">
            <div><Label className="text-xs">Nº Inquérito</Label><Input value={inqForm.numero_inquerito} onChange={e => setInqForm(f => ({...f, numero_inquerito: e.target.value}))} required /></div>
            <div><Label className="text-xs">Data</Label><Input type="date" value={inqForm.data_instauracao} onChange={e => setInqForm(f => ({...f, data_instauracao: e.target.value}))} required /></div>
            <div><Label className="text-xs">Autoridade Responsável</Label><Input value={inqForm.autoridade_responsavel} onChange={e => setInqForm(f => ({...f, autoridade_responsavel: e.target.value}))} required /></div>
            <Button type="submit" disabled={submitting} className="w-full">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={advDialogOpen} onOpenChange={setAdvDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Advertência</DialogTitle></DialogHeader>
          <form onSubmit={createAdvertencia} className="space-y-3">
            <div><Label className="text-xs">Descrição</Label><Textarea value={advForm.descricao} onChange={e => setAdvForm(f => ({...f, descricao: e.target.value}))} required /></div>
            <div><Label className="text-xs">Data</Label><Input type="date" value={advForm.data_advertencia} onChange={e => setAdvForm(f => ({...f, data_advertencia: e.target.value}))} required /></div>
            <div><Label className="text-xs">Autoridade</Label><Input value={advForm.autoridade_responsavel} onChange={e => setAdvForm(f => ({...f, autoridade_responsavel: e.target.value}))} required /></div>
            <Button type="submit" disabled={submitting} className="w-full">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
