import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Shield, FileText, Loader2, Plus, Trash2, Edit,
  Printer, Search, X, FileSignature, Eye,
  ChevronRight, AlertTriangle, Gavel, Copy, History, BookOpen,
  UserCheck, Link2, Scale, FileSearch, ArrowRight, Activity, MessageSquare,
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
import { logAudit } from "@/lib/audit-log";
import { IPM_STATUS_LABEL, IPM_STATUS_COLOR } from "@/lib/corregedoria/constants";
import type { Ipm, IpmStatus, Indiciado, Enquadramento, Vinculacao, VersaoDocumento } from "@/lib/corregedoria/types";
import { BRASAO_SP_LOGO, PM_LOGO } from "./ipm-logos";

interface IpmFormData {
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
}

const defaultForm: IpmFormData = {
  numero_ipm: "",
  data_instauracao: format(new Date(), "yyyy-MM-dd"),
  unidade: "",
  status: "em_andamento",
  encarregado_nome: "",
  encarregado_posto: "",
  autoridade_nome: "",
  autoridade_posto: "",
  fundamentacao: "",
  artigos_cpm: "",
  artigos_rdpm: "",
  relatorio_fatos: "",
  conclusao_parcial: "",
  indiciados: [],
  enquadramentos: [],
};

const PORTARIA_TEMPLATE = (data: IpmFormData, autorNome?: string, autorPosto?: string) => {
  const indiciadosStr = data.indiciados.length > 0
    ? data.indiciados.map(i => `${i.posto_graduacao} ${i.nome}`).join(", ")
    : "os policial(is) militar(es) indiciado(s)";

  return `O CORREGEDOR DA POLÍCIA MILITAR DO ESTADO DE SÃO PAULO no uso de suas atribuições legais e regulamentares, especialmente nos termos do Regulamento Disciplinar da Polícia Militar do Estado de São Paulo (RDPM),

CONSIDERANDO a necessidade de apurar, de forma ampla, imparcial e fundamentada, os fatos constantes da notícia de possível transgressão disciplinar e/ou crime militar,

CONSIDERANDO que os elementos iniciais indicam a necessidade da produção de provas, oitivas e demais diligências indispensáveis ao completo esclarecimento dos fatos,

RESOLVE:

Art. 1º Instaurar INQUÉRITO POLICIAL MILITAR (IPM) para apurar os fatos ocorridos em /2026, envolvendo o(s) policial(is) militar(es) ${indiciadosStr}.

Art. 2º Designar como Encarregado do Inquérito Policial Militar o(a) ${data.encarregado_posto || "________"} ${data.encarregado_nome || "________"}, que deverá conduzir os trabalhos observando rigorosamente a legislação vigente, bem como os princípios da legalidade, imparcialidade e devido processo.

Art. 3º O Encarregado do IPM poderá requisitar documentos, determinar diligências, proceder à inquirição de testemunhas e requerer todos os outros necessários à completa elucidação dos fatos.

Art. 4º O prazo para conclusão do presente Inquérito Policial Militar será de ____ dias, podendo ser prorrogado mediante autorização da Corregedoria, quando devidamente justificada.

Art. 5º Concluído o inquérito, os autos deverão ser encaminhados à Corregedoria da Polícia Militar para análise, manifestação e adoção das providências cabíveis.

Art. 6º Esta Portaria entra em vigor na data de sua publicação.

Publique-se. Registre-se. Cumpra-se.`;
};

