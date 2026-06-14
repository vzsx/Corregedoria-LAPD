import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Shield, FileText, Loader2, Plus, LayoutDashboard, Users, Trash2, Edit,
  Printer, Search, X, FileSignature, Activity, ClipboardList, Eye,
  ChevronDown, ChevronRight, AlertTriangle, UserCheck, ScrollText,
  BookOpen, Ban, Clock, Gavel, Copy, History, FileDown, Link2, Unlink,
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
  InvestigacaoPolicial, InqueritoPolicial,
  Advertencia, VersaoDocumento,
} from "@/lib/corregedoria/types";
import { generatePortariaText, printPortaria } from "@/lib/corregedoria/portaria";
import type { PortariaData } from "@/lib/corregedoria/portaria";
import { PortariaPreview } from "@/components/corregedoria/PortariaPreview";

type AfastamentoSubTab = "dashboard" | "listagem" | "historico";

interface PortariaFormData {
  numero_portaria: string;
  data_emissao: string;
  posto_graduacao: string;
  nome_policial: string;
  rg_pm: string;
  unidade: string;
  data_inicio: string;
  data_termino: string;
  observacoes: string;
  inquerito_id: string;
  responsavel_nome: string;
  responsavel_posto: string;
  responsavel_assinatura: string;
  status: AfastamentoStatus;
}

const MOTIVO_PADRAO = "Art. 4º O afastamento de que trata esta Portaria possui caráter meramente cautelar e não punitivo, podendo ser revisto ou revogado a qualquer tempo, conforme o andamento do procedimento apuratório.";

function toPortariaData(form: PortariaFormData, inqueritoNumero?: string): PortariaData {
  return {
    numero_portaria: form.numero_portaria,
    data_emissao: form.data_emissao,
    posto_graduacao: form.posto_graduacao,
    nome_policial: form.nome_policial,
    rg_pm: form.rg_pm,
    unidade: form.unidade,
    data_inicio: form.data_inicio,
    data_termino: form.data_termino,
    inquerito_numero: inqueritoNumero || "",
    responsavel_nome: form.responsavel_nome,
    responsavel_posto: form.responsavel_posto,
  };
}

