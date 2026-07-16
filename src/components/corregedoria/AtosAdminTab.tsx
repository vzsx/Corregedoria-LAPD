import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Eye, Printer, Plus, Search, FileText, Filter, Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { logAudit } from "@/lib/audit-log";
import { supabase } from "@/integrations/supabase/client";
import { BRASAO_SP_LOGO, PM_LOGO } from "./ipm-logos";
import { PMESP_WATERMARK } from "./pmesp-watermark";

export interface AtosAdmin {
  id: string;
  numero_ato: string;
  data_emissao: string;
  denuncia_id: string | null;
  numero_referencia: string;
  ipm_id: string | null;
  ipm_numero: string;
  nome_policial: string;
  posto_graduacao: string;
  rg_pm: string;
  medidas: string[];
  data_inicio_suspensao: string | null;
  data_fim_suspensao: string | null;
  horas_guarita: number | null;
  horas_base_comunitaria: number | null;
  horas_prisao_disciplinar: number | null;
  responsavel_nome: string;
  responsavel_posto: string;
  created_at: string;
  updated_at: string;
}

interface AtosAdminTabProps {
  atos: AtosAdmin[];
  setAtos: React.Dispatch<React.SetStateAction<AtosAdmin[]>>;
  denuncias: any[];
  ipms: any[];
}

const MEDIDAS_OPTIONS = [
  "Advertência",
  "Suspensão",
  "Serviço de Guarita",
  "Serviço de Base Comunitária",
  "Prisão Disciplinar Militar",
  "Exclusão da Corporação",
];

const CONSIDERANDOS = [
  "CONSIDERANDO a conclusão do Inquérito Policial Militar e a existência de provas suficientes da prática de infração disciplinar;",
  "CONSIDERANDO que o(a) militar apontado(a) como responsável incorreu em conduta irregular em serviço, conforme apurado nos autos do IPM;",
  "CONSIDERANDO a necessidade de aplicação de sanção disciplinar para preservação da disciplina e da hierarquia militar;",
];

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatMedidasHtml(medidas: string[], data: AtosAdmin): string {
  return medidas.map(m => {
    if (m === "Advertência") return "* Advertência";
    if (m === "Suspensão" && data.data_inicio_suspensao && data.data_fim_suspensao) {
      const di = format(parseLocalDate(data.data_inicio_suspensao), "dd/MM/yyyy", { locale: ptBR });
      const df = format(parseLocalDate(data.data_fim_suspensao), "dd/MM/yyyy", { locale: ptBR });
      return `* Suspensão de ${di} até ${df}`;
    }
    if (m === "Serviço de Guarita" && data.horas_guarita) return `* Serviço de Guarita por ${data.horas_guarita} horas`;
    if (m === "Serviço de Base Comunitária" && data.horas_base_comunitaria) return `* Serviço de Base Comunitária por ${data.horas_base_comunitaria} horas`;
    if (m === "Prisão Disciplinar Militar" && data.horas_prisao_disciplinar) return `* Prisão Disciplinar Militar por ${data.horas_prisao_disciplinar} horas`;
    if (m === "Exclusão da Corporação") return "* Exclusão da Corporação";
    return `* ${m}`;
  }).join("<br>");
}

function formatMedidasText(medidas: string[], data: AtosAdmin): string {
  return medidas.map(m => {
    if (m === "Advertência") return "* Advertência";
    if (m === "Suspensão" && data.data_inicio_suspensao && data.data_fim_suspensao) {
      const di = format(parseLocalDate(data.data_inicio_suspensao), "dd/MM/yyyy", { locale: ptBR });
      const df = format(parseLocalDate(data.data_fim_suspensao), "dd/MM/yyyy", { locale: ptBR });
      return `* Suspensão de ${di} até ${df}`;
    }
    if (m === "Serviço de Guarita" && data.horas_guarita) return `* Serviço de Guarita por ${data.horas_guarita} horas`;
    if (m === "Serviço de Base Comunitária" && data.horas_base_comunitaria) return `* Serviço de Base Comunitária por ${data.horas_base_comunitaria} horas`;
    if (m === "Prisão Disciplinar Militar" && data.horas_prisao_disciplinar) return `* Prisão Disciplinar Militar por ${data.horas_prisao_disciplinar} horas`;
    if (m === "Exclusão da Corporação") return "* Exclusão da Corporação";
    return `* ${m}`;
  }).join("\n");
}