function generateIpmHtml(data: IpmFormData, autorNome?: string, autorPosto?: string): string {
  const dataFormatada = data.data_instauracao
    ? format(new Date(data.data_instauracao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "____/____/______";

  const indiciadosMatriculas = data.indiciados.length > 0
    ? data.indiciados.map(i => `${i.posto_graduacao} ${i.nome}`).join(", ")
    : "__________________________";
  const matriculas = data.indiciados.length > 0
    ? data.indiciados.map(i => i.rg_pm || "________").join(", ")
    : "________________";

  const indiciadosStr = data.indiciados.map((i, idx) =>
    `${idx + 1}. ${i.posto_graduacao} ${i.nome} – RG PM nº ${i.rg_pm} – ${i.unidade}`
  ).join("<br>");

  const enquadramentosStr = data.enquadramentos.map(e =>
    `<strong>Indiciado:</strong> ${e.indiciado_nome}<br>CPM: ${e.artigos_cpm}<br>CPPM: ${e.artigos_cppm}<br>RDPM: ${e.artigos_rdpm}<br>Obs: ${e.observacoes}`
  ).join("<br><br>");

  const autorNomeFinal = autorNome || data.autoridade_nome || "";
  const autorPostoFinal = autorPosto || data.autoridade_posto || "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 72pt; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Arial", sans-serif;
    font-size: 11pt;
    line-height: 1.15;
    color: #000;
    background: #fff;
  }
  .doc-content {
    background-color: #fff;
    max-width: 451.4pt;
    padding: 72pt;
    margin: 0 auto;
  }
  p { margin: 0; color: #000; font-size: 11pt; font-family: "Arial"; }
  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0;
  }
  .header-table td {
    vertical-align: middle;
    padding: 0;
  }
  .header-table .logo-cell {
    width: 80px;
    text-align: center;
  }
  .header-table .logo-cell img {
    display: block;
    margin: 0 auto;
  }
  .header-table .text-cell {
    text-align: center;
    padding: 0 8px;
  }
  .header-table .text-cell p {
    font-size: 11pt;
    font-weight: 700;
    line-height: 1.35;
    text-align: center;
  }
  .body-justify { padding: 12pt 0; line-height: 1.0; text-align: justify; }
  .title-h1 {
    padding-top: 24pt;
    padding-bottom: 6pt;
    line-height: 1.0;
    text-align: left;
    font-size: 11pt;
    font-weight: 700;
    color: #434343;
  }
  .artigo { padding: 12pt 0; line-height: 1.0; text-align: justify; }
  .divider { border: none; border-top: 1px solid #000; margin: 0; }
  .page-number {
    text-align: right;
    font-size: 9pt;
    padding-top: 10px;
  }
  @media print {
    body { margin: 0; }
    .doc-content { padding: 72pt; max-width: none; }
  }
</style>
</head>
<body class="doc-content">
  <!-- CABECALHO: logos laterais + texto centralizado -->
  <table class="header-table">
    <tr>
      <td class="logo-cell" style="width:80px;">
        <img src="${BRASAO_SP_LOGO}" style="width:75px;height:auto;" title="">
      </td>
      <td class="text-cell">
        <p>GOVERNO DO ESTADO DE SÃO PAULO</p>
        <p>SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA</p>
        <p>POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</p>
        <p>QUARTEL DA CORREGEDORIA-GERAL DA POLÍCIA MILITAR</p>
      </td>
      <td class="logo-cell" style="width:92px;">
        <img src="${PM_LOGO}" style="width:88px;height:auto;" title="">
      </td>
    </tr>
  </table>

  <!-- CORPO DO DOCUMENTO -->
  <p class="body-justify"><strong>POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</strong></p>
  <p class="body-justify"><strong>CORREGEDORIA DA POLÍCIA MILITAR</strong></p>

  <!-- TITULO DA PORTARIA -->
  <h1 class="title-h1">PORTARIA Nº ${data.numero_ipm || "____"}/2026 – CPM</h1>

  <!-- TEXTOS DE CONSIDERACAO -->
  <p class="body-justify">O CORREGEDOR DA POLÍCIA MILITAR DO ESTADO DE SÃO PAULO, no uso de suas atribuições legais e regulamentares, especialmente nos termos do Regulamento Disciplinar da Polícia Militar do Estado de São Paulo (RDPM),</p>
  <p class="body-justify">CONSIDERANDO a necessidade de apurar, de forma ampla, imparcial e fundamentada, os fatos constantes da notícia de possível transgressão disciplinar e/ou crime militar;</p>
  <p class="body-justify">CONSIDERANDO que os elementos iniciais indicam a necessidade de produção de provas, oitivas e demais diligências indispensáveis ao completo esclarecimento dos fatos;</p>

  <!-- RESOLVE -->
  <p style="padding:18pt 0 4pt;line-height:1.0;text-align:left;"><strong>RESOLVE:</strong></p>

  <!-- ARTIGOS -->
  <p class="artigo"><strong>Art. 1º</strong> Instaurar INQUÉRITO POLICIAL MILITAR (IPM) para apurar os fatos ocorridos em ${data.data_instauracao ? format(new Date(data.data_instauracao), "dd/MM/yyyy") : "//2026"}, envolvendo o(s) policial(is) militar(es): ${indiciadosMatriculas}, matrícula(s): ${matriculas}.</p>
  <p class="artigo"><strong>Art. 2º</strong> Designar como Encarregado do Inquérito Policial Militar o(a) ${data.encarregado_posto || "__________________________"} ${data.encarregado_nome || "__________________________"}, que deverá conduzir os trabalhos observando rigorosamente a legislação vigente, bem como os princípios da legalidade, imparcialidade e devido processo.</p>
  <p class="artigo"><strong>Art. 3º</strong> O Encarregado do IPM poderá requisitar documentos, determinar diligências, proceder à oitiva de testemunhas, realizar interrogatórios e praticar todos os atos necessários à completa elucidação dos fatos.</p>
  <p class="artigo"><strong>Art. 4º</strong> O prazo para conclusão do presente Inquérito Policial Militar será de __________ dias, podendo ser prorrogado mediante autorização da Corregedoria, quando devidamente justificado.</p>
  <p class="artigo"><strong>Art. 5º</strong> Concluído o Inquérito, os autos deverão ser encaminhados à Corregedoria da Polícia Militar para análise, manifestação e adoção das providências cabíveis.</p>
  <p class="artigo"><strong>Art. 6º</strong> Esta Portaria entra em vigor na data de sua publicação.</p>

  <!-- PUBLIQUE-SE -->
  <p style="padding:12pt 0;line-height:1.0;">Publique-se. Registre-se. Cumpra-se.</p>

  <!-- LINHA -->
  <hr class="divider">

  <!-- DATA -->
  <p style="text-align:center;padding:12pt 0 0;line-height:1.0;">São Paulo, ${dataFormatada}.</p>

  <!-- ESPACO PARA ASSINATURA -->
  <p style="text-align:center;padding:0;line-height:1.0;"><br><br><br><br><br></p>

  <!-- ASSINATURA -->
  <p style="text-align:center;padding:0;line-height:1.15;">Ass: ${autorNomeFinal || "___________________________"}</p>
  ${autorPostoFinal ? `<p style="text-align:center;padding:0;line-height:1.15;font-size:10pt;">${autorPostoFinal}</p>` : ""}
  <p style="text-align:center;padding:0;line-height:1.15;font-size:10pt;">Corregedor da Polícia Militar do Estado de São Paulo</p>

  <!-- NUMERO DA PAGINA -->
  <div class="page-number">1</div>
</body>
</html>`;
}

function generateIpmDoc(data: IpmFormData, autorNome?: string, autorPosto?: string): string {
  return generateIpmHtml(data, autorNome, autorPosto);
}

interface IpmTabProps {
  denuncias: any[];
  investigacoes: any[];
  relatorios: any[];
  depoimentos: any[];
  ipmVinculos: any[];
  linkIpmId: string;
  setLinkIpmId: (v: string) => void;
  linking: boolean;
  handleLinkIpm: (ipmId: string, entidadeId: string, entidadeTipo: string) => Promise<void>;
  handleUnlinkIpm: (vinculoId: string) => Promise<void>;
}

export function IpmTab({ denuncias, investigacoes, relatorios, depoimentos, ipmVinculos, linkIpmId, setLinkIpmId, linking: parentLinking, handleLinkIpm, handleUnlinkIpm }: IpmTabProps) {
  const { user, isAdmin, roles } = useAuth();
  const currentRole: string = (roles[0] || "consulta") as string;
  const canDelete = currentRole === "corregedor_geral" || currentRole === "subcorregedor" || isAdmin;
  const canEdit = currentRole === "corregedor_geral" || currentRole === "subcorregedor" || currentRole === "corregedor" || currentRole === "investigador" || isAdmin;
  const canCreate = canEdit;

  const [loading, setLoading] = useState(true);
  const [ipms, setIpms] = useState<Ipm[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<IpmFormData>(defaultForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [docPreviewOpen, setDocPreviewOpen] = useState(false);
  const [docPreviewContent, setDocPreviewContent] = useState("");

  const [indiciadoForm, setIndiciadoForm] = useState<Indiciado>({ id: "", nome: "", posto_graduacao: "", rg_pm: "", unidade: "" });
  const [indiciadoDialogOpen, setIndiciadoDialogOpen] = useState(false);
  const [editingIndiciadoIdx, setEditingIndiciadoIdx] = useState<number | null>(null);

  const [enquadramentoForm, setEnquadramentoForm] = useState<Enquadramento>({ id: "", indiciado_nome: "", artigos_cpm: "", artigos_cppm: "", artigos_rdpm: "", observacoes: "" });
  const [enquadramentoDialogOpen, setEnquadramentoDialogOpen] = useState(false);
  const [editingEnqIdx, setEditingEnqIdx] = useState<number | null>(null);

  const [vinculacaoDialogOpen, setVinculacaoDialogOpen] = useState(false);
  const [vinculacaoTipo, setVinculacaoTipo] = useState<Vinculacao["tipo"]>("afastamento");
  const [vinculacaoDescricao, setVinculacaoDescricao] = useState("");

  const [denunciaLinkId, setDenunciaLinkId] = useState("");
  const [investigacaoLinkId, setInvestigacaoLinkId] = useState("");
  const [atoLinkId, setAtoLinkId] = useState("");
  const [depoimentoLinkId, setDepoimentoLinkId] = useState("");

  const loadIpms = async () => {
    const { data, error } = await supabase.from("ipm").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Erro ao carregar IPMs"); return; }
    setIpms((data as any) || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadIpms();
      setLoading(false);
    };
    init();
  }, []);

  const resetForm = () => {
    setForm({
      ...defaultForm,
      data_instauracao: format(new Date(), "yyyy-MM-dd"),
      autoridade_nome: user?.user_metadata?.full_name || "",
    });
    setEditingId(null);
  };

  const parseJson = (val: any, def: any = []) => {
    if (!val) return def;
    try { return typeof val === "string" ? JSON.parse(val) : val; } catch { return def; }
  };

  const formToInsert = (f: IpmFormData) => ({
    numero_ipm: f.numero_ipm,
    data_instauracao: f.data_instauracao,
    unidade: f.unidade,
    status: f.status,
    encarregado_nome: f.encarregado_nome,
    encarregado_posto: f.encarregado_posto,
    autoridade_nome: f.autoridade_nome,
    autoridade_posto: f.autoridade_posto,
    fundamentacao: f.fundamentacao,
    artigos_cpm: f.artigos_cpm,
    artigos_rdpm: f.artigos_rdpm,
    relatorio_fatos: f.relatorio_fatos,
    conclusao_parcial: f.conclusao_parcial,
    indiciados: f.indiciados,
    enquadramentos: f.enquadramentos,
    autor_id: user?.id || null,
    autor_nome: user?.user_metadata?.full_name || f.autoridade_nome,
  });

  const createIpm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setSubmitting(true);
    const { error } = await supabase.from("ipm").insert(formToInsert(form));
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("IPM criado!"); setDialogOpen(false); resetForm(); logAudit({ action: "create", entity_type: "ipm", entity_id: undefined, details: {} }); await loadIpms(); }
    setSubmitting(false);
  };

  const updateIpm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !editingId) return;
    setSubmitting(true);
    const existing = ipms.find(x => x.id === editingId);
    const data = formToInsert(form);
    let versoes: VersaoDocumento[] = parseJson(existing?.historico_versoes);
    versoes.unshift({
      id: crypto.randomUUID?.() || Date.now().toString(),
      data: new Date().toISOString(),
      autor: user?.user_metadata?.full_name || form.autoridade_nome,
      documento: existing?.relatorio_fatos || "",
      alteracoes: "Atualização do IPM",
    });
    (data as any).historico_versoes = versoes;
    delete (data as any).autor_id;
    delete (data as any).autor_nome;
    const { error } = await supabase.from("ipm").update(data).eq("id", editingId);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("IPM atualizado!"); setEditDialogOpen(false); setEditingId(null); resetForm(); logAudit({ action: "update", entity_type: "ipm", entity_id: editingId, details: { id: editingId } }); await loadIpms(); }
    setSubmitting(false);
  };

  const deleteIpm = async (id: string) => {
    if (!canDelete) { toast.error("Apenas admin pode excluir."); return; }
    const { error } = await supabase.from("ipm").delete().eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("IPM excluído!"); logAudit({ action: "delete", entity_type: "ipm", entity_id: editingId ?? undefined, details: { id: editingId } }); await loadIpms(); }
    setDeleteConfirmId(null);
  };

  const updateStatus = async (id: string, status: IpmStatus) => {
    const existing = ipms.find(x => x.id === id);
    let versoes: VersaoDocumento[] = parseJson(existing?.historico_versoes);
    versoes.unshift({ id: crypto.randomUUID?.() || Date.now().toString(), data: new Date().toISOString(), autor: user?.user_metadata?.full_name || "Sistema", documento: "", alteracoes: `Status: ${IPM_STATUS_LABEL[existing?.status || "em_andamento"]} → ${IPM_STATUS_LABEL[status]}`, tipo: "status" });
    const { error } = await supabase.from("ipm").update({ status, historico_versoes: versoes }).eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
    else { toast.success("Status atualizado!"); await loadIpms(); }
  };

  const duplicateIpm = async (ipm: Ipm) => {
    if (!canCreate) return;
    const { error } = await supabase.from("ipm").insert({
      ...formToInsert({
        numero_ipm: ipm.numero_ipm + "-copia",
        data_instauracao: format(new Date(), "yyyy-MM-dd"),
        unidade: ipm.unidade,
        status: "em_andamento",
        encarregado_nome: ipm.encarregado_nome,
        encarregado_posto: ipm.encarregado_posto,
        autoridade_nome: ipm.autoridade_nome,
        autoridade_posto: ipm.autoridade_posto,
        fundamentacao: ipm.fundamentacao,
        artigos_cpm: ipm.artigos_cpm,
        artigos_rdpm: ipm.artigos_rdpm,
        relatorio_fatos: ipm.relatorio_fatos,
        conclusao_parcial: ipm.conclusao_parcial,
        indiciados: parseJson(ipm.indiciados),
        enquadramentos: parseJson(ipm.enquadramentos),
      }),
      autor_id: user?.id || null,
      autor_nome: user?.user_metadata?.full_name || ipm.autoridade_nome,
    });
    if (error) toast.error("Erro ao duplicar: " + error.message);
    else { toast.success("IPM duplicado!"); await loadIpms(); }
  };

  const openDocPreview = (data: IpmFormData) => {
    setDocPreviewContent(generateIpmDoc(data, user?.user_metadata?.full_name, user?.user_metadata?.patente));
    setDocPreviewOpen(true);
  };

  const editIpm = (ipm: Ipm) => {
    setForm({
      numero_ipm: ipm.numero_ipm,
      data_instauracao: ipm.data_instauracao,
      unidade: ipm.unidade,
      status: ipm.status,
      encarregado_nome: ipm.encarregado_nome,
      encarregado_posto: ipm.encarregado_posto,
      autoridade_nome: ipm.autoridade_nome,
      autoridade_posto: ipm.autoridade_posto,
      fundamentacao: ipm.fundamentacao,
      artigos_cpm: ipm.artigos_cpm,
      artigos_rdpm: ipm.artigos_rdpm,
      relatorio_fatos: ipm.relatorio_fatos,
      conclusao_parcial: ipm.conclusao_parcial,
      indiciados: parseJson(ipm.indiciados),
      enquadramentos: parseJson(ipm.enquadramentos),
    });
    setEditingId(ipm.id);
    setEditDialogOpen(true);
  };

  const addIndiciado = () => {
    if (editingIndiciadoIdx !== null) {
      const updated = [...form.indiciados];
      updated[editingIndiciadoIdx] = { ...indiciadoForm, id: indiciadoForm.id || crypto.randomUUID?.() || Date.now().toString() };
      setForm(f => ({ ...f, indiciados: updated }));
    } else {
      setForm(f => ({ ...f, indiciados: [...f.indiciados, { ...indiciadoForm, id: crypto.randomUUID?.() || Date.now().toString() }] }));
    }
    setIndiciadoDialogOpen(false);
    setIndiciadoForm({ id: "", nome: "", posto_graduacao: "", rg_pm: "", unidade: "" });
    setEditingIndiciadoIdx(null);
  };

  const addEnquadramento = () => {
    if (editingEnqIdx !== null) {
      const updated = [...form.enquadramentos];
      updated[editingEnqIdx] = { ...enquadramentoForm, id: enquadramentoForm.id || crypto.randomUUID?.() || Date.now().toString() };
      setForm(f => ({ ...f, enquadramentos: updated }));
    } else {
      setForm(f => ({ ...f, enquadramentos: [...f.enquadramentos, { ...enquadramentoForm, id: crypto.randomUUID?.() || Date.now().toString() }] }));
    }
    setEnquadramentoDialogOpen(false);
    setEnquadramentoForm({ id: "", indiciado_nome: "", artigos_cpm: "", artigos_cppm: "", artigos_rdpm: "", observacoes: "" });
    setEditingEnqIdx(null);
  };

  const addVinculacao = () => {
    if (!vinculacaoDescricao.trim()) { toast.error("Informe a descrição"); return; }
    setForm(f => ({ ...f, vinculacoes: [...(f as any).vinculacoes || [], { tipo: vinculacaoTipo, id: crypto.randomUUID?.() || Date.now().toString(), descricao: vinculacaoDescricao }] }));
    setVinculacaoDescricao("");
    toast.success("Vinculação adicionada!");
  };

  const printDoc = (htmlContent: string) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(htmlContent);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const filteredIpms = ipms.filter(ipm => {
    const indiciados = parseJson(ipm.indiciados) as Indiciado[];
    const matchesSearch = !searchTerm ||
      ipm.numero_ipm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ipm.unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ipm.encarregado_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indiciados.some(i => i.nome?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === "todos" || ipm.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const renderForm = (isEdit: boolean) => (
    <div className="space-y-6">
      {/* DADOS GERAIS */}
      <section className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><FileSearch className="h-4 w-4" /> DADOS GERAIS DO IPM</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-semibold">Número do IPM *</Label>
            <Input value={form.numero_ipm} onChange={e => setForm(f => ({ ...f, numero_ipm: e.target.value }))} placeholder="Ex: 001" required />
          </div>
          <div>
            <Label className="text-xs font-semibold">Data de Instauração *</Label>
            <Input type="date" value={form.data_instauracao} onChange={e => setForm(f => ({ ...f, data_instauracao: e.target.value }))} required />
          </div>
          <div>
            <Label className="text-xs font-semibold">Unidade *</Label>
            <Input value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} placeholder="Unidade" required />
          </div>
          <div>
            <Label className="text-xs font-semibold">Status</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as IpmStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["em_andamento", "concluido", "arquivado"] as const).map(s => (
                  <SelectItem key={s} value={s}>{IPM_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ENCARREGADO */}
      <section className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><UserCheck className="h-4 w-4" /> ENCARREGADO DO IPM</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold">Nome Completo *</Label>
            <Input value={form.encarregado_nome} onChange={e => setForm(f => ({ ...f, encarregado_nome: e.target.value }))} placeholder="Nome do Encarregado" required />
          </div>
          <div>
            <Label className="text-xs font-semibold">Posto/Graduação *</Label>
            <Input value={form.encarregado_posto} onChange={e => setForm(f => ({ ...f, encarregado_posto: e.target.value }))} placeholder="Ex: Cel PM" required />
          </div>
        </div>
      </section>

      {/* INDICIADOS */}
      <section className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><Gavel className="h-4 w-4" /> INDICIADOS</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => { setIndiciadoForm({ id: "", nome: "", posto_graduacao: "", rg_pm: "", unidade: "" }); setEditingIndiciadoIdx(null); setIndiciadoDialogOpen(true); }} className="gap-1"><Plus className="h-3 w-3" /> Adicionar</Button>
        </div>
        <div className="p-4">
          {form.indiciados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum indiciado cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {form.indiciados.map((ind, idx) => (
                <div key={ind.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3 border border-border">
                  <div>
                    <p className="text-sm font-medium">{ind.posto_graduacao} {ind.nome}</p>
                    <p className="text-xs text-muted-foreground">RG PM: {ind.rg_pm} • {ind.unidade}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setIndiciadoForm(ind); setEditingIndiciadoIdx(idx); setIndiciadoDialogOpen(true); }}><Edit className="h-3 w-3" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setForm(f => ({ ...f, indiciados: f.indiciados.filter((_, i) => i !== idx) }))}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PORTARIA DE INSTAURAÇÃO */}
      <section className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><FileSignature className="h-4 w-4" /> PORTARIA DE INSTAURAÇÃO</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Autoridade Instauradora *</Label>
              <Input value={form.autoridade_nome} onChange={e => setForm(f => ({ ...f, autoridade_nome: e.target.value }))} placeholder="Nome da autoridade" required />
            </div>
            <div>
              <Label className="text-xs font-semibold">Posto/Graduação da Autoridade *</Label>
              <Input value={form.autoridade_posto} onChange={e => setForm(f => ({ ...f, autoridade_posto: e.target.value }))} placeholder="Ex: Cel PM" required />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold">Fundamentação</Label>
            <Textarea value={form.fundamentacao} onChange={e => setForm(f => ({ ...f, fundamentacao: e.target.value }))} placeholder="Fundamentação legal..." className="min-h-[60px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Artigos do CPM</Label>
              <Input value={form.artigos_cpm} onChange={e => setForm(f => ({ ...f, artigos_cpm: e.target.value }))} placeholder="Ex: Art. 187, 188" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Artigos do RDPM</Label>
              <Input value={form.artigos_rdpm} onChange={e => setForm(f => ({ ...f, artigos_rdpm: e.target.value }))} placeholder="Ex: Art. 12, 15" />
            </div>
          </div>
          <div className="bg-muted/20 border border-border rounded-lg p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">PRÉ-VISUALIZAÇÃO DA PORTARIA</p>
            <div className="bg-white rounded border border-border overflow-hidden" style={{ height: "400px" }}>
              <iframe
                srcDoc={generateIpmHtml(form, user?.user_metadata?.full_name, user?.user_metadata?.patente)}
                title="Pré-visualização"
                className="w-full border-0"
                style={{ height: "400px", transform: "scale(0.7)", transformOrigin: "top left", width: "143%" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* RELATÓRIO DOS FATOS */}
      <section className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><FileText className="h-4 w-4" /> RELATÓRIO DOS FATOS</h3>
        </div>
        <div className="p-4">
          <Textarea value={form.relatorio_fatos} onChange={e => setForm(f => ({ ...f, relatorio_fatos: e.target.value }))} placeholder="Descreva detalhadamente os fatos apurados..." className="min-h-[200px]" />
        </div>
      </section>

      {/* ENQUADRAMENTO LEGAL */}
      <section className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><Scale className="h-4 w-4" /> ENQUADRAMENTO LEGAL</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => { setEnquadramentoForm({ id: "", indiciado_nome: "", artigos_cpm: "", artigos_cppm: "", artigos_rdpm: "", observacoes: "" }); setEditingEnqIdx(null); setEnquadramentoDialogOpen(true); }} className="gap-1"><Plus className="h-3 w-3" /> Adicionar</Button>
        </div>
        <div className="p-4">
          {form.enquadramentos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum enquadramento legal registrado.</p>
          ) : (
            <div className="space-y-2">
              {form.enquadramentos.map((enq, idx) => (
                <div key={enq.id} className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
                  <div className="flex items-start justify-between">
                    <div className="text-sm">
                      <p className="font-medium">{enq.indiciado_nome}</p>
                      <p className="text-xs text-muted-foreground mt-1">CPM: {enq.artigos_cpm} | CPPM: {enq.artigos_cppm} | RDPM: {enq.artigos_rdpm}</p>
                      {enq.observacoes && <p className="text-xs text-muted-foreground mt-1">{enq.observacoes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEnquadramentoForm(enq); setEditingEnqIdx(idx); setEnquadramentoDialogOpen(true); }}><Edit className="h-3 w-3" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setForm(f => ({ ...f, enquadramentos: f.enquadramentos.filter((_, i) => i !== idx) }))}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CONCLUSÃO PARCIAL */}
      <section className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><ArrowRight className="h-4 w-4" /> CONCLUSÃO PARCIAL</h3>
        </div>
        <div className="p-4">
          <Textarea value={form.conclusao_parcial} onChange={e => setForm(f => ({ ...f, conclusao_parcial: e.target.value }))} placeholder="Conclusão parcial do inquérito..." className="min-h-[150px]" />
        </div>
      </section>

      {/* AÇÕES */}
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={() => openDocPreview(form)} className="gap-2"><Eye className="h-4 w-4" /> Visualizar Documento</Button>
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
          {submitting ? "Salvando..." : (isEdit ? "Salvar Alterações" : "Criar IPM")}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return <div className="p-4 space-y-4"><Skeleton className="h-10 w-60" /><Skeleton className="h-48" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
          <Gavel className="h-5 w-5" /> Inquéritos Policiais Militares
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar IPM, unidade, encarregado, indiciado..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-8 text-xs" />
            {searchTerm && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer text-muted-foreground" onClick={() => setSearchTerm("")} />}
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {(["em_andamento", "concluido", "arquivado"] as const).map(s => (
                <SelectItem key={s} value={s}>{IPM_STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canCreate && (
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="sm" className="gap-1 text-xs">
              <Plus className="h-3 w-3" /> Novo IPM
            </Button>
          )}
        </div>
      </div>

      {filteredIpms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Nenhum IPM encontrado.</p>
          {canCreate && <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(true); }} className="mt-3 gap-2"><Plus className="h-4 w-4" /> Criar primeiro IPM</Button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIpms.map(ipm => {
            const indiciados = parseJson(ipm.indiciados) as Indiciado[];
            const enquadramentos = parseJson(ipm.enquadramentos) as Enquadramento[];
            const isExpanded = expandedId === ipm.id;
            return (
              <div key={ipm.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 flex items-start justify-between cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedId(isExpanded ? null : ipm.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={IPM_STATUS_COLOR[ipm.status]}>{IPM_STATUS_LABEL[ipm.status]}</Badge>
                      <span className="text-xs font-mono font-bold text-primary">IPM nº {ipm.numero_ipm}</span>
                    </div>
                    <p className="text-sm font-semibold">Encarregado: {ipm.encarregado_posto} {ipm.encarregado_nome}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span>Unidade: {ipm.unidade}</span>
                      <span>Instauração: {format(new Date(ipm.data_instauracao), "dd/MM/yyyy")}</span>
                      <span>Indiciados: {indiciados.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    {canEdit && <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={e => { e.stopPropagation(); editIpm(ipm); }}><Edit className="h-4 w-4" /></Button>}
                    {canCreate && <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicar" onClick={e => { e.stopPropagation(); duplicateIpm(ipm); }}><Copy className="h-4 w-4" /></Button>}
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Documento" onClick={e => {
                      e.stopPropagation();
                      openDocPreview({
                        numero_ipm: ipm.numero_ipm,
                        data_instauracao: ipm.data_instauracao,
                        unidade: ipm.unidade,
                        status: ipm.status,
                        encarregado_nome: ipm.encarregado_nome,
                        encarregado_posto: ipm.encarregado_posto,
                        autoridade_nome: ipm.autoridade_nome,
                        autoridade_posto: ipm.autoridade_posto,
                        fundamentacao: ipm.fundamentacao,
                        artigos_cpm: ipm.artigos_cpm,
                        artigos_rdpm: ipm.artigos_rdpm,
                        relatorio_fatos: ipm.relatorio_fatos,
                        conclusao_parcial: ipm.conclusao_parcial,
                        indiciados,
                        enquadramentos,
                      });
                    }}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Histórico" onClick={e => { e.stopPropagation(); /* open history */ toast.info("Histórico disponível ao editar"); }}><History className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Imprimir" onClick={e => {
                      e.stopPropagation();
                      printDoc(generateIpmDoc({
                        numero_ipm: ipm.numero_ipm,
                        data_instauracao: ipm.data_instauracao,
                        unidade: ipm.unidade,
                        status: ipm.status,
                        encarregado_nome: ipm.encarregado_nome,
                        encarregado_posto: ipm.encarregado_posto,
                        autoridade_nome: ipm.autoridade_nome,
                        autoridade_posto: ipm.autoridade_posto,
                        fundamentacao: ipm.fundamentacao,
                        artigos_cpm: ipm.artigos_cpm,
                        artigos_rdpm: ipm.artigos_rdpm,
                        relatorio_fatos: ipm.relatorio_fatos,
                        conclusao_parcial: ipm.conclusao_parcial,
                        indiciados,
                        enquadramentos,
                      }, user?.user_metadata?.full_name, user?.user_metadata?.patente));
                    }}><Printer className="h-4 w-4" /></Button>
                    {canDelete && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir" onClick={e => { e.stopPropagation(); setDeleteConfirmId(ipm.id); }}><Trash2 className="h-4 w-4" /></Button>}
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-border p-4 bg-muted/20 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div><p className="text-[10px] font-bold uppercase text-muted-foreground">IPM</p><p className="text-sm font-medium">IPM nº {ipm.numero_ipm}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Encarregado</p><p className="text-sm font-medium">{ipm.encarregado_posto} {ipm.encarregado_nome}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Data</p><p className="text-sm font-medium">{format(new Date(ipm.data_instauracao), "dd/MM/yyyy")}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Unidade</p><p className="text-sm font-medium">{ipm.unidade}</p></div>
                    </div>

                    {indiciados.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold uppercase text-muted-foreground mb-2">Indiciados</h5>
                        <div className="space-y-1">
                          {indiciados.map(ind => (
                            <div key={ind.id} className="text-xs p-2 bg-muted/30 rounded flex items-center gap-3 border border-border">
                              <Gavel className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="font-medium">{ind.posto_graduacao} {ind.nome}</span>
                              <span className="text-muted-foreground">RG: {ind.rg_pm}</span>
                              <span className="text-muted-foreground">{ind.unidade}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-xs font-bold uppercase text-muted-foreground mb-1">Portaria de Instauração</h5>
                        <pre className="text-xs font-mono bg-muted p-3 rounded-lg whitespace-pre-wrap border border-border max-h-40 overflow-y-auto">{PORTARIA_TEMPLATE({
                          numero_ipm: ipm.numero_ipm,
                          data_instauracao: ipm.data_instauracao,
                          unidade: ipm.unidade,
                          status: ipm.status,
                          encarregado_nome: ipm.encarregado_nome,
                          encarregado_posto: ipm.encarregado_posto,
                          autoridade_nome: ipm.autoridade_nome,
                          autoridade_posto: ipm.autoridade_posto,
                          fundamentacao: ipm.fundamentacao,
                          artigos_cpm: ipm.artigos_cpm,
                          artigos_rdpm: ipm.artigos_rdpm,
                          relatorio_fatos: ipm.relatorio_fatos,
                          conclusao_parcial: ipm.conclusao_parcial,
                          indiciados,
                          enquadramentos,
                        }, user?.user_metadata?.full_name, user?.user_metadata?.patente)}</pre>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold uppercase text-muted-foreground mb-1">Conclusão</h5>
                        <pre className="text-xs font-mono bg-muted p-3 rounded-lg whitespace-pre-wrap border border-border max-h-40 overflow-y-auto">{ipm.conclusao_parcial || "(Aguardando conclusão)"}</pre>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Select value={ipm.status} onValueChange={v => updateStatus(ipm.id, v as IpmStatus)}>
                        <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["em_andamento", "concluido", "arquivado"] as const).map(s => (
                            <SelectItem key={s} value={s}>{IPM_STATUS_LABEL[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* DENÚNCIAS VINCULADAS */}
                    <div className="rounded border border-border bg-muted p-4">
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <Activity className="h-4 w-4" /> Denúncias Vinculadas
                      </div>
                      {(() => {
                        const linked = ipmVinculos
                          .filter(v => v.ipm_id === ipm.id && v.entidade_tipo === "denuncia")
                          .map(v => ({ vinculo: v, entidade: denuncias.find(d => d.id === v.entidade_id) }))
                          .filter((x): x is { vinculo: any; entidade: any } => !!x.entidade);
                        const available = denuncias.filter(d => !ipmVinculos.some(v => v.ipm_id === ipm.id && v.entidade_id === d.id && v.entidade_tipo === "denuncia"));
                        return (
                          <>
                            {linked.length > 0 ? (
                              <div className="space-y-2 mb-3">
                                {linked.map(({ vinculo, entidade }) => (
                                  <div key={vinculo.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                    <div className="flex items-center gap-3">
                                      <Activity className="h-4 w-4 text-foreground shrink-0" />
                                      <span className="text-foreground font-bold">{entidade.titulo}</span>
                                      <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">Denúncia</Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                        onClick={() => handleUnlinkIpm(vinculo.id)} title="Desanexar">
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mb-3">Nenhuma denúncia vinculada.</p>
                            )}
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <Select value={denunciaLinkId} onValueChange={setDenunciaLinkId}>
                                  <SelectTrigger className="bg-muted border-border text-foreground text-xs">
                                    <SelectValue placeholder="Vincular denúncia..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-muted border-border text-foreground">
                                    {available.map(d => (
                                      <SelectItem key={d.id} value={d.id}>{d.titulo}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button size="sm" onClick={() => handleLinkIpm(ipm.id, denunciaLinkId, "denuncia")}
                                disabled={parentLinking || !denunciaLinkId} className="bg-card hover:bg-slate-700 text-white text-xs">
                                {parentLinking ? "Vinculando..." : "Vincular"}
                              </Button>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* INVESTIGAÇÕES VINCULADAS */}
                    <div className="rounded border border-border bg-muted p-4">
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <Shield className="h-4 w-4" /> Investigações Vinculadas
                      </div>
                      {(() => {
                        const linked = ipmVinculos
                          .filter(v => v.ipm_id === ipm.id && v.entidade_tipo === "investigacao")
                          .map(v => ({ vinculo: v, entidade: investigacoes.find(i => i.id === v.entidade_id) }))
                          .filter((x): x is { vinculo: any; entidade: any } => !!x.entidade);
                        const available = investigacoes.filter(i => !ipmVinculos.some(v => v.ipm_id === ipm.id && v.entidade_id === i.id && v.entidade_tipo === "investigacao"));
                        return (
                          <>
                            {linked.length > 0 ? (
                              <div className="space-y-2 mb-3">
                                {linked.map(({ vinculo, entidade }) => (
                                  <div key={vinculo.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                    <div className="flex items-center gap-3">
                                      <Shield className="h-4 w-4 text-foreground shrink-0" />
                                      <span className="text-foreground font-bold">{entidade.titulo}</span>
                                      <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">Investigação</Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                        onClick={() => handleUnlinkIpm(vinculo.id)} title="Desanexar">
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mb-3">Nenhuma investigação vinculada.</p>
                            )}
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <Select value={investigacaoLinkId} onValueChange={setInvestigacaoLinkId}>
                                  <SelectTrigger className="bg-muted border-border text-foreground text-xs">
                                    <SelectValue placeholder="Vincular investigação..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-muted border-border text-foreground">
                                    {available.map(i => (
                                      <SelectItem key={i.id} value={i.id}>{i.titulo}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button size="sm" onClick={() => handleLinkIpm(ipm.id, investigacaoLinkId, "investigacao")}
                                disabled={parentLinking || !investigacaoLinkId} className="bg-card hover:bg-slate-700 text-white text-xs">
                                {parentLinking ? "Vinculando..." : "Vincular"}
                              </Button>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* ATOS ADMINISTRATIVOS VINCULADOS */}
                    <div className="rounded border border-border bg-muted p-4">
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <FileText className="h-4 w-4" /> Atos Administrativos Vinculados
                      </div>
                      {(() => {
                        const atos = relatorios.filter(r => r.tipo_denuncia === "Ato Administrativo");
                        const linked = ipmVinculos
                          .filter(v => v.ipm_id === ipm.id && v.entidade_tipo === "relatorio")
                          .map(v => ({ vinculo: v, entidade: relatorios.find(r => r.id === v.entidade_id && r.tipo_denuncia === "Ato Administrativo") }))
                          .filter((x): x is { vinculo: any; entidade: any } => !!x.entidade);
                        const available = atos.filter(r => !ipmVinculos.some(v => v.ipm_id === ipm.id && v.entidade_id === r.id && v.entidade_tipo === "relatorio"));
                        return (
                          <>
                            {linked.length > 0 ? (
                              <div className="space-y-2 mb-3">
                                {linked.map(({ vinculo, entidade }) => (
                                  <div key={vinculo.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-4 w-4 text-foreground shrink-0" />
                                      <span className="text-foreground font-bold">{entidade.titulo}</span>
                                      <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">Ato Administrativo</Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                        onClick={() => handleUnlinkIpm(vinculo.id)} title="Desanexar">
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mb-3">Nenhum ato administrativo vinculado.</p>
                            )}
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <Select value={atoLinkId} onValueChange={setAtoLinkId}>
                                  <SelectTrigger className="bg-muted border-border text-foreground text-xs">
                                    <SelectValue placeholder="Vincular ato..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-muted border-border text-foreground">
                                    {available.map(r => (
                                      <SelectItem key={r.id} value={r.id}>{r.titulo}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button size="sm" onClick={() => handleLinkIpm(ipm.id, atoLinkId, "relatorio")}
                                disabled={parentLinking || !atoLinkId} className="bg-card hover:bg-slate-700 text-white text-xs">
                                {parentLinking ? "Vinculando..." : "Vincular"}
                              </Button>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* DEPOIMENTOS VINCULADOS */}
                    <div className="rounded border border-border bg-muted p-4">
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <MessageSquare className="h-4 w-4" /> Depoimentos Vinculados
                      </div>
                      {(() => {
                        const linked = ipmVinculos
                          .filter(v => v.ipm_id === ipm.id && v.entidade_tipo === "depoimento")
                          .map(v => ({ vinculo: v, entidade: depoimentos.find(d => d.id === v.entidade_id) }))
                          .filter((x): x is { vinculo: any; entidade: any } => !!x.entidade);
                        const available = depoimentos.filter(d => !ipmVinculos.some(v => v.ipm_id === ipm.id && v.entidade_id === d.id && v.entidade_tipo === "depoimento"));
                        return (
                          <>
                            {linked.length > 0 ? (
                              <div className="space-y-2 mb-3">
                                {linked.map(({ vinculo, entidade }) => (
                                  <div key={vinculo.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm border border-border">
                                    <div className="flex items-center gap-3">
                                      <MessageSquare className="h-4 w-4 text-foreground shrink-0" />
                                      <span className="text-foreground font-bold">{entidade.oficial_nome || entidade.titulo || entidade.id}</span>
                                      <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground">Depoimento</Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                        onClick={() => handleUnlinkIpm(vinculo.id)} title="Desanexar">
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mb-3">Nenhum depoimento vinculado.</p>
                            )}
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <Select value={depoimentoLinkId} onValueChange={setDepoimentoLinkId}>
                                  <SelectTrigger className="bg-muted border-border text-foreground text-xs">
                                    <SelectValue placeholder="Vincular depoimento..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-muted border-border text-foreground">
                                    {available.map(d => (
                                      <SelectItem key={d.id} value={d.id}>{d.oficial_nome} - {d.data_depoimento ? format(new Date(d.data_depoimento), "dd/MM/yyyy") : ""}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button size="sm" onClick={() => handleLinkIpm(ipm.id, depoimentoLinkId, "depoimento")}
                                disabled={parentLinking || !depoimentoLinkId} className="bg-card hover:bg-slate-700 text-white text-xs">
                                {parentLinking ? "Vinculando..." : "Vincular"}
                              </Button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Gavel className="h-5 w-5" /> Novo IPM</DialogTitle><DialogDescription>Preencha os dados para instaurar o Inquérito Policial Militar.</DialogDescription></DialogHeader>
          <form onSubmit={createIpm}>{renderForm(false)}</form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5" /> Editar IPM</DialogTitle><DialogDescription>Altere os dados do IPM. Versões anteriores serão preservadas.</DialogDescription></DialogHeader>
          <form onSubmit={updateIpm}>{renderForm(true)}</form>
        </DialogContent>
      </Dialog>

      {/* Indiciado Dialog */}
      <Dialog open={indiciadoDialogOpen} onOpenChange={setIndiciadoDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingIndiciadoIdx !== null ? "Editar" : "Adicionar"} Indiciado</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nome Completo</Label><Input value={indiciadoForm.nome} onChange={e => setIndiciadoForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div><Label className="text-xs">Posto/Graduação</Label><Input value={indiciadoForm.posto_graduacao} onChange={e => setIndiciadoForm(f => ({ ...f, posto_graduacao: e.target.value }))} /></div>
            <div><Label className="text-xs">RG PM</Label><Input value={indiciadoForm.rg_pm} onChange={e => setIndiciadoForm(f => ({ ...f, rg_pm: e.target.value }))} /></div>
            <div><Label className="text-xs">Unidade</Label><Input value={indiciadoForm.unidade} onChange={e => setIndiciadoForm(f => ({ ...f, unidade: e.target.value }))} /></div>
            <Button onClick={addIndiciado} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enquadramento Dialog */}
      <Dialog open={enquadramentoDialogOpen} onOpenChange={setEnquadramentoDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingEnqIdx !== null ? "Editar" : "Adicionar"} Enquadramento Legal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nome do Indiciado</Label><Input value={enquadramentoForm.indiciado_nome} onChange={e => setEnquadramentoForm(f => ({ ...f, indiciado_nome: e.target.value }))} /></div>
            <div><Label className="text-xs">Artigos do CPM</Label><Input value={enquadramentoForm.artigos_cpm} onChange={e => setEnquadramentoForm(f => ({ ...f, artigos_cpm: e.target.value }))} /></div>
            <div><Label className="text-xs">Artigos do CPPM</Label><Input value={enquadramentoForm.artigos_cppm} onChange={e => setEnquadramentoForm(f => ({ ...f, artigos_cppm: e.target.value }))} /></div>
            <div><Label className="text-xs">Artigos do RDPM</Label><Input value={enquadramentoForm.artigos_rdpm} onChange={e => setEnquadramentoForm(f => ({ ...f, artigos_rdpm: e.target.value }))} /></div>
            <div><Label className="text-xs">Observações</Label><Textarea value={enquadramentoForm.observacoes} onChange={e => setEnquadramentoForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
            <Button onClick={addEnquadramento} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={docPreviewOpen} onOpenChange={setDocPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Documento do IPM</DialogTitle></DialogHeader>
          <div className="bg-white text-black rounded-lg overflow-hidden border" style={{ minHeight: "800px" }}>
            <iframe
              srcDoc={docPreviewContent}
              title="Pré-visualização IPM"
              className="w-full border-0"
              style={{ minHeight: "800px" }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => printDoc(docPreviewContent)} className="gap-2"><Printer className="h-4 w-4" /> Imprimir</Button>
            <Button variant="outline" onClick={() => {
              const blob = new Blob([docPreviewContent], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `IPM_documento.html`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Documento exportado!");
            }} className="gap-2"><FileText className="h-4 w-4" /> Exportar HTML</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)} title="Excluir IPM" description="Tem certeza? Esta ação não pode ser desfeita." onConfirm={() => deleteConfirmId && deleteIpm(deleteConfirmId)} />
    </div>
  );
}
