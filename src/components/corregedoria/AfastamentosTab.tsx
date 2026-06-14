import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Shield, FileText, Loader2, Plus, LayoutDashboard, Users, Trash2, Edit,
  Printer, Search, X, FileSignature, Activity, ClipboardList, Eye,
  ChevronDown, ChevronRight, AlertTriangle, UserCheck, ScrollText,
  BookOpen, Ban, Clock, Gavel, Download
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
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
  Advertencia,
} from "@/lib/corregedoria/types";

type AfastamentoSubTab = "dashboard" | "listagem" | "historico";

interface AfastamentosTabProps {
}

export function AfastamentosTab(_props: AfastamentosTabProps) {
  const { user, isAdmin, roles } = useAuth();
  const currentRole = roles[0] || "consulta";

  // --- Role-based permissions ---
  const canDelete = currentRole === "corregedor_geral" || currentRole === "subcorregedor" || isAdmin;
  const canEdit = currentRole !== "consulta";
  const canCreate = currentRole !== "consulta";
  const isInvestigador = currentRole === "investigador" || canEdit;
  const isConsulta = currentRole === "consulta";
  const canManageInvestigacoes = currentRole === "investigador" || currentRole === "corregedor" || currentRole === "subcorregedor" || currentRole === "corregedor_geral" || isAdmin;

  // --- Sub-tab state ---
  const [subTab, setSubTab] = useState<AfastamentoSubTab>("dashboard");

  // --- Data state ---
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);
  const [investigacoes, setInvestigacoes] = useState<InvestigacaoPolicial[]>([]);
  const [inqueritos, setInqueritos] = useState<InqueritoPolicial[]>([]);
  const [advertencias, setAdvertencias] = useState<Advertencia[]>([]);
  const [fetching, setFetching] = useState(true);

  // --- UI state ---
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<AfastamentoStatus | "todos">("todos");
  const [selectedPolicial, setSelectedPolicial] = useState<Afastamento | null>(null);

  // --- Afastamento form state ---
  const [afastamentoDialogOpen, setAfastamentoDialogOpen] = useState(false);
  const [afastamentoEditDialogOpen, setAfastamentoEditDialogOpen] = useState(false);
  const [editingAfastamentoId, setEditingAfastamentoId] = useState<string | null>(null);
  const [afastamentoForm, setAfastamentoForm] = useState({
    numero_portaria: "",
    data_portaria: format(new Date(), "yyyy-MM-dd"),
    posto_graduacao: "",
    nome_completo: "",
    rg_pm: "",
    unidade: "",
    funcao_cargo: "",
    motivo_afastamento: "",
    prazo_afastamento: "",
    responsavel_decisao: "",
    observacoes: "",
    status: "ativo" as AfastamentoStatus,
  });
  const [submitting, setSubmitting] = useState(false);

  // --- Investigação form state ---
  const [investigacaoDialogOpen, setInvestigacaoDialogOpen] = useState(false);
  const [investigacaoEditDialogOpen, setInvestigacaoEditDialogOpen] = useState(false);
  const [editingInvestigacaoId, setEditingInvestigacaoId] = useState<string | null>(null);
  const [investigacaoForm, setInvestigacaoForm] = useState({
    numero_investigacao: "",
    data_instauracao: format(new Date(), "yyyy-MM-dd"),
    encarregado: "",
    descricao_fatos: "",
    provas_anexadas: "",
    testemunhas: "",
    status: "em_andamento" as InvestigacaoPolicialStatus,
  });
  const [investigacaoAfastamentoId, setInvestigacaoAfastamentoId] = useState<string>("");

  // --- Inquérito form state ---
  const [inqueritoDialogOpen, setInqueritoDialogOpen] = useState(false);
  const [inqueritoEditDialogOpen, setInqueritoEditDialogOpen] = useState(false);
  const [editingInqueritoId, setEditingInqueritoId] = useState<string | null>(null);
  const [inqueritoForm, setInqueritoForm] = useState({
    numero_inquerito: "",
    data_instauracao: format(new Date(), "yyyy-MM-dd"),
    autoridade_responsavel: "",
    relatorio: "",
    parecer: "",
    resultado: "",
    status: "em_andamento" as InqueritoPolicialStatus,
  });
  const [inqueritoAfastamentoId, setInqueritoAfastamentoId] = useState<string>("");

  // --- Advertência form state ---
  const [advertenciaDialogOpen, setAdvertenciaDialogOpen] = useState(false);
  const [advertenciaForm, setAdvertenciaForm] = useState({
    descricao: "",
    data_advertencia: format(new Date(), "yyyy-MM-dd"),
    autoridade_responsavel: "",
  });
  const [advertenciaAfastamentoId, setAdvertenciaAfastamentoId] = useState<string>("");

  // --- Confirm dialog ---
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    loading?: boolean;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // --- Load data ---
  useEffect(() => {
    const load = async () => {
      setFetching(true);
      const [afastamentosRes, investigacoesRes, inqueritosRes, advertenciasRes] = await Promise.all([
        supabase.from("afastamentos").select("*").order("created_at", { ascending: false }),
        supabase.from("investigacoes_policial").select("*").order("created_at", { ascending: false }),
        supabase.from("inqueritos_policial").select("*").order("created_at", { ascending: false }),
        supabase.from("advertencias").select("*").order("created_at", { ascending: false }),
      ]);
      if (afastamentosRes.data) setAfastamentos(afastamentosRes.data as Afastamento[]);
      if (investigacoesRes.data) setInvestigacoes(investigacoesRes.data as InvestigacaoPolicial[]);
      if (inqueritosRes.data) setInqueritos(inqueritosRes.data as InqueritoPolicial[]);
      if (advertenciasRes.data) setAdvertencias(advertenciasRes.data as Advertencia[]);
      setFetching(false);
    };
    load();

    // Real-time subscriptions
    const afastamentosSub = supabase.channel("afastamentos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "afastamentos" }, (payload) => {
        if (payload.eventType === "INSERT") setAfastamentos(prev => prev.some(a => a.id === payload.new.id) ? prev : [payload.new as Afastamento, ...prev]);
        if (payload.eventType === "UPDATE") setAfastamentos(prev => prev.map(a => a.id === payload.new.id ? payload.new as Afastamento : a));
        if (payload.eventType === "DELETE") setAfastamentos(prev => prev.filter(a => a.id !== payload.old.id));
      })
      .subscribe();

    const investigacoesSub = supabase.channel("investigacoes-policial-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "investigacoes_policial" }, (payload) => {
        if (payload.eventType === "INSERT") setInvestigacoes(prev => prev.some(i => i.id === payload.new.id) ? prev : [payload.new as InvestigacaoPolicial, ...prev]);
        if (payload.eventType === "UPDATE") setInvestigacoes(prev => prev.map(i => i.id === payload.new.id ? payload.new as InvestigacaoPolicial : i));
        if (payload.eventType === "DELETE") setInvestigacoes(prev => prev.filter(i => i.id !== payload.old.id));
      })
      .subscribe();

    const inqueritosSub = supabase.channel("inqueritos-policial-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "inqueritos_policial" }, (payload) => {
        if (payload.eventType === "INSERT") setInqueritos(prev => prev.some(i => i.id === payload.new.id) ? prev : [payload.new as InqueritoPolicial, ...prev]);
        if (payload.eventType === "UPDATE") setInqueritos(prev => prev.map(i => i.id === payload.new.id ? payload.new as InqueritoPolicial : i));
        if (payload.eventType === "DELETE") setInqueritos(prev => prev.filter(i => i.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(afastamentosSub);
      supabase.removeChannel(investigacoesSub);
      supabase.removeChannel(inqueritosSub);
    };
  }, []);

  // --- Set default values from user ---
  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || "";
      if (!afastamentoForm.responsavel_decisao) {
        setAfastamentoForm(prev => ({ ...prev, responsavel_decisao: name }));
      }
    }
  }, [user]);

  // --- Computed stats ---
  const stats = {
    ativos: afastamentos.filter(a => a.status === "ativo").length,
    encerrados: afastamentos.filter(a => a.status === "encerrado").length,
    emInvestigacao: afastamentos.filter(a => a.status === "em_investigacao").length,
    emInquerito: afastamentos.filter(a => a.status === "em_inquerito").length,
  };

  // --- Filtered list ---
  const filteredAfastamentos = afastamentos.filter(a => {
    const matchesSearch = !searchTerm || 
      a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.rg_pm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.numero_portaria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "todos" || a.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // --- Helpers for linked data ---
  const getInvestigacoes = (afastamentoId: string) => investigacoes.filter(i => i.afastamento_id === afastamentoId);
  const getInqueritos = (afastamentoId: string) => inqueritos.filter(i => i.afastamento_id === afastamentoId);
  const getAdvertencias = (afastamentoId: string) => advertencias.filter(a => a.afastamento_id === afastamentoId);

  // --- CRUD: Afastamento ---
  const createAfastamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setSubmitting(true);
    const { error } = await supabase.from("afastamentos").insert({
      numero_portaria: afastamentoForm.numero_portaria,
      data_portaria: afastamentoForm.data_portaria,
      posto_graduacao: afastamentoForm.posto_graduacao,
      nome_completo: afastamentoForm.nome_completo,
      rg_pm: afastamentoForm.rg_pm,
      unidade: afastamentoForm.unidade,
      funcao_cargo: afastamentoForm.funcao_cargo || null,
      motivo_afastamento: afastamentoForm.motivo_afastamento,
      prazo_afastamento: afastamentoForm.prazo_afastamento,
      responsavel_decisao: afastamentoForm.responsavel_decisao,
      observacoes: afastamentoForm.observacoes || null,
      status: afastamentoForm.status,
    });
    if (error) {
      toast.error("Erro ao criar afastamento: " + error.message);
    } else {
      toast.success("Afastamento cadastrado com sucesso!");
      setAfastamentoDialogOpen(false);
      resetAfastamentoForm();
      logAudit("create", "afastamentos", { nome: afastamentoForm.nome_completo });
    }
    setSubmitting(false);
  };

  const updateAfastamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !editingAfastamentoId) return;
    setSubmitting(true);
    const { error } = await supabase.from("afastamentos").update({
      numero_portaria: afastamentoForm.numero_portaria,
      data_portaria: afastamentoForm.data_portaria,
      posto_graduacao: afastamentoForm.posto_graduacao,
      nome_completo: afastamentoForm.nome_completo,
      rg_pm: afastamentoForm.rg_pm,
      unidade: afastamentoForm.unidade,
      funcao_cargo: afastamentoForm.funcao_cargo || null,
      motivo_afastamento: afastamentoForm.motivo_afastamento,
      prazo_afastamento: afastamentoForm.prazo_afastamento,
      responsavel_decisao: afastamentoForm.responsavel_decisao,
      observacoes: afastamentoForm.observacoes || null,
      status: afastamentoForm.status,
    }).eq("id", editingAfastamentoId);
    if (error) {
      toast.error("Erro ao atualizar afastamento: " + error.message);
    } else {
      toast.success("Afastamento atualizado!");
      setAfastamentoEditDialogOpen(false);
      setEditingAfastamentoId(null);
      resetAfastamentoForm();
      logAudit("update", "afastamentos", { id: editingAfastamentoId });
    }
    setSubmitting(false);
  };

  const deleteAfastamento = async (id: string) => {
    if (!canDelete) {
      toast.error("Apenas Corregedor Geral e Subcorregedor podem excluir registros.");
      return;
    }
    const { error } = await supabase.from("afastamentos").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      toast.success("Afastamento excluído!");
      logAudit("delete", "afastamentos", { id });
    }
  };

  const updateAfastamentoStatus = async (id: string, status: AfastamentoStatus) => {
    const { error } = await supabase.from("afastamentos").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
    else toast.success("Status atualizado!");
  };

  const resetAfastamentoForm = () => {
    setAfastamentoForm({
      numero_portaria: "",
      data_portaria: format(new Date(), "yyyy-MM-dd"),
      posto_graduacao: "",
      nome_completo: "",
      rg_pm: "",
      unidade: "",
      funcao_cargo: "",
      motivo_afastamento: "",
      prazo_afastamento: "",
      responsavel_decisao: user?.user_metadata?.full_name || "",
      observacoes: "",
      status: "ativo" as AfastamentoStatus,
    });
  };

  const openEditAfastamento = (afastamento: Afastamento) => {
    setAfastamentoForm({
      numero_portaria: afastamento.numero_portaria,
      data_portaria: afastamento.data_portaria,
      posto_graduacao: afastamento.posto_graduacao,
      nome_completo: afastamento.nome_completo,
      rg_pm: afastamento.rg_pm,
      unidade: afastamento.unidade,
      funcao_cargo: afastamento.funcao_cargo || "",
      motivo_afastamento: afastamento.motivo_afastamento,
      prazo_afastamento: afastamento.prazo_afastamento,
      responsavel_decisao: afastamento.responsavel_decisao,
      observacoes: afastamento.observacoes || "",
      status: afastamento.status,
    });
    setEditingAfastamentoId(afastamento.id);
    setAfastamentoEditDialogOpen(true);
  };

  // --- CRUD: Investigação ---
  const createInvestigacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageInvestigacoes || !investigacaoAfastamentoId) return;
    setSubmitting(true);
    const { error } = await supabase.from("investigacoes_policial").insert({
      numero_investigacao: investigacaoForm.numero_investigacao,
      data_instauracao: investigacaoForm.data_instauracao,
      encarregado: investigacaoForm.encarregado,
      descricao_fatos: investigacaoForm.descricao_fatos,
      provas_anexadas: investigacaoForm.provas_anexadas || null,
      testemunhas: investigacaoForm.testemunhas || null,
      status: investigacaoForm.status,
      afastamento_id: investigacaoAfastamentoId,
    });
    if (error) {
      toast.error("Erro ao criar investigação: " + error.message);
    } else {
      toast.success("Investigação criada!");
      setInvestigacaoDialogOpen(false);
      resetInvestigacaoForm();
    }
    setSubmitting(false);
  };

  const updateInvestigacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageInvestigacoes || !editingInvestigacaoId) return;
    setSubmitting(true);
    const { error } = await supabase.from("investigacoes_policial").update({
      numero_investigacao: investigacaoForm.numero_investigacao,
      data_instauracao: investigacaoForm.data_instauracao,
      encarregado: investigacaoForm.encarregado,
      descricao_fatos: investigacaoForm.descricao_fatos,
      provas_anexadas: investigacaoForm.provas_anexadas || null,
      testemunhas: investigacaoForm.testemunhas || null,
      status: investigacaoForm.status,
    }).eq("id", editingInvestigacaoId);
    if (error) {
      toast.error("Erro ao atualizar investigação: " + error.message);
    } else {
      toast.success("Investigação atualizada!");
      setInvestigacaoEditDialogOpen(false);
      setEditingInvestigacaoId(null);
      resetInvestigacaoForm();
    }
    setSubmitting(false);
  };

  const deleteInvestigacao = async (id: string) => {
    if (!canDelete) {
      toast.error("Apenas Corregedor Geral e Subcorregedor podem excluir.");
      return;
    }
    await supabase.from("investigacoes_policial").delete().eq("id", id);
    toast.success("Investigação excluída!");
  };

  const resetInvestigacaoForm = () => {
    setInvestigacaoForm({
      numero_investigacao: "",
      data_instauracao: format(new Date(), "yyyy-MM-dd"),
      encarregado: "",
      descricao_fatos: "",
      provas_anexadas: "",
      testemunhas: "",
      status: "em_andamento" as InvestigacaoPolicialStatus,
    });
  };

  const openEditInvestigacao = (inv: InvestigacaoPolicial) => {
    setInvestigacaoForm({
      numero_investigacao: inv.numero_investigacao,
      data_instauracao: inv.data_instauracao,
      encarregado: inv.encarregado,
      descricao_fatos: inv.descricao_fatos,
      provas_anexadas: inv.provas_anexadas || "",
      testemunhas: inv.testemunhas || "",
      status: inv.status,
    });
    setEditingInvestigacaoId(inv.id);
    setInvestigacaoEditDialogOpen(true);
  };

  // --- CRUD: Inquérito ---
  const createInquerito = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !inqueritoAfastamentoId) return;
    setSubmitting(true);
    const { error } = await supabase.from("inqueritos_policial").insert({
      numero_inquerito: inqueritoForm.numero_inquerito,
      data_instauracao: inqueritoForm.data_instauracao,
      autoridade_responsavel: inqueritoForm.autoridade_responsavel,
      relatorio: inqueritoForm.relatorio || null,
      parecer: inqueritoForm.parecer || null,
      resultado: inqueritoForm.resultado || null,
      status: inqueritoForm.status,
      afastamento_id: inqueritoAfastamentoId,
    });
    if (error) {
      toast.error("Erro ao criar inquérito: " + error.message);
    } else {
      toast.success("Inquérito criado!");
      setInqueritoDialogOpen(false);
      resetInqueritoForm();
    }
    setSubmitting(false);
  };

  const updateInquerito = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !editingInqueritoId) return;
    setSubmitting(true);
    const { error } = await supabase.from("inqueritos_policial").update({
      numero_inquerito: inqueritoForm.numero_inquerito,
      data_instauracao: inqueritoForm.data_instauracao,
      autoridade_responsavel: inqueritoForm.autoridade_responsavel,
      relatorio: inqueritoForm.relatorio || null,
      parecer: inqueritoForm.parecer || null,
      resultado: inqueritoForm.resultado || null,
      status: inqueritoForm.status,
    }).eq("id", editingInqueritoId);
    if (error) {
      toast.error("Erro ao atualizar inquérito: " + error.message);
    } else {
      toast.success("Inquérito atualizado!");
      setInqueritoEditDialogOpen(false);
      setEditingInqueritoId(null);
      resetInqueritoForm();
    }
    setSubmitting(false);
  };

  const deleteInquerito = async (id: string) => {
    if (!canDelete) {
      toast.error("Apenas Corregedor Geral e Subcorregedor podem excluir.");
      return;
    }
    await supabase.from("inqueritos_policial").delete().eq("id", id);
    toast.success("Inquérito excluído!");
  };

  const resetInqueritoForm = () => {
    setInqueritoForm({
      numero_inquerito: "",
      data_instauracao: format(new Date(), "yyyy-MM-dd"),
      autoridade_responsavel: "",
      relatorio: "",
      parecer: "",
      resultado: "",
      status: "em_andamento" as InqueritoPolicialStatus,
    });
  };

  const openEditInquerito = (inq: InqueritoPolicial) => {
    setInqueritoForm({
      numero_inquerito: inq.numero_inquerito,
      data_instauracao: inq.data_instauracao,
      autoridade_responsavel: inq.autoridade_responsavel,
      relatorio: inq.relatorio || "",
      parecer: inq.parecer || "",
      resultado: inq.resultado || "",
      status: inq.status,
    });
    setEditingInqueritoId(inq.id);
    setInqueritoEditDialogOpen(true);
  };

  // --- CRUD: Advertência ---
  const createAdvertencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !advertenciaAfastamentoId) return;
    const { error } = await supabase.from("advertencias").insert({
      descricao: advertenciaForm.descricao,
      data_advertencia: advertenciaForm.data_advertencia,
      autoridade_responsavel: advertenciaForm.autoridade_responsavel,
      afastamento_id: advertenciaAfastamentoId,
    });
    if (error) {
      toast.error("Erro ao adicionar advertência: " + error.message);
    } else {
      toast.success("Advertência registrada!");
      setAdvertenciaDialogOpen(false);
      setAdvertenciaForm({
        descricao: "",
        data_advertencia: format(new Date(), "yyyy-MM-dd"),
        autoridade_responsavel: "",
      });
    }
  };

  // --- Print / PDF ---
  const printAfastamento = (afastamento: Afastamento) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const linkedInvs = getInvestigacoes(afastamento.id);
    const linkedInqs = getInqueritos(afastamento.id);
    const linkedAdvs = getAdvertencias(afastamento.id);
    win.document.write(`
      <html><head><title>Afastamento - ${afastamento.nome_completo}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 40px; color: #222; max-width: 800px; margin: 0 auto; }
        h1 { text-align: center; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; }
        h2 { font-size: 12px; margin-top: 20px; border-bottom: 1px solid #999; padding-bottom: 4px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h3 { font-size: 11px; text-transform: uppercase; margin: 0; }
        .field { margin: 6px 0; font-size: 11px; }
        .field strong { display: inline-block; width: 200px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
        th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; }
        th { background: #eee; }
        .footer { margin-top: 40px; font-size: 10px; text-align: center; color: #666; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="header">
        <h3>Corregedoria Geral da Polícia Militar</h3>
        <h1>Registro de Afastamento</h1>
      </div>
      <div class="field"><strong>Número da Portaria:</strong> ${afastamento.numero_portaria}</div>
      <div class="field"><strong>Data da Portaria:</strong> ${format(new Date(afastamento.data_portaria), "dd/MM/yyyy")}</div>
      <div class="field"><strong>Posto/Graduação:</strong> ${afastamento.posto_graduacao}</div>
      <div class="field"><strong>Nome Completo:</strong> ${afastamento.nome_completo}</div>
      <div class="field"><strong>RG PM:</strong> ${afastamento.rg_pm}</div>
      <div class="field"><strong>Unidade:</strong> ${afastamento.unidade}</div>
      <div class="field"><strong>Função/Cargo:</strong> ${afastamento.funcao_cargo || "N/A"}</div>
      <div class="field"><strong>Motivo do Afastamento:</strong> ${afastamento.motivo_afastamento}</div>
      <div class="field"><strong>Prazo do Afastamento:</strong> ${afastamento.prazo_afastamento}</div>
      <div class="field"><strong>Responsável pela Decisão:</strong> ${afastamento.responsavel_decisao}</div>
      <div class="field"><strong>Status:</strong> ${AFASTAMENTO_STATUS_LABEL[afastamento.status]}</div>
      ${afastamento.observacoes ? `<div class="field"><strong>Observações:</strong> ${afastamento.observacoes}</div>` : ""}
      ${linkedInvs.length > 0 ? `
        <h2>Investigações Vinculadas</h2>
        <table><tr><th>Nº Investigação</th><th>Data</th><th>Encarregado</th><th>Status</th></tr>
        ${linkedInvs.map(i => `<tr><td>${i.numero_investigacao}</td><td>${format(new Date(i.data_instauracao), "dd/MM/yyyy")}</td><td>${i.encarregado}</td><td>${INVESTIGACAO_POLICIAL_STATUS_LABEL[i.status]}</td></tr>`).join("")}
        </table>` : ""}
      ${linkedInqs.length > 0 ? `
        <h2>Inquéritos Vinculados</h2>
        <table><tr><th>Nº Inquérito</th><th>Data</th><th>Autoridade</th><th>Status</th></tr>
        ${linkedInqs.map(i => `<tr><td>${i.numero_inquerito}</td><td>${format(new Date(i.data_instauracao), "dd/MM/yyyy")}</td><td>${i.autoridade_responsavel}</td><td>${INQUERITO_POLICIAL_STATUS_LABEL[i.status]}</td></tr>`).join("")}
        </table>` : ""}
      <div class="footer">Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} - Corregedoria Geral PMESP</div>
      <script>window.print();</script>
      </body></html>
    `);
    win.document.close();
  };

  let content: JSX.Element | null = null;

  // --- Dashboard ---
  if (subTab === "dashboard") {
    content = (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-lg font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Dashboard de Afastamentos
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubTab("listagem")}
              className="border-border text-muted-foreground hover:text-foreground text-[10px] uppercase"
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> Ver Listagem
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubTab("historico")}
              className="border-border text-muted-foreground hover:text-foreground text-[10px] uppercase"
            >
              <BookOpen className="h-3.5 w-3.5 mr-1" /> Histórico
            </Button>
          </div>
        </div>

        {fetching ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <StatCard
              title="Afastamentos Ativos"
              value={stats.ativos}
              icon={AlertTriangle}
              color="text-amber-500"
            />
            <StatCard
              title="Afastamentos Encerrados"
              value={stats.encerrados}
              icon={UserCheck}
              color="text-slate-400"
            />
            <StatCard
              title="Em Investigação"
              value={stats.emInvestigacao}
              icon={Shield}
              color="text-blue-500"
            />
            <StatCard
              title="Em Inquérito"
              value={stats.emInquerito}
              icon={Gavel}
              color="text-red-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Afastamentos por Status</h4>
            <div className="space-y-3">
              {(Object.entries(AFASTAMENTO_STATUS_LABEL) as [AfastamentoStatus, string][]).map(([key, label]) => {
                const count = afastamentos.filter(a => a.status === key).length;
                const total = afastamentos.length || 1;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground">{label}</span>
                      <span className="text-muted-foreground font-mono">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${AFASTAMENTO_STATUS_COLOR[key].split(" ")[0]}`}
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Últimos Afastamentos</h4>
            <div className="space-y-2">
              {afastamentos.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="overflow-hidden">
                    <p className="text-xs text-foreground font-bold truncate">{a.nome_completo}</p>
                    <p className="text-[10px] text-muted-foreground">{a.motivo_afastamento}</p>
                  </div>
                  <Badge variant="outline" className={`text-[9px] uppercase ${AFASTAMENTO_STATUS_COLOR[a.status]}`}>
                    {AFASTAMENTO_STATUS_LABEL[a.status]}
                  </Badge>
                </div>
              ))}
              {afastamentos.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum afastamento registrado.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Ações Rápidas</h4>
            <div className="space-y-2">
              {canCreate && (
                <Button
                  onClick={() => { resetAfastamentoForm(); setAfastamentoDialogOpen(true); }}
                  className="w-full bg-primary hover:bg-primary/80 text-white text-[10px] uppercase font-bold"
                  size="sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Novo Afastamento
                </Button>
              )}
              <Button
                onClick={() => setSubTab("listagem")}
                variant="outline"
                className="w-full border-border text-muted-foreground hover:text-foreground text-[10px] uppercase"
                size="sm"
              >
                <Eye className="h-3.5 w-3.5 mr-1" /> Ver Todos os Registros
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (subTab === "listagem") {
    content = (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <ClipboardList className="h-5 w-5" /> Registro de Afastamentos
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubTab("dashboard")}
                className="border-border text-muted-foreground hover:text-foreground text-[10px] uppercase"
              >
                <LayoutDashboard className="h-3.5 w-3.5 mr-1" /> Dashboard
              </Button>
              {canCreate && (
                <Button
                  size="sm"
                  onClick={() => { resetAfastamentoForm(); setAfastamentoDialogOpen(true); }}
                  className="bg-primary hover:bg-primary/80 text-white text-[10px] uppercase"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Novo Afastamento
                </Button>
              )}
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, RG, unidade, portaria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-background border-border text-foreground text-xs pl-9 h-9"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as AfastamentoStatus | "todos")}
            >
              <SelectTrigger className="bg-background border-border text-foreground text-[10px] uppercase h-9 w-[160px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border text-foreground">
                <SelectItem value="todos" className="text-[10px]">Todos</SelectItem>
                {Object.entries(AFASTAMENTO_STATUS_LABEL).map(([val, lab]) => (
                  <SelectItem key={val} value={val} className="text-[10px]">{lab}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {filteredAfastamentos.length} registro(s)
            </span>
          </div>
        </div>

        {/* List */}
        {fetching ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
        ) : filteredAfastamentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhum afastamento encontrado.</p>
            {canCreate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { resetAfastamentoForm(); setAfastamentoDialogOpen(true); }}
                className="mt-4 border-border text-[10px] uppercase"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Cadastrar Primeiro Afastamento
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAfastamentos.map(afastamento => {
              const isExpanded = expandedId === afastamento.id;
              const linkedInvs = getInvestigacoes(afastamento.id);
              const linkedInqs = getInqueritos(afastamento.id);
              const linkedAdvs = getAdvertencias(afastamento.id);
              return (
                <div key={afastamento.id} className="rounded-lg border border-border bg-card overflow-hidden">
                  {/* Card Header */}
                  <div
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-muted cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : afastamento.id)}
                  >
                    <div className="flex items-center gap-4 flex-1 overflow-hidden">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted/50">
                        {afastamento.status === "ativo" ? (
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                        ) : afastamento.status === "encerrado" ? (
                          <UserCheck className="h-5 w-5 text-slate-400" />
                        ) : (
                          <Shield className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <div className="flex items-center gap-3 whitespace-nowrap overflow-hidden">
                          <h4 className="font-bold uppercase text-foreground tracking-wide truncate">
                            {afastamento.nome_completo}
                          </h4>
                          <Badge variant="outline" className="bg-muted border-border text-foreground font-mono text-[9px]">
                            RG: {afastamento.rg_pm}
                          </Badge>
                          <Badge variant="outline" className="bg-muted border-border text-muted-foreground text-[9px] uppercase">
                            {afastamento.posto_graduacao}
                          </Badge>
                          <Badge variant="outline" className={`text-[9px] uppercase border ${AFASTAMENTO_STATUS_COLOR[afastamento.status]}`}>
                            {AFASTAMENTO_STATUS_LABEL[afastamento.status]}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-widest">
                          <span>Portaria: {afastamento.numero_portaria}</span>
                          <span>·</span>
                          <span>{format(new Date(afastamento.data_portaria), "dd/MM/yyyy")}</span>
                          <span>·</span>
                          <span>{afastamento.unidade}</span>
                          <span>·</span>
                          <span>{afastamento.motivo_afastamento}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Status Select */}
                      {canEdit && (
                        <Select
                          value={afastamento.status}
                          onValueChange={(v: AfastamentoStatus) => updateAfastamentoStatus(afastamento.id, v)}
                        >
                          <SelectTrigger className="h-8 bg-muted border-border text-[10px] text-muted-foreground uppercase w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-muted border-border text-foreground">
                            {Object.entries(AFASTAMENTO_STATUS_LABEL).map(([val, lab]) => (
                              <SelectItem key={val} value={val} className="text-[10px] uppercase">{lab}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {canEdit && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-foreground hover:text-foreground hover:bg-muted/50"
                          onClick={() => openEditAfastamento(afastamento)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => setConfirmDialog({
                            open: true,
                            title: "Excluir Afastamento",
                            description: `Tem certeza que deseja excluir o afastamento de ${afastamento.nome_completo}?`,
                            onConfirm: () => { deleteAfastamento(afastamento.id); setConfirmDialog(prev => ({ ...prev, open: false })); },
                          })}
                          title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-foreground hover:text-foreground hover:bg-muted/50"
                        onClick={() => printAfastamento(afastamento)} title="Imprimir / PDF">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-foreground hover:text-foreground hover:bg-muted/50"
                        onClick={() => setExpandedId(isExpanded ? null : afastamento.id)} title="Expandir">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border/50 bg-muted/50 p-6 space-y-6">
                      {/* Full Details */}
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Nº Portaria:</strong> {afastamento.numero_portaria}</p>
                          <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Data da Portaria:</strong> {format(new Date(afastamento.data_portaria), "dd/MM/yyyy")}</p>
                          <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Posto/Graduação:</strong> {afastamento.posto_graduacao}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Função/Cargo:</strong> {afastamento.funcao_cargo || "N/A"}</p>
                          <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Motivo:</strong> {afastamento.motivo_afastamento}</p>
                          <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Prazo:</strong> {afastamento.prazo_afastamento}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Responsável:</strong> {afastamento.responsavel_decisao}</p>
                          {afastamento.observacoes && (
                            <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Observações:</strong> {afastamento.observacoes}</p>
                          )}
                        </div>
                      </div>

                      {/* Linked Investigations */}
                      <div className="rounded border border-border bg-muted p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Investigações ({linkedInvs.length})
                          </h4>
                          {canManageInvestigacoes && (
                            <Button size="sm" variant="outline" className="border-border text-[10px] uppercase h-7"
                              onClick={() => { resetInvestigacaoForm(); setInvestigacaoAfastamentoId(afastamento.id); setInvestigacaoDialogOpen(true); }}>
                              <Plus className="h-3 w-3 mr-1" /> Nova Investigação
                            </Button>
                          )}
                        </div>
                        {linkedInvs.length > 0 ? (
                          <div className="space-y-2">
                            {linkedInvs.map(inv => (
                              <div key={inv.id} className="flex items-center justify-between rounded bg-background px-3 py-2 text-sm border border-border">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-foreground font-bold">#{inv.numero_investigacao}</span>
                                    <Badge variant="outline" className={`text-[9px] uppercase ${INVESTIGACAO_POLICIAL_STATUS_COLOR[inv.status]}`}>
                                      {INVESTIGACAO_POLICIAL_STATUS_LABEL[inv.status]}
                                    </Badge>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-1">Encarregado: {inv.encarregado} · {format(new Date(inv.data_instauracao), "dd/MM/yyyy")}</p>
                                  <p className="text-[10px] text-foreground mt-1">{inv.descricao_fatos.substring(0, 200)}{inv.descricao_fatos.length > 200 ? "..." : ""}</p>
                                  {inv.provas_anexadas && <p className="text-[10px] text-muted-foreground mt-1">Provas: {inv.provas_anexadas}</p>}
                                  {inv.testemunhas && <p className="text-[10px] text-muted-foreground">Testemunhas: {inv.testemunhas}</p>}
                                </div>
                                <div className="flex gap-1 ml-2 shrink-0">
                                  {canManageInvestigacoes && (
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                      onClick={() => openEditInvestigacao(inv)} title="Editar">
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  {canDelete && (
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-400"
                                      onClick={() => deleteInvestigacao(inv.id)} title="Excluir">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Nenhuma investigação vinculada.</p>
                        )}
                      </div>

                      {/* Linked Inquiries */}
                      <div className="rounded border border-border bg-muted p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                            <FileSignature className="h-4 w-4" /> Inquéritos ({linkedInqs.length})
                          </h4>
                          {canEdit && (
                            <Button size="sm" variant="outline" className="border-border text-[10px] uppercase h-7"
                              onClick={() => { resetInqueritoForm(); setInqueritoAfastamentoId(afastamento.id); setInqueritoDialogOpen(true); }}>
                              <Plus className="h-3 w-3 mr-1" /> Novo Inquérito
                            </Button>
                          )}
                        </div>
                        {linkedInqs.length > 0 ? (
                          <div className="space-y-2">
                            {linkedInqs.map(inq => (
                              <div key={inq.id} className="flex items-center justify-between rounded bg-background px-3 py-2 text-sm border border-border">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-foreground font-bold">#{inq.numero_inquerito}</span>
                                    <Badge variant="outline" className={`text-[9px] uppercase ${INQUERITO_POLICIAL_STATUS_COLOR[inq.status]}`}>
                                      {INQUERITO_POLICIAL_STATUS_LABEL[inq.status]}
                                    </Badge>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-1">Autoridade: {inq.autoridade_responsavel} · {format(new Date(inq.data_instauracao), "dd/MM/yyyy")}</p>
                                  {inq.relatorio && <p className="text-[10px] text-foreground mt-1">Relatório: {inq.relatorio.substring(0, 200)}{inq.relatorio.length > 200 ? "..." : ""}</p>}
                                  {inq.parecer && <p className="text-[10px] text-foreground mt-1">Parecer: {inq.parecer.substring(0, 200)}{inq.parecer.length > 200 ? "..." : ""}</p>}
                                  {inq.resultado && <p className="text-[10px] text-muted-foreground mt-1">Resultado: {inq.resultado}</p>}
                                </div>
                                <div className="flex gap-1 ml-2 shrink-0">
                                  {canEdit && (
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                      onClick={() => openEditInquerito(inq)} title="Editar">
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  {canDelete && (
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-400"
                                      onClick={() => deleteInquerito(inq.id)} title="Excluir">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Nenhum inquérito vinculado.</p>
                        )}
                      </div>

                      {/* Advertencias */}
                      <div className="rounded border border-border bg-muted p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                            <Ban className="h-4 w-4" /> Advertências ({linkedAdvs.length})
                          </h4>
                          {canEdit && (
                            <Button size="sm" variant="outline" className="border-border text-[10px] uppercase h-7"
                              onClick={() => { setAdvertenciaAfastamentoId(afastamento.id); setAdvertenciaDialogOpen(true); }}>
                              <Plus className="h-3 w-3 mr-1" /> Nova Advertência
                            </Button>
                          )}
                        </div>
                        {linkedAdvs.length > 0 ? (
                          <div className="space-y-2">
                            {linkedAdvs.map(adv => (
                              <div key={adv.id} className="flex items-center justify-between rounded bg-background px-3 py-2 text-sm border border-border">
                                <div>
                                  <p className="text-xs text-foreground font-bold">{format(new Date(adv.data_advertencia), "dd/MM/yyyy")} - {adv.autoridade_responsavel}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1">{adv.descricao}</p>
                                </div>
                                {canDelete && (
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"
                                    onClick={async () => {
                                      await supabase.from("advertencias").delete().eq("id", adv.id);
                                      toast.success("Advertência excluída!");
                                    }}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Nenhuma advertência registrada.</p>
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
      );
    }

  // --- Histórico Individual ---
  } else if (subTab === "historico") {
    content = (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-lg font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Histórico Individual do Policial
          </h3>
          <Button variant="outline" size="sm" onClick={() => setSubTab("dashboard")}
            className="border-border text-muted-foreground hover:text-foreground text-[10px] uppercase">
            <LayoutDashboard className="h-3.5 w-3.5 mr-1" /> Dashboard
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Digite o nome, RG ou unidade do policial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background border-border text-foreground text-xs pl-9 h-9"
          />
        </div>

        {/* Results */}
        {searchTerm.length > 2 ? (
          <div className="space-y-4">
            {afastamentos
              .filter(a => a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.rg_pm.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.unidade.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(afastamento => {
                const linkedInvs = getInvestigacoes(afastamento.id);
                const linkedInqs = getInqueritos(afastamento.id);
                const linkedAdvs = getAdvertencias(afastamento.id);
                return (
                  <div key={afastamento.id} className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-foreground uppercase tracking-wide">{afastamento.nome_completo}</h4>
                          <p className="text-[10px] text-muted-foreground">
                            RG: {afastamento.rg_pm} · {afastamento.posto_graduacao} · {afastamento.unidade}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-[9px] uppercase ${AFASTAMENTO_STATUS_COLOR[afastamento.status]}`}>
                          {AFASTAMENTO_STATUS_LABEL[afastamento.status]}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div className="rounded bg-muted/50 p-3 border border-border">
                          <p className="text-2xl font-bold text-foreground">{1}</p>
                          <p className="text-[9px] uppercase text-muted-foreground">Afastamento</p>
                        </div>
                        <div className="rounded bg-muted/50 p-3 border border-border">
                          <p className="text-2xl font-bold text-foreground">{linkedInvs.length}</p>
                          <p className="text-[9px] uppercase text-muted-foreground">Investigações</p>
                        </div>
                        <div className="rounded bg-muted/50 p-3 border border-border">
                          <p className="text-2xl font-bold text-foreground">{linkedInqs.length}</p>
                          <p className="text-[9px] uppercase text-muted-foreground">Inquéritos</p>
                        </div>
                        <div className="rounded bg-muted/50 p-3 border border-border">
                          <p className="text-2xl font-bold text-foreground">{linkedAdvs.length}</p>
                          <p className="text-[9px] uppercase text-muted-foreground">Advertências</p>
                        </div>
                      </div>

                      <Button size="sm" variant="outline" className="mt-4 border-border text-[10px] uppercase"
                        onClick={() => { setExpandedId(afastamento.id); setSubTab("listagem"); }}>
                        Ver Detalhes Completos
                      </Button>
                    </div>
                  </div>
                );
              })}
            {afastamentos.filter(a => a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum policial encontrado com esse termo.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Digite pelo menos 3 caracteres para pesquisar o histórico de um policial.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {content}

      {/* Create Afastamento Dialog */}
      <Dialog open={afastamentoDialogOpen} onOpenChange={(open) => { setAfastamentoDialogOpen(open); if (!open) resetAfastamentoForm(); }}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground">
          <DialogHeader>
            <div className="text-center pb-2 border-b border-border">
              <p className="text-[9px] font-bold uppercase tracking-widest text-foreground mb-1">Corregedoria Geral (PMESP)</p>
              <DialogTitle className="text-foreground uppercase tracking-wider text-sm">Novo Afastamento</DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={createAfastamento} className="space-y-4 mt-2">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Nº da Portaria *</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.numero_portaria}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, numero_portaria: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Data da Portaria *</Label>
                  <Input required type="date" className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.data_portaria}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, data_portaria: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Posto/Graduação *</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.posto_graduacao}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, posto_graduacao: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Nome Completo *</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.nome_completo}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, nome_completo: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">RG PM *</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.rg_pm}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, rg_pm: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Unidade *</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.unidade}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, unidade: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Função/Cargo</Label>
                  <Input className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.funcao_cargo}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, funcao_cargo: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Motivo do Afastamento *</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.motivo_afastamento}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, motivo_afastamento: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Prazo do Afastamento *</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.prazo_afastamento}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, prazo_afastamento: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Responsável pela Decisão *</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.responsavel_decisao}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, responsavel_decisao: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Observações</Label>
                <Textarea rows={3} className="bg-background border-border text-foreground text-xs"
                  value={afastamentoForm.observacoes}
                  onChange={(e) => setAfastamentoForm({ ...afastamentoForm, observacoes: e.target.value })} />
              </div>
            </div>
            <div className="pt-4 border-t border-border flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" className="border-border text-[10px] uppercase"
                onClick={() => { setAfastamentoDialogOpen(false); resetAfastamentoForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/80 text-white px-8 font-bold tracking-widest text-[10px] uppercase">
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Afastamento Dialog */}
      <Dialog open={afastamentoEditDialogOpen} onOpenChange={(open) => { setAfastamentoEditDialogOpen(open); if (!open) { setEditingAfastamentoId(null); resetAfastamentoForm(); } }}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground">
          <DialogHeader>
            <div className="text-center pb-2 border-b border-border">
              <p className="text-[9px] font-bold uppercase tracking-widest text-foreground mb-1">Corregedoria Geral (PMESP)</p>
              <DialogTitle className="text-foreground uppercase tracking-wider text-sm">Editar Afastamento</DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={updateAfastamento} className="space-y-4 mt-2">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Nº da Portaria</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.numero_portaria}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, numero_portaria: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Data da Portaria</Label>
                  <Input required type="date" className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.data_portaria}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, data_portaria: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Posto/Graduação</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.posto_graduacao}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, posto_graduacao: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Nome Completo</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.nome_completo}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, nome_completo: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">RG PM</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.rg_pm}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, rg_pm: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Unidade</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.unidade}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, unidade: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Função/Cargo</Label>
                  <Input className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.funcao_cargo}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, funcao_cargo: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Motivo do Afastamento</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.motivo_afastamento}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, motivo_afastamento: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Prazo do Afastamento</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.prazo_afastamento}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, prazo_afastamento: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Responsável pela Decisão</Label>
                  <Input required className="bg-background border-border text-foreground h-8 text-xs"
                    value={afastamentoForm.responsavel_decisao}
                    onChange={(e) => setAfastamentoForm({ ...afastamentoForm, responsavel_decisao: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Status</Label>
                <Select value={afastamentoForm.status} onValueChange={(v: AfastamentoStatus) => setAfastamentoForm({ ...afastamentoForm, status: v })}>
                  <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border text-foreground">
                    {Object.entries(AFASTAMENTO_STATUS_LABEL).map(([val, lab]) => (
                      <SelectItem key={val} value={val} className="text-[10px]">{lab}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Observações</Label>
                <Textarea rows={3} className="bg-background border-border text-foreground text-xs"
                  value={afastamentoForm.observacoes}
                  onChange={(e) => setAfastamentoForm({ ...afastamentoForm, observacoes: e.target.value })} />
              </div>
            </div>
            <div className="pt-4 border-t border-border flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" className="border-border text-[10px] uppercase"
                onClick={() => { setAfastamentoEditDialogOpen(false); setEditingAfastamentoId(null); resetAfastamentoForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/80 text-white px-8 font-bold tracking-widest text-[10px] uppercase">
                {submitting ? "Salvando..." : "Salvar Alterações"}
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
    </>
  );
}