const defaultForm: PortariaFormData = {
  numero_portaria: "",
  data_emissao: format(new Date(), "yyyy-MM-dd"),
  posto_graduacao: "",
  nome_policial: "",
  rg_pm: "",
  unidade: "",
  data_inicio: format(new Date(), "yyyy-MM-dd"),
  data_termino: format(new Date(), "yyyy-MM-dd"),
  observacoes: "",
  inquerito_id: "",
  responsavel_nome: "",
  responsavel_posto: "",
  responsavel_assinatura: "",
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
  const [inqueritoSearch, setInqueritoSearch] = useState("");

  const [afastamentoForm, setAfastamentoForm] = useState<PortariaFormData>(defaultForm);
  const [afastamentoDialogOpen, setAfastamentoDialogOpen] = useState(false);
  const [afastamentoEditDialogOpen, setAfastamentoEditDialogOpen] = useState(false);
  const [editingAfastamentoId, setEditingAfastamentoId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PortariaData | null>(null);
  const [previewInquerito, setPreviewInquerito] = useState("");
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyVersions, setHistoryVersions] = useState<VersaoDocumento[]>([]);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historicoSearch, setHistoricoSearch] = useState("");

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

  const getInquerito = (id: string | null) => inqueritos.find(i => i.id === id);

  const stats = {
    ativos: afastamentos.filter(a => a.status === "ativo").length,
    concluidos: afastamentos.filter(a => a.status === "concluido").length,
    arquivados: afastamentos.filter(a => a.status === "arquivado").length,
  };

  const filteredAfastamentos = afastamentos.filter(a => {
    const inq = a.inquerito_id ? getInquerito(a.inquerito_id) : null;
    const matchesSearch = !searchTerm ||
      a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.rg_pm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.numero_portaria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inq?.numero_inquerito || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "todos" || a.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getInvestigacoes = (afastamentoId: string) => investigacoes.filter(i => i.afastamento_id === afastamentoId);
  const getInqueritosForAfastamento = (afastamentoId: string) => inqueritos.filter(i => i.afastamento_id === afastamentoId);
  const getAdvertencias = (afastamentoId: string) => advertencias.filter(a => a.afastamento_id === afastamentoId);

  const resetForm = () => {
    setAfastamentoForm({
      ...defaultForm,
      data_emissao: format(new Date(), "yyyy-MM-dd"),
      data_inicio: format(new Date(), "yyyy-MM-dd"),
      data_termino: format(new Date(), "yyyy-MM-dd"),
      responsavel_nome: user?.user_metadata?.full_name || "",
      responsavel_posto: "",
    });
    setInqueritoSearch("");
  };

  const formToDb = (form: PortariaFormData) => {
    const inq = form.inquerito_id ? getInquerito(form.inquerito_id) : null;
    const docText = generatePortariaText(toPortariaData(form, inq?.numero_inquerito));
    return {
      numero_portaria: form.numero_portaria,
      data_emissao: form.data_emissao,
      posto_graduacao: form.posto_graduacao,
      nome_completo: form.nome_policial,
      rg_pm: form.rg_pm,
      unidade: form.unidade,
      data_inicio: form.data_inicio,
      data_termino: form.data_termino,
      observacoes: form.observacoes || null,
      inquerito_id: form.inquerito_id || null,
      responsavel_nome: form.responsavel_nome,
      responsavel_posto: form.responsavel_posto,
      responsavel_assinatura: form.responsavel_assinatura || null,
      motivo_afastamento: MOTIVO_PADRAO,
      status: form.status,
      autor_id: user?.id || null,
      autor_nome: user?.user_metadata?.full_name || form.responsavel_nome,
    };
  };

  const statusHistoryEntry = (oldStatus: string, newStatus: string) => ({
    tipo: "status",
    data: new Date().toISOString(),
    autor: user?.user_metadata?.full_name || "Sistema",
    de: oldStatus,
    para: newStatus,
  });

  const getInqueritoNumero = (id: string | null) => {
    if (!id) return "";
    const inq = getInquerito(id);
    return inq?.numero_inquerito || "";
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
    const changes: string[] = [];
    if (existing?.status !== afastamentoForm.status) {
      versoes.unshift(statusHistoryEntry(existing?.status || "", afastamentoForm.status));
      changes.push(`Status alterado: ${AFASTAMENTO_STATUS_LABEL[existing?.status || "ativo"]} → ${AFASTAMENTO_STATUS_LABEL[afastamentoForm.status]}`);
    }
    if (existing?.inquerito_id !== afastamentoForm.inquerito_id) {
      const oldInq = existing?.inquerito_id ? getInquerito(existing.inquerito_id)?.numero_inquerito : "nenhum";
      const newInq = afastamentoForm.inquerito_id ? getInquerito(afastamentoForm.inquerito_id)?.numero_inquerito : "nenhum";
      changes.push(`Inquérito: ${oldInq} → ${newInq}`);
    }
    const novaVersao: VersaoDocumento = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      data: new Date().toISOString(),
      autor: user?.user_metadata?.full_name || afastamentoForm.responsavel_nome,
      documento: existing?.motivo_afastamento || "",
      alteracoes: changes.join("; ") || "Atualização do documento",
    };
    versoes.unshift(novaVersao);
    updateData.historico_versoes = versoes;
    delete (updateData as any).autor_id;
    delete (updateData as any).autor_nome;
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
    const existing = afastamentos.find(a => a.id === id);
    let versoes: VersaoDocumento[] = [];
    if (existing?.historico_versoes) {
      try {
        versoes = typeof existing.historico_versoes === "string"
          ? JSON.parse(existing.historico_versoes)
          : existing.historico_versoes;
      } catch { versoes = []; }
    }
    versoes.unshift(statusHistoryEntry(existing?.status || "", status));
    const { error } = await supabase
      .from("afastamentos")
      .update({ status, historico_versoes: versoes })
      .eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
    else { toast.success("Status atualizado!"); await loadAfastamentos(); }
  };

  const duplicateAfastamento = async (a: Afastamento) => {
    if (!canCreate) return;
    const inq = a.inquerito_id ? getInquerito(a.inquerito_id) : null;
    const docText = generatePortariaText({
      numero_portaria: a.numero_portaria + "-copia",
      data_emissao: format(new Date(), "yyyy-MM-dd"),
      posto_graduacao: a.posto_graduacao,
      nome_policial: a.nome_completo,
      rg_pm: a.rg_pm,
      unidade: a.unidade,
      data_inicio: format(new Date(), "yyyy-MM-dd"),
      data_termino: format(new Date(), "yyyy-MM-dd"),
      inquerito_numero: inq?.numero_inquerito || "",
      responsavel_nome: a.responsavel_nome,
      responsavel_posto: a.responsavel_posto,
    });
    const { error } = await supabase.from("afastamentos").insert({
      numero_portaria: a.numero_portaria + "-copia",
      data_emissao: format(new Date(), "yyyy-MM-dd"),
      posto_graduacao: a.posto_graduacao,
      nome_completo: a.nome_completo,
      rg_pm: a.rg_pm,
      unidade: a.unidade,
      data_inicio: format(new Date(), "yyyy-MM-dd"),
      data_termino: format(new Date(), "yyyy-MM-dd"),
      inquerito_id: a.inquerito_id,
      responsavel_nome: a.responsavel_nome,
      responsavel_posto: a.responsavel_posto,
      motivo_afastamento: MOTIVO_PADRAO,
      status: a.status,
      autor_id: user?.id || null,
      autor_nome: user?.user_metadata?.full_name || a.responsavel_nome,
    });
    if (error) toast.error("Erro ao duplicar: " + error.message);
    else { toast.success("Documento duplicado!"); await loadAfastamentos(); }
  };

  const openPreview = (form: PortariaFormData) => {
    const inq = form.inquerito_id ? getInquerito(form.inquerito_id) : null;
    setPreviewData(toPortariaData(form, inq?.numero_inquerito));
    setPreviewInquerito(inq?.numero_inquerito || "");
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
    setHistoryTitle(`Histórico - Portaria nº ${a.numero_portaria}`);
    setHistoryDialogOpen(true);
  };

  const editAfastamento = async (a: Afastamento) => {
    setAfastamentoForm({
      numero_portaria: a.numero_portaria,
      data_emissao: a.data_emissao,
      posto_graduacao: a.posto_graduacao,
      nome_policial: a.nome_completo,
      rg_pm: a.rg_pm,
      unidade: a.unidade,
      data_inicio: a.data_inicio,
      data_termino: a.data_termino,
      observacoes: a.observacoes || "",
      inquerito_id: a.inquerito_id || "",
      responsavel_nome: a.responsavel_nome,
      responsavel_posto: a.responsavel_posto,
      responsavel_assinatura: a.responsavel_assinatura || "",
      status: a.status,
    });
    setEditingAfastamentoId(a.id);
    setAfastamentoEditDialogOpen(true);
  };

  const filteredInqueritos = inqueritos.filter(i =>
    !inqueritoSearch || i.numero_inquerito.toLowerCase().includes(inqueritoSearch.toLowerCase())
  );

  const renderFormFields = (isEdit: boolean) => (
    <div className="space-y-6">
      {/* Seção 1: Dados do Policial Afastado */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="h-4 w-4" /> DADOS DO POLICIAL AFASTADO
          </h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-semibold">Número da Portaria *</Label>
            <Input value={afastamentoForm.numero_portaria} onChange={e => setAfastamentoForm(f => ({ ...f, numero_portaria: e.target.value }))} placeholder="Ex: 001" required />
          </div>
          <div>
            <Label className="text-xs font-semibold">Data de Emissão da Portaria *</Label>
            <Input type="date" value={afastamentoForm.data_emissao} onChange={e => setAfastamentoForm(f => ({ ...f, data_emissao: e.target.value }))} required />
          </div>
          <div>
            <Label className="text-xs font-semibold">Posto/Graduação *</Label>
            <Input value={afastamentoForm.posto_graduacao} onChange={e => setAfastamentoForm(f => ({ ...f, posto_graduacao: e.target.value }))} placeholder="Ex: 1º SGT PM" required />
          </div>
          <div>
            <Label className="text-xs font-semibold">Nome Completo *</Label>
            <Input value={afastamentoForm.nome_policial} onChange={e => setAfastamentoForm(f => ({ ...f, nome_policial: e.target.value }))} placeholder="Nome completo do policial" required />
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
            <Label className="text-xs font-semibold">Data de Início do Afastamento *</Label>
            <Input type="date" value={afastamentoForm.data_inicio} onChange={e => setAfastamentoForm(f => ({ ...f, data_inicio: e.target.value }))} required />
          </div>
          <div>
            <Label className="text-xs font-semibold">Data de Término do Afastamento *</Label>
            <Input type="date" value={afastamentoForm.data_termino} onChange={e => setAfastamentoForm(f => ({ ...f, data_termino: e.target.value }))} required />
          </div>
          <div className="md:col-span-2 lg:col-span-1">
            <Label className="text-xs font-semibold">Observações</Label>
            <Textarea value={afastamentoForm.observacoes} onChange={e => setAfastamentoForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Observações (opcional)" className="min-h-[80px]" />
          </div>
        </div>
      </div>

      {/* Seção: Dados do Inquérito Vinculado */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <Link2 className="h-4 w-4" /> DADOS DO INQUÉRITO VINCULADO
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {afastamentoForm.inquerito_id && (
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{getInquerito(afastamentoForm.inquerito_id)?.numero_inquerito}</p>
                  <p className="text-xs text-muted-foreground">{getInquerito(afastamentoForm.inquerito_id)?.autoridade_responsavel}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAfastamentoForm(f => ({ ...f, inquerito_id: "" }))} className="gap-1 text-destructive">
                <Unlink className="h-4 w-4" /> Desvincular
              </Button>
            </div>
          )}
          {!afastamentoForm.inquerito_id && (
            <div>
              <Label className="text-xs font-semibold mb-1 block">Buscar Inquérito</Label>
              <Input
                placeholder="Digite o número do inquérito para buscar..."
                value={inqueritoSearch}
                onChange={e => setInqueritoSearch(e.target.value)}
              />
              {inqueritoSearch && (
                <div className="mt-2 border border-border rounded-lg max-h-48 overflow-y-auto">
                  {filteredInqueritos.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">Nenhum inquérito encontrado</div>
                  ) : (
                    filteredInqueritos.map(inq => (
                      <button
                        key={inq.id}
                        type="button"
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors text-sm flex items-center justify-between border-b border-border last:border-0"
                        onClick={() => { setAfastamentoForm(f => ({ ...f, inquerito_id: inq.id })); setInqueritoSearch(""); }}
                      >
                        <div>
                          <span className="font-medium">{inq.numero_inquerito}</span>
                          <span className="text-muted-foreground ml-2">- {inq.autoridade_responsavel}</span>
                        </div>
                        <Badge variant="outline" className={INQUERITO_POLICIAL_STATUS_COLOR[inq.status]}>
                          {INQUERITO_POLICIAL_STATUS_LABEL[inq.status]}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
              {inqueritos.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">Nenhum inquérito cadastrado no sistema.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Seção 2: Dados da Autoridade Responsável */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <FileSignature className="h-4 w-4" /> DADOS DA AUTORIDADE RESPONSÁVEL
          </h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-semibold">Nome do Corregedor *</Label>
            <Input value={afastamentoForm.responsavel_nome} onChange={e => setAfastamentoForm(f => ({ ...f, responsavel_nome: e.target.value }))} placeholder="Nome do Corregedor" required />
          </div>
          <div>
            <Label className="text-xs font-semibold">Posto/Graduação do Corregedor *</Label>
            <Input value={afastamentoForm.responsavel_posto} onChange={e => setAfastamentoForm(f => ({ ...f, responsavel_posto: e.target.value }))} placeholder="Ex: Cel PM" required />
          </div>
          <div>
            <Label className="text-xs font-semibold">Assinatura Digital</Label>
            <Input value={afastamentoForm.responsavel_assinatura} onChange={e => setAfastamentoForm(f => ({ ...f, responsavel_assinatura: e.target.value }))} placeholder="Link ou código (opcional)" />
          </div>
        </div>
      </div>

      {/* Seção: Controle do Afastamento */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4" /> CONTROLE DO AFASTAMENTO
          </h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold">Status do Afastamento *</Label>
            <Select value={afastamentoForm.status} onValueChange={v => setAfastamentoForm(f => ({ ...f, status: v as AfastamentoStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
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
      </div>

      {/* Motivo automático (não editável) */}
      <div className="bg-muted/20 border border-border rounded-lg p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">TEXTO CAUTELAR PADRÃO (Art. 4º)</p>
        <p className="text-sm text-muted-foreground italic leading-relaxed">{MOTIVO_PADRAO}</p>
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
          <StatCard title="Ativos" value={stats.ativos} icon={Shield} color="bg-amber-500/10 text-amber-600 border-amber-500/20" />
          <StatCard title="Concluídos" value={stats.concluidos} icon={Ban} color="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" />
          <StatCard title="Arquivados" value={stats.arquivados} icon={FileText} color="bg-gray-500/10 text-gray-600 border-gray-500/20" />
          <StatCard title="Total" value={afastamentos.length} icon={ClipboardList} color="bg-primary/10 text-primary border-primary/20" />
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h4 className="font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Distribuição por Status
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(["ativo", "concluido", "arquivado"] as const).map(s => {
              const count = s === "ativo" ? stats.ativos : s === "concluido" ? stats.concluidos : stats.arquivados;
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
              {recentAfastamentos.map(a => {
                const inq = a.inquerito_id ? getInquerito(a.inquerito_id) : null;
                return (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={AFASTAMENTO_STATUS_COLOR[a.status]}>
                        {AFASTAMENTO_STATUS_LABEL[a.status]}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{a.posto_graduacao} {a.nome_completo}</p>
                        <p className="text-xs text-muted-foreground">Portaria nº {a.numero_portaria} • {a.unidade}{inq ? ` • Inq: ${inq.numero_inquerito}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd/MM/yyyy")}</div>
                  </div>
                );
              })}
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
              <Input placeholder="Buscar por nome, RG, unidade, portaria ou inquérito..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              {searchTerm && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer text-muted-foreground" onClick={() => setSearchTerm("")} />}
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                {(["ativo", "concluido", "arquivado"] as const).map(s => (
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
              const inq = a.inquerito_id ? getInquerito(a.inquerito_id) : null;
              return (
                <div key={a.id} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="p-4 flex items-start justify-between cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={AFASTAMENTO_STATUS_COLOR[a.status]}>{AFASTAMENTO_STATUS_LABEL[a.status]}</Badge>
                        <span className="text-xs font-mono text-muted-foreground">Portaria nº {a.numero_portaria}</span>
                        {inq && <Badge variant="secondary" className="text-[10px] px-1 py-0">Inq: {inq.numero_inquerito}</Badge>}
                      </div>
                      <p className="font-semibold text-sm truncate">{a.posto_graduacao} {a.nome_completo}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span>RG PM: {a.rg_pm}</span>
                        <span>{a.unidade}</span>
                        <span>Período: {format(new Date(a.data_inicio), "dd/MM/yy")} a {format(new Date(a.data_termino), "dd/MM/yy")}</span>
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
                        setPreviewData(toPortariaData({
                          numero_portaria: a.numero_portaria,
                          data_emissao: a.data_emissao,
                          posto_graduacao: a.posto_graduacao,
                          nome_policial: a.nome_completo,
                          rg_pm: a.rg_pm,
                          unidade: a.unidade,
                          data_inicio: a.data_inicio,
                          data_termino: a.data_termino,
                          observacoes: a.observacoes || "",
                          inquerito_id: a.inquerito_id || "",
                          responsavel_nome: a.responsavel_nome,
                          responsavel_posto: a.responsavel_posto,
                          responsavel_assinatura: a.responsavel_assinatura || "",
                          status: a.status,
                        }, inq?.numero_inquerito));
                        setPreviewInquerito(inq?.numero_inquerito || "");
                        setPreviewOpen(true);
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Histórico" onClick={e => { e.stopPropagation(); openHistory(a); }}>
                        <History className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Imprimir" onClick={e => {
                        e.stopPropagation();
                        printPortaria(toPortariaData({
                          numero_portaria: a.numero_portaria,
                          data_emissao: a.data_emissao,
                          posto_graduacao: a.posto_graduacao,
                          nome_policial: a.nome_completo,
                          rg_pm: a.rg_pm,
                          unidade: a.unidade,
                          data_inicio: a.data_inicio,
                          data_termino: a.data_termino,
                          observacoes: a.observacoes || "",
                          inquerito_id: a.inquerito_id || "",
                          responsavel_nome: a.responsavel_nome,
                          responsavel_posto: a.responsavel_posto,
                          responsavel_assinatura: a.responsavel_assinatura || "",
                          status: a.status,
                        }, inq?.numero_inquerito), inq?.numero_inquerito);
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
                        <Field label="Portaria"><span className="text-sm font-medium">{a.numero_portaria}</span></Field>
                        <Field label="Início"><span className="text-sm font-medium">{format(new Date(a.data_inicio), "dd/MM/yyyy")}</span></Field>
                        <Field label="Término"><span className="text-sm font-medium">{format(new Date(a.data_termino), "dd/MM/yyyy")}</span></Field>
                        <Field label="Responsável"><span className="text-sm font-medium">{a.responsavel_nome}</span></Field>
                      </div>
                      {inq && (
                        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                          <Link2 className="h-4 w-4 text-primary" />
                          <div className="text-sm">
                            <span className="font-medium">Inquérito Vinculado:</span> {inq.numero_inquerito}
                            <span className="text-muted-foreground ml-2">- {inq.autoridade_responsavel}</span>
                            <Badge variant="outline" className={`ml-2 ${INQUERITO_POLICIAL_STATUS_COLOR[inq.status]}`}>{INQUERITO_POLICIAL_STATUS_LABEL[inq.status]}</Badge>
                          </div>
                        </div>
                      )}

                      <LinkedTables
                        afastamentoId={a.id}
                        investigacoes={getInvestigacoes(a.id)}
                        inqueritos={getInqueritosForAfastamento(a.id)}
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
                    {registros.map(r => {
                      const inq = r.inquerito_id ? getInquerito(r.inquerito_id) : null;
                      return (
                        <div key={r.id} className="p-4 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className={AFASTAMENTO_STATUS_COLOR[r.status]}>{AFASTAMENTO_STATUS_LABEL[r.status]}</Badge>
                            <span className="text-xs text-muted-foreground">Portaria nº {r.numero_portaria}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Período: {format(new Date(r.data_inicio), "dd/MM/yyyy")} a {format(new Date(r.data_termino), "dd/MM/yyyy")}</p>
                          {inq && <p className="text-sm text-muted-foreground">Inquérito vinculado: {inq.numero_inquerito}</p>}
                          <p className="text-sm text-muted-foreground">Responsável: {r.responsavel_nome}</p>
                          <div className="flex gap-2 mt-2">
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                              setPreviewData(toPortariaData({
                                numero_portaria: r.numero_portaria,
                                data_emissao: r.data_emissao,
                                posto_graduacao: r.posto_graduacao,
                                nome_policial: r.nome_completo,
                                rg_pm: r.rg_pm,
                                unidade: r.unidade,
                                data_inicio: r.data_inicio,
                                data_termino: r.data_termino,
                                observacoes: r.observacoes || "",
                                inquerito_id: r.inquerito_id || "",
                                responsavel_nome: r.responsavel_nome,
                                responsavel_posto: r.responsavel_posto,
                                responsavel_assinatura: r.responsavel_assinatura || "",
                                status: r.status,
                              }, inq?.numero_inquerito));
                              setPreviewInquerito(inq?.numero_inquerito || "");
                              setPreviewOpen(true);
                            }}>
                              <Eye className="h-3 w-3" /> Documento
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Criado em {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm")} por {r.autor_nome || r.responsavel_nome}
                          </p>
                        </div>
                      );
                    })}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              Documento oficial gerado. Use os botões abaixo para imprimir ou exportar.
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <PortariaPreview data={previewData} inqueritoNumero={previewInquerito} />
              <div className="flex justify-end gap-2 pt-2 border-t border-border no-print">
                <Button variant="outline" onClick={() => { if (previewData) printPortaria(previewData, previewInquerito); }} className="gap-2">
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
                <Button variant="outline" onClick={() => {
                  if (!previewData) return;
                  const el = document.getElementById("portaria-document");
                  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Portaria nº ${previewData.numero_portaria}</title>
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
.info-box{border:1px solid #999;padding:12px 16px;margin-bottom:20px;font-size:10pt;background:#f9f9f9}
.info-box table{width:100%;border-collapse:collapse}
.info-box td{padding:3px 8px}
.info-box td:first-child{font-weight:bold;width:180px}
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
</style></head><body>${el?.innerHTML || ""}</body></html>`;
                  const blob = new Blob([html], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `Portaria_${previewData.numero_portaria}.html`;
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
              Registro de alterações do documento.
            </DialogDescription>
          </DialogHeader>
          {historyVersions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma alteração registrada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyVersions.map((v, i) => (
                <div key={v.id} className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{v.tipo === "status" ? "Status" : `v${historyVersions.length - i}`}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(v.data), "dd/MM/yyyy 'às' HH:mm")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Autor: {v.autor}</p>
                  <p className="text-xs text-muted-foreground">{v.alteracoes}</p>
                  {v.tipo !== "status" && v.documento && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-primary hover:underline">Ver documento</summary>
                      <pre className="text-xs font-mono bg-muted p-3 rounded-lg mt-2 whitespace-pre-wrap border border-border max-h-40 overflow-y-auto">{v.documento}</pre>
                    </details>
                  )}
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