function generateAtoHtml(a: AtosAdmin): string {
  const dataFormatada = format(parseLocalDate(a.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const ano = new Date(a.data_emissao).getFullYear();
  const numeroFormatado = a.numero_ato.padStart(4, "0");
  const medidasHtml = formatMedidasHtml(a.medidas, a);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style type="text/css">
@import url('https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap');
@page { size: A4 portrait; margin: 3cm 2cm 3cm 2cm; }
*{box-sizing:border-box}
body{margin:0;padding:0}
p{margin:0 0 8pt 0;color:#000;font-size:11pt;font-family:"Arial",sans-serif;line-height:1.15;text-align:justify;overflow-wrap:break-word}
.c3{padding:0;margin:0;line-height:1.15;text-align:center}
.c4{color:#000;font-weight:700;font-size:11pt;font-family:"Arial",sans-serif}
.c7{font-weight:700}
.c1{padding:0;margin:0 0 8pt 0;line-height:1.15;text-align:justify}
.c14{padding:0;margin:0 0 8pt 0;line-height:1.15;text-align:center}
.doc-content{position:relative;background:#fff;max-width:160mm;margin:0 auto;padding:72pt}
table td,table th{padding:0}
img{max-width:100%}
.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.08;pointer-events:none;z-index:0;width:15.9cm;height:13.5cm;object-fit:contain}
.doc-content > *:not(.watermark){position:relative;z-index:1}
.signature-block{page-break-inside:avoid}
.signature-name{font-family:'Pinyon Script',cursive;font-size:30pt;color:#000;font-weight:400;line-height:1}
.signature-line{display:inline-block;border-bottom:1px solid #000;width:46mm;height:1pt}
@media print{.doc-content{max-width:none;padding:0}}
</style>
</head>
<body>
<div class="doc-content">
  <img class="watermark" src="${PMESP_WATERMARK}" alt="">

  <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
    <tr>
      <td style="width:80px;vertical-align:middle;padding:0;text-align:center;">
        <img src="${BRASAO_SP_LOGO}" style="width:75px;height:auto;">
      </td>
      <td style="vertical-align:middle;padding:0 8px;text-align:center;">
        <p class="c3"><span class="c4">GOVERNO DO ESTADO DE SÃO PAULO</span></p>
        <p class="c3"><span class="c4">SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA</span></p>
        <p class="c3"><span class="c4">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</span></p>
        <p class="c3"><span class="c4">QUARTEL DA CORREGEDORIA-GERAL DA POLÍCIA MILITAR</span></p>
      </td>
      <td style="width:92px;vertical-align:middle;padding:0;text-align:center;">
        <img src="${PM_LOGO}" style="width:88px;height:auto;">
      </td>
    </tr>
  </table>

  <p class="c14" style="margin-top:24pt;"><span class="c4">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</span></p>
  <p class="c14"><span class="c4">CORREGEDORIA DA POLÍCIA MILITAR</span></p>

  <p class="c14" style="margin-top:20pt;"><span class="c4">ATO DE APLICAÇÃO DE SANÇÃO DISCIPLINAR Nº ${numeroFormatado}/${String(ano).slice(2)}</span></p>

  <p class="c1"><span class="c4">A CORREGEDORIA DA POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</span>, no uso de suas atribuições administrativas e disciplinares, após a conclusão do procedimento regularmente instaurado,</p>

  ${CONSIDERANDOS.map(c => `<p class="c1"><span class="c4">${c}</span></p>`).join("\n\n  ")}

  <p class="c1"><span class="c4 c7">RESOLVE:</span></p>

  <p class="c1"><span class="c4 c7">Art. 1º</span><span class="c4"> Aplicar ao policial militar abaixo identificado a sanção disciplinar decorrente da apuração realizada no Inquérito Policial Militar nº ${a.ipm_numero}.</span></p>

  <p class="c1"><span class="c4 c7">Policial Militar:</span><span class="c4"> ${a.nome_policial}</span></p>
  <p class="c1"><span class="c4 c7">Posto/Graduação:</span><span class="c4"> ${a.posto_graduacao}</span></p>
  <p class="c1"><span class="c4 c7">R.E:</span><span class="c4"> ${a.rg_pm}</span></p>

  <p class="c1"><span class="c4 c7">Art. 2º</span><span class="c4"> A sanção disciplinar aplicada é a seguinte:<br><br>${medidasHtml}.</span></p>

  <p class="c1"><span class="c4 c7">Art. 3º</span><span class="c4"> A aplicação da sanção fundamenta-se nas provas produzidas durante a instrução do procedimento, observada a gravidade da conduta, os antecedentes funcionais, as circunstâncias do fato e os princípios da proporcionalidade e da razoabilidade.</span></p>
  <p class="c1"><span class="c4 c7">Art. 4º</span><span class="c4"> A sanção produzirá efeitos a partir da data estabelecida neste ato, sem prejuízo dos recursos administrativos cabíveis previstos na regulamentação disciplinar.</span></p>
  <p class="c1"><span class="c4 c7">Art. 5º</span><span class="c4"> Cientifique-se o interessado, procedam-se às anotações administrativas pertinentes e arquivem-se os autos após o cumprimento das determinações constantes neste ato.</span></p>

  <p class="c1"><span class="c4 c7">Publique-se.</span></p>
  <p class="c1"><span class="c4 c7">Registre-se.</span></p>
  <p class="c1"><span class="c4 c7">Cumpra-se.</span></p>

  <div class="signature-block" style="margin-top:30pt;text-align:center;">
    <p class="c14" style="margin:0 0 18pt 0;">
      <span class="c4">São Paulo, ${dataFormatada}.</span>
    </p>
    <p class="c14" style="margin:0 0 6pt 0;line-height:1;">
      ${a.responsavel_nome ? `<span class="signature-name">${a.responsavel_nome}</span>` : `<span class="signature-line"></span>`}
    </p>
    <p class="c14" style="margin:0;line-height:1;">
      <span class="c4">${a.responsavel_posto ? `${a.responsavel_posto} ` : ""}${a.responsavel_nome || ""}</span>
    </p>
    <p class="c14" style="margin:2pt 0 0 0;">
      <span class="c4" style="font-size:11pt;">Corregedor(a) da Polícia Militar</span>
    </p>
  </div>
</div>
</body>
</html>`;
}

function generateAtoText(a: AtosAdmin): string {
  const dataFormatada = format(parseLocalDate(a.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const ano = new Date(a.data_emissao).getFullYear();
  const numeroFormatado = a.numero_ato.padStart(4, "0");
  const medidasText = formatMedidasText(a.medidas, a);

  return [
    `GOVERNO DO ESTADO DE SÃO PAULO`,
    `SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA`,
    `POLÍCIA MILITAR DO ESTADO DE SÃO PAULO`,
    `QUARTEL DA CORREGEDORIA-GERAL DA POLÍCIA MILITAR`,
    ``,
    `POLÍCIA MILITAR DO ESTADO DE SÃO PAULO`,
    `CORREGEDORIA DA POLÍCIA MILITAR`,
    ``,
    `ATO DE APLICAÇÃO DE SANÇÃO DISCIPLINAR Nº ${numeroFormatado}/${String(ano).slice(2)}`,
    ``,
    `A CORREGEDORIA DA POLÍCIA MILITAR DO ESTADO DE SÃO PAULO, no uso de suas atribuições administrativas e disciplinares, após a conclusão do procedimento regularmente instaurado,`,
    ``,
    ...CONSIDERANDOS,
    ``,
    `RESOLVE:`,
    ``,
    `Art. 1º Aplicar ao policial militar abaixo identificado a sanção disciplinar decorrente da apuração realizada no Inquérito Policial Militar nº ${a.ipm_numero}.`,
    ``,
    `Policial Militar: ${a.nome_policial}`,
    `Posto/Graduação: ${a.posto_graduacao}`,
    `R.E: ${a.rg_pm}`,
    ``,
    `Art. 2º A sanção disciplinar aplicada é a seguinte:`,
    ...a.medidas.map(m => {
      if (m === "Advertência") return "* Advertência";
      if (m === "Suspensão" && a.data_inicio_suspensao && a.data_fim_suspensao) {
        const di = format(parseLocalDate(a.data_inicio_suspensao), "dd/MM/yyyy", { locale: ptBR });
        const df = format(parseLocalDate(a.data_fim_suspensao), "dd/MM/yyyy", { locale: ptBR });
        return `* Suspensão de ${di} até ${df}`;
      }
      if (m === "Serviço de Guarita" && a.horas_guarita) return `* Serviço de Guarita por ${a.horas_guarita} horas`;
      if (m === "Serviço de Base Comunitária" && a.horas_base_comunitaria) return `* Serviço de Base Comunitária por ${a.horas_base_comunitaria} horas`;
      if (m === "Prisão Disciplinar Militar" && a.horas_prisao_disciplinar) return `* Prisão Disciplinar Militar por ${a.horas_prisao_disciplinar} horas`;
      if (m === "Exclusão da Corporação") return "* Exclusão da Corporação";
      return `* ${m}`;
    }),
    ``,
    `Art. 3º A aplicação da sanção fundamenta-se nas provas produzidas durante a instrução do procedimento, observada a gravidade da conduta, os antecedentes funcionais, as circunstâncias do fato e os princípios da proporcionalidade e da razoabilidade.`,
    ``,
    `Art. 4º A sanção produzirá efeitos a partir da data estabelecida neste ato, sem prejuízo dos recursos administrativos cabíveis previstos na regulamentação disciplinar.`,
    ``,
    `Art. 5º Cientifique-se o interessado, procedam-se às anotações administrativas pertinentes e arquivem-se os autos após o cumprimento das determinações constantes neste ato.`,
    ``,
    `Publique-se.`,
    `Registre-se.`,
    `Cumpra-se.`,
    ``,
    `São Paulo, ${dataFormatada}.`,
    ``,
    `${a.responsavel_nome || ""}`,
    `${a.responsavel_posto ? `${a.responsavel_posto} ` : ""}${a.responsavel_nome || ""}`,
    `Corregedor(a) da Polícia Militar`,
  ].join("\n");
}

export function AtosAdminTab({ atos, setAtos, denuncias, ipms }: AtosAdminTabProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMedida, setFilterMedida] = useState<string>("todos");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<AtosAdmin | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultForm = useMemo(() => ({
    numero_ato: "",
    data_emissao: format(new Date(), "yyyy-MM-dd"),
    denuncia_id: "",
    numero_referencia: "",
    ipm_id: "",
    ipm_numero: "",
    nome_policial: "",
    posto_graduacao: "",
    rg_pm: "",
    medidas: [] as string[],
    data_inicio_suspensao: "",
    data_fim_suspensao: "",
    horas_guarita: "",
    horas_base_comunitaria: "",
    horas_prisao_disciplinar: "",
    responsavel_nome: user?.user_metadata?.full_name || "",
    responsavel_posto: user?.user_metadata?.patente || "",
  }), [user]);

  const [form, setForm] = useState(defaultForm);

  const filtered = useMemo(() => {
    return atos.filter(a => {
      const matchesSearch = !searchTerm ||
        a.numero_ato.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.nome_policial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.numero_referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.ipm_numero.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMedida = filterMedida === "todos" || a.medidas.includes(filterMedida);
      return matchesSearch && matchesMedida;
    });
  }, [atos, searchTerm, filterMedida]);

  const stats = useMemo(() => ({
    total: atos.length,
    comMedidas: atos.filter(a => a.medidas.length > 0).length,
    suspensao: atos.filter(a => a.medidas.includes("Suspensão")).length,
    advertencia: atos.filter(a => a.medidas.includes("Advertência")).length,
    prisao: atos.filter(a => a.medidas.includes("Prisão Disciplinar Militar")).length,
    exclusao: atos.filter(a => a.medidas.includes("Exclusão da Corporação")).length,
    garantia: atos.filter(a => a.medidas.includes("Serviço de Guarita")).length,
    baseComunitaria: atos.filter(a => a.medidas.includes("Serviço de Base Comunitária")).length,
  }), [atos]);

  const nextNumero = useMemo(() => {
    const maxNum = atos.reduce((max, a) => {
      const n = parseInt(a.numero_ato, 10);
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    return String(maxNum + 1).padStart(4, "0");
  }, [atos]);

  const openForm = () => {
    setEditingId(null);
    setForm({
      ...defaultForm,
      numero_ato: nextNumero,
      medidas: [],
    });
    setShowForm(true);
  };

  const openEdit = (a: AtosAdmin) => {
    setEditingId(a.id);
    setForm({
      numero_ato: a.numero_ato,
      data_emissao: a.data_emissao,
      denuncia_id: a.denuncia_id || "",
      numero_referencia: a.numero_referencia,
      ipm_id: a.ipm_id || "",
      ipm_numero: a.ipm_numero,
      nome_policial: a.nome_policial,
      posto_graduacao: a.posto_graduacao,
      rg_pm: a.rg_pm,
      medidas: a.medidas || [],
      data_inicio_suspensao: a.data_inicio_suspensao || "",
      data_fim_suspensao: a.data_fim_suspensao || "",
      horas_guarita: a.horas_guarita ? String(a.horas_guarita) : "",
      horas_base_comunitaria: a.horas_base_comunitaria ? String(a.horas_base_comunitaria) : "",
      horas_prisao_disciplinar: a.horas_prisao_disciplinar ? String(a.horas_prisao_disciplinar) : "",
      responsavel_nome: a.responsavel_nome,
      responsavel_posto: a.responsavel_posto,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dbData = {
        numero_ato: form.numero_ato,
        data_emissao: form.data_emissao,
        denuncia_id: form.denuncia_id || null,
        numero_referencia: form.numero_referencia,
        ipm_id: form.ipm_id || null,
        ipm_numero: form.ipm_numero,
        nome_policial: form.nome_policial,
        posto_graduacao: form.posto_graduacao,
        rg_pm: form.rg_pm,
        medidas: form.medidas,
        data_inicio_suspensao: form.medidas.includes("Suspensão") ? (form.data_inicio_suspensao || null) : null,
        data_fim_suspensao: form.medidas.includes("Suspensão") ? (form.data_fim_suspensao || null) : null,
        horas_guarita: form.medidas.includes("Serviço de Guarita") ? (Number(form.horas_guarita) || null) : null,
        horas_base_comunitaria: form.medidas.includes("Serviço de Base Comunitária") ? (Number(form.horas_base_comunitaria) || null) : null,
        horas_prisao_disciplinar: form.medidas.includes("Prisão Disciplinar Militar") ? (Number(form.horas_prisao_disciplinar) || null) : null,
        responsavel_nome: form.responsavel_nome,
        responsavel_posto: form.responsavel_posto,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { data, error } = await supabase
          .from("atos_administrativos")
          .update(dbData)
          .eq("id", editingId)
          .select()
          .single();
        if (error) throw error;
        setAtos(prev => prev.map(a => a.id === editingId ? data as AtosAdmin : a));
        logAudit({ action: "update", entity_type: "atos_administrativo", entity_id: editingId, details: { numero_ato: form.numero_ato, nome_policial: form.nome_policial } });
      } else {
        const { data, error } = await supabase
          .from("atos_administrativos")
          .insert(dbData)
          .select()
          .single();
        if (error) throw error;
        setAtos(prev => [data as AtosAdmin, ...prev]);
        logAudit({ action: "create", entity_type: "atos_administrativo", entity_id: data.id, details: { numero_ato: form.numero_ato, nome_policial: form.nome_policial } });
      }
      setShowForm(false);
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  const printDoc = (html: string) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ato administrativo?")) return;
    try {
      const { error } = await supabase.from("atos_administrativos").delete().eq("id", id);
      if (error) throw error;
      setAtos(prev => prev.filter(a => a.id !== id));
      logAudit({ action: "delete", entity_type: "atos_administrativo", entity_id: id });
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const toggleMedida = (medida: string) => {
    setForm(f => ({
      ...f,
      medidas: f.medidas.includes(medida)
        ? f.medidas.filter(m => m !== medida)
        : [...f.medidas, medida],
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Atos Administrativos</h3>
          <Button size="sm" className="gap-1" onClick={openForm}>
            <Plus className="h-4 w-4" /> Novo Ato
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por número, policial, IPM..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-1 flex-wrap">
            <Button variant={filterMedida === "todos" ? "default" : "outline"} size="sm" onClick={() => setFilterMedida("todos")}>Todos ({stats.total})</Button>
            {MEDIDAS_OPTIONS.map(m => (
              <Button key={m} variant={filterMedida === m ? "default" : "outline"} size="sm" onClick={() => setFilterMedida(m)}>
                {m}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Total: <strong>{stats.total}</strong></span>
          <span>| Advertências: <strong>{stats.advertencia}</strong></span>
          <span>| Suspensões: <strong>{stats.suspensao}</strong></span>
          <span>| Guarita: <strong>{stats.garantia}h</strong></span>
          <span>| Base Comunitária: <strong>{stats.baseComunitaria}h</strong></span>
          <span>| Prisão Disciplinar: <strong>{stats.prisao}h</strong></span>
          <span>| Exclusão: <strong>{stats.exclusao}</strong></span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum ato administrativo encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="border border-border rounded-lg bg-card p-4 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default">Ato Nº {a.numero_ato}</Badge>
                    <span className="font-bold text-sm">ATO DE APLICAÇÃO DE SANÇÃO DISCIPLINAR Nº {a.numero_ato}/{new Date(a.data_emissao).getFullYear()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.posto_graduacao} {a.nome_policial} | R.E. {a.rg_pm} | IPM nº {a.ipm_numero}</p>
                  <p className="text-xs text-muted-foreground mt-1">Medidas: {a.medidas.join(", ") || "Nenhuma"}</p>
                  <p className="text-xs text-muted-foreground">Ref: {a.numero_referencia || "–"} | {a.responsavel_posto} {a.responsavel_nome}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar" onClick={() => { setPreviewData(a); setPreviewOpen(true); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Imprimir" onClick={() => printDoc(generateAtoHtml(a))}>
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEdit(a)}>
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Novo"} Ato Administrativo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Nº do Ato (próximo: {nextNumero})</Label>
                <Input value={form.numero_ato} onChange={e => setForm(f => ({ ...f, numero_ato: e.target.value }))} placeholder={nextNumero} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Data de Emissão *</Label>
                <Input type="date" value={form.data_emissao} onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Denúncia Vinculada</Label>
                <Select value={form.denuncia_id || undefined} onValueChange={v => {
                  const d = denuncias.find((d: any) => d.id === v);
                  const numReg = d?.numero_registro;
                  const ano = new Date().getFullYear();
                  const proto = numReg ? `Nº${String(numReg).padStart(4, "0")}/${String(ano).slice(2)}` : "";
                  setForm(f => ({ ...f, denuncia_id: v, numero_referencia: proto }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar denúncia..." /></SelectTrigger>
                  <SelectContent>
                    {denuncias.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>
                        #{d.numero_registro?.toString().padStart(4, "0")} - {d.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Nº de Referência</Label>
                <Input value={form.numero_referencia} onChange={e => setForm(f => ({ ...f, numero_referencia: e.target.value }))} placeholder="Ex: Nº0001/26" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">IPM Vinculado</Label>
              <Select value={form.ipm_id || undefined} onValueChange={v => {
                const ipm = ipms.find((i: any) => i.id === v);
                setForm(f => ({ ...f, ipm_id: v, ipm_numero: ipm?.numero_ipm || "" }));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecionar IPM..." /></SelectTrigger>
                <SelectContent>
                  {ipms.map((ipm: any) => (
                    <SelectItem key={ipm.id} value={ipm.id}>
                      Nº{ipm.numero_ipm} — {ipm.unidade || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-semibold">Policial Militar *</Label>
                <Input value={form.nome_policial} onChange={e => setForm(f => ({ ...f, nome_policial: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Posto/Graduação *</Label>
                <Input value={form.posto_graduacao} onChange={e => setForm(f => ({ ...f, posto_graduacao: e.target.value }))} placeholder="Ex: Sgt PM" />
              </div>
              <div>
                <Label className="text-xs font-semibold">R.E *</Label>
                <Input value={form.rg_pm} onChange={e => setForm(f => ({ ...f, rg_pm: e.target.value }))} />
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <Label className="text-sm font-bold">Medidas Disciplinares</Label>
              <p className="text-xs text-muted-foreground">Selecione as medidas aplicáveis:</p>
              <div className="grid grid-cols-1 gap-2">
                {MEDIDAS_OPTIONS.map(medida => (
                  <div key={medida} className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={form.medidas.includes(medida)}
                        onCheckedChange={() => toggleMedida(medida)}
                      />
                      {medida}
                    </label>
                    {medida === "Suspensão" && form.medidas.includes("Suspensão") && (
                      <div className="grid grid-cols-2 gap-3 ml-6">
                        <div>
                          <Label className="text-xs">Data Início</Label>
                          <Input type="date" value={form.data_inicio_suspensao} onChange={e => setForm(f => ({ ...f, data_inicio_suspensao: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-xs">Data Fim</Label>
                          <Input type="date" value={form.data_fim_suspensao} onChange={e => setForm(f => ({ ...f, data_fim_suspensao: e.target.value }))} />
                        </div>
                      </div>
                    )}
                    {medida === "Serviço de Guarita" && form.medidas.includes("Serviço de Guarita") && (
                      <div className="ml-6">
                        <Label className="text-xs">Horas</Label>
                        <Input type="number" min="0" value={form.horas_guarita} onChange={e => setForm(f => ({ ...f, horas_guarita: e.target.value }))} placeholder="Ex: 40" />
                      </div>
                    )}
                    {medida === "Serviço de Base Comunitária" && form.medidas.includes("Serviço de Base Comunitária") && (
                      <div className="ml-6">
                        <Label className="text-xs">Horas</Label>
                        <Input type="number" min="0" value={form.horas_base_comunitaria} onChange={e => setForm(f => ({ ...f, horas_base_comunitaria: e.target.value }))} placeholder="Ex: 40" />
                      </div>
                    )}
                    {medida === "Prisão Disciplinar Militar" && form.medidas.includes("Prisão Disciplinar Militar") && (
                      <div className="ml-6">
                        <Label className="text-xs">Horas</Label>
                        <Input type="number" min="0" value={form.horas_prisao_disciplinar} onChange={e => setForm(f => ({ ...f, horas_prisao_disciplinar: e.target.value }))} placeholder="Ex: 30" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {form.medidas.length > 0 && (
                <div className="mt-3 p-3 bg-background rounded border text-xs">
                  <p className="font-semibold mb-1">Pré-visualização Art. 2º:</p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {form.medidas.map(m => {
                      if (m === "Advertência") return <li key={m}>Advertência</li>;
                      if (m === "Suspensão" && form.data_inicio_suspensao && form.data_fim_suspensao) {
                        return <li key={m}>Suspensão de {form.data_inicio_suspensao} até {form.data_fim_suspensao}</li>;
                      }
                      if (m === "Serviço de Guarita" && form.horas_guarita) return <li key={m}>Serviço de Guarita por {form.horas_guarita} horas</li>;
                      if (m === "Serviço de Base Comunitária" && form.horas_base_comunitaria) return <li key={m}>Serviço de Base Comunitária por {form.horas_base_comunitaria} horas</li>;
                      if (m === "Prisão Disciplinar Militar" && form.horas_prisao_disciplinar) return <li key={m}>Prisão Disciplinar Militar por {form.horas_prisao_disciplinar} horas</li>;
                      if (m === "Exclusão da Corporação") return <li key={m}>Exclusão da Corporação</li>;
                      return <li key={m}>{m}</li>;
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Nome do Corregedor(a) *</Label>
                <Input value={form.responsavel_nome} onChange={e => setForm(f => ({ ...f, responsavel_nome: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Posto/Graduação *</Label>
                <Input value={form.responsavel_posto} onChange={e => setForm(f => ({ ...f, responsavel_posto: e.target.value }))} placeholder="Ex: Ten Cel PM" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.numero_ato || !form.nome_policial || !form.posto_graduacao}>
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Pré-visualização
            </DialogTitle>
          </DialogHeader>
          {previewData && (
            <>
              <div className="bg-white rounded border overflow-hidden" style={{ minHeight: "800px" }}>
                <iframe
                  srcDoc={generateAtoHtml(previewData)}
                  title="Pré-visualização"
                  className="w-full border-0"
                  style={{ minHeight: "800px" }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setPreviewData(null); setPreviewOpen(false); }}>Fechar</Button>
                <Button onClick={() => printDoc(generateAtoHtml(previewData))} className="gap-1">
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}