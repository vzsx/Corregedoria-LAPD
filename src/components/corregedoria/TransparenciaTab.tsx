import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Eye, Printer, Plus, Search, FileText, Archive, CheckCircle2, History, Filter, Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { logAudit } from "@/lib/audit-log";
import { supabase } from "@/integrations/supabase/client";
import { BRASAO_SP_LOGO, PM_LOGO } from "./ipm-logos";
import { PMESP_WATERMARK } from "./pmesp-watermark";

export interface Transparencia {
  id: string;
  numero_informe: string;
  tipo: "arquivamento" | "solucionada";
  data_emissao: string;
  numero_referencia: string;
  denuncia_id: string | null;
  responsavel_nome: string;
  responsavel_posto: string;
  responsavel_assinatura: string | null;
  considerandos: string;
  artigo_1: string;
  artigo_2: string;
  artigo_3: string;
  artigo_4: string;
  artigo_5: string | null;
  medidas: string[] | null;
  observacoes: string | null;
  status: string;
  autor_id: string | null;
  autor_nome: string | null;
  created_at: string;
  updated_at: string;
}

interface TransparenciaTabProps {
  transparencias: Transparencia[];
  setTransparencias: React.Dispatch<React.SetStateAction<Transparencia[]>>;
  denuncias: any[];
}

const DEFAULT_CONSIDERANDOS_ARQUIVAMENTO = `CONSIDERANDO a conclusão da apuração administrativa referente à denúncia protocolada sob o nº ____;
CONSIDERANDO que, durante a instrução do procedimento, foram realizadas as diligências necessárias para verificação dos fatos narrados;
CONSIDERANDO que os elementos produzidos não evidenciaram materialidade ou indícios suficientes capazes de corroborar as alegações apresentadas;`;

const DEFAULT_CONSIDERANDOS_SOLUCIONADA = `CONSIDERANDO a conclusão da apuração administrativa referente à denúncia protocolada sob o nº ____;
CONSIDERANDO que, durante a instrução do procedimento, foram realizadas todas as diligências necessárias para o completo esclarecimento dos fatos narrados;
CONSIDERANDO que os elementos de prova produzidos evidenciaram a materialidade dos fatos e permitiram a correta identificação das circunstâncias apuradas;`;

const DEFAULT_ARTIGOS_ARQUIVAMENTO = {
  art1: "Determinar o ARQUIVAMENTO em razão da INSUFICIÊNCIA DE ELEMENTOS PROBATÓRIOS que sustentam a continuidade da apuração administrativa.",
  art2: "O arquivamento fundamenta-se na inexistência de provas consistentes e suficientes para comprovar os fatos narrados na denúncia, não sendo constatados elementos objetivos que justifiquem a instauração ou prosseguimento de procedimento disciplinar.",
  art3: "O presente arquivamento possui natureza administrativa e poderá ser revisto caso surjam novos elementos de prova ou fatos supervenientes relevantes.",
  art4: "Dê-se ciência às partes interessadas, observadas as normas de sigilo e proteção de dados aplicáveis.",
};

const MEDIDAS_OPTIONS = [
  "Advertência",
  "Prisão Militar",
  "Exoneração da Polícia Militar",
  "Afastamento como Medida Disciplinar",
  "Orientação",
];

const DEFAULT_ARTIGOS_SOLUCIONADA = {
  art1: "Declarar solucionada a denúncia, em razão da conclusão da apuração administrativa e do esclarecimento integral dos fatos apresentados.",
  art2: "Concluir que a investigação produziu elementos suficientes para fundamentar as providências administrativas cabíveis, conforme constatado durante a instrução do procedimento.",
  art3: "Em decorrência das conclusões alcançadas na apuração, foram adotadas as seguintes medidas administrativas e disciplinares:",
  art4: "Determinar o encaminhamento dos autos à autoridade competente para adoção das demais providências administrativas e disciplinares que se fizerem necessárias, observadas as normas legais e regulamentares aplicáveis.",
  art5: "Dê-se ciência às partes interessadas, observadas as normas de sigilo e proteção de dados aplicáveis.",
};

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function generateInformeHtml(t: Transparencia): string {
  const isArquivamento = t.tipo === "arquivamento";
  const dataFormatada = format(parseLocalDate(t.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const considerandosRaw = t.considerandos.replace(/n[ºo°]\s*_{2,}/g, t.numero_referencia ? `nº ${t.numero_referencia}` : "nº ____");
  const considerandos = considerandosRaw.split("\n").filter(l => l.trim());
  const numeroFormatado = t.numero_informe.padStart(3, "0");
  const ano = new Date().getFullYear();
  const numRef = t.numero_informe || "";

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

  <p class="c14" style="margin-top:20pt;"><span class="c4">${isArquivamento ? "INFORME DE ARQUIVAMENTO" : "INFORME DE DENÚNCIA SOLUCIONADA"}${numRef ? ` Nº ${numRef}` : ""} – CPM</span></p>

  <p class="c1">A CORREGEDORIA DA POLÍCIA MILITAR DO ESTADO DE SÃO PAULO, no uso de suas atribuições legais e regulamentares, torna público o seguinte informe:</p>

  ${considerandos.map(c => `<p class="c1"><span class="c4 c7">${c}</span></p>`).join("\n\n  ")}

  <p class="c1"><span class="c4 c7">RESOLVE:</span></p>

  <p class="c1"><span class="c4 c7">Art. 1º</span><span class="c4"> ${t.artigo_1}</span></p>
  <p class="c1"><span class="c4 c7">Art. 2º</span><span class="c4"> ${t.artigo_2}</span></p>
  <p class="c1"><span class="c4 c7">Art. 3º</span><span class="c4">${t.artigo_3.replace(/\n/g, '<br>')}</span></p>
  <p class="c1"><span class="c4 c7">Art. 4º</span><span class="c4"> ${t.artigo_4}</span></p>
  <p class="c1"><span class="c4 c7">Art. 5º</span><span class="c4"> ${t.artigo_5 || "Dê-se ciência às partes interessadas, observadas as normas de sigilo e proteção de dados aplicáveis."}</span></p>

  <p class="c1"><span class="c4 c7">Publique-se. Registre-se. Cumpra-se.</span></p>

  <div class="signature-block" style="margin-top:30pt;text-align:center;">
    <p class="c14" style="margin:0 0 18pt 0;">
      <span class="c4">São Paulo, ${dataFormatada}.</span>
    </p>
    <p class="c14" style="margin:0 0 6pt 0;line-height:1;">
      <span class="c4">Ass: </span>${t.responsavel_nome ? `<span class="signature-name">${t.responsavel_nome}</span>` : `<span class="signature-line"></span>`}
    </p>
    <p class="c14" style="margin:0;line-height:1;">
      <span class="c4">${t.responsavel_posto ? `${t.responsavel_posto} ` : ""}${t.responsavel_nome || ""}</span>
    </p>
    <p class="c14" style="margin:2pt 0 0 0;">
      <span class="c4" style="font-size:11pt;">Corregedor da Polícia Militar do Estado de São Paulo</span>
    </p>
  </div>
</div>
</body>
</html>`;
}

function generateInformeText(t: Transparencia): string {
  const isArquivamento = t.tipo === "arquivamento";
  const dataFormatada = format(parseLocalDate(t.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const considerandosRaw = t.considerandos.replace(/n[ºo°]\s*_{2,}/g, t.numero_referencia ? `nº ${t.numero_referencia}` : "nº ____");
  const considerandos = considerandosRaw.split("\n").filter(l => l.trim());
  const numeroFormatado = t.numero_informe.padStart(3, "0");
  const ano = new Date().getFullYear();
  const numRef = t.numero_informe || "";

  return [
    `GOVERNO DO ESTADO DE SÃO PAULO`,
    `SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA`,
    `POLÍCIA MILITAR DO ESTADO DE SÃO PAULO`,
    `QUARTEL DA CORREGEDORIA-GERAL DA POLÍCIA MILITAR`,
    ``,
    `POLÍCIA MILITAR DO ESTADO DE SÃO PAULO`,
    `CORREGEDORIA DA POLÍCIA MILITAR`,
    ``,
    `${isArquivamento ? "INFORME DE ARQUIVAMENTO" : "INFORME DE DENÚNCIA SOLUCIONADA"}${numRef ? ` Nº ${numRef}` : ""} – CPM`,
    ``,
    `A CORREGEDORIA DA POLÍCIA MILITAR DO ESTADO DE SÃO PAULO, no uso de suas atribuições legais e regulamentares, torna público o seguinte informe:`,
    ``,
    ...considerandos,
    ``,
    `RESOLVE:`,
    ``,
    `Art. 1º ${t.artigo_1}`,
    ``,
    `Art. 2º ${t.artigo_2}`,
    ``,
    `Art. 3º ${t.artigo_3}`,
    ``,
    `Art. 4º ${t.artigo_4}`,
    ``,
    `Art. 5º ${t.artigo_5 || "Dê-se ciência às partes interessadas, observadas as normas de sigilo e proteção de dados aplicáveis."}`,
    ``,
    `Publique-se. Registre-se. Cumpra-se.`,
    ``,
    `São Paulo, ${dataFormatada}.`,
    ``,
    `Ass: ${t.responsavel_nome || ""}`,
    `${t.responsavel_posto ? `${t.responsavel_posto} ` : ""}${t.responsavel_nome || ""}`,
    `Corregedor da Polícia Militar do Estado de São Paulo`,
  ].join("\n");
}

export function TransparenciaTab({ transparencias, setTransparencias, denuncias }: TransparenciaTabProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<"todos" | "arquivamento" | "solucionada">("todos");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Transparencia | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultForm = useMemo(() => ({
    tipo: "arquivamento" as "arquivamento" | "solucionada",
    numero_informe: "",
    data_emissao: format(new Date(), "yyyy-MM-dd"),
    denuncia_id: "",
    numero_referencia: "",
    responsavel_nome: user?.user_metadata?.full_name || "",
    responsavel_posto: user?.user_metadata?.patente || "",
    responsavel_assinatura: "",
    considerandos: DEFAULT_CONSIDERANDOS_ARQUIVAMENTO,
    artigo_1: DEFAULT_ARTIGOS_ARQUIVAMENTO.art1,
    artigo_2: DEFAULT_ARTIGOS_ARQUIVAMENTO.art2,
    artigo_3: DEFAULT_ARTIGOS_ARQUIVAMENTO.art3,
    artigo_4: DEFAULT_ARTIGOS_ARQUIVAMENTO.art4,
    artigo_5: "",
    medidas: [] as string[],
    observacoes: "",
  }), [user]);

  const [form, setForm] = useState(defaultForm);

  const filtered = useMemo(() => {
    return transparencias.filter(t => {
      const matchesSearch = !searchTerm ||
        t.numero_informe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.responsavel_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.numero_referencia.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = filterTipo === "todos" || t.tipo === filterTipo;
      return matchesSearch && matchesTipo;
    });
  }, [transparencias, searchTerm, filterTipo]);

  const stats = useMemo(() => ({
    arquivamento: transparencias.filter(t => t.tipo === "arquivamento").length,
    solucionada: transparencias.filter(t => t.tipo === "solucionada").length,
    total: transparencias.length,
  }), [transparencias]);

  const nextNumero = useMemo(() => {
    const maxNum = transparencias.reduce((max, t) => {
      const n = parseInt(t.numero_informe, 10);
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    return String(maxNum + 1).padStart(3, "0");
  }, [transparencias]);

  const openForm = (tipo?: "arquivamento" | "solucionada") => {
    setEditingId(null);
    const t = tipo || "arquivamento";
    setForm({
      ...defaultForm,
      tipo: t,
      numero_informe: nextNumero,
      considerandos: t === "arquivamento" ? DEFAULT_CONSIDERANDOS_ARQUIVAMENTO : DEFAULT_CONSIDERANDOS_SOLUCIONADA,
      artigo_1: t === "arquivamento" ? DEFAULT_ARTIGOS_ARQUIVAMENTO.art1 : DEFAULT_ARTIGOS_SOLUCIONADA.art1,
      artigo_2: t === "arquivamento" ? DEFAULT_ARTIGOS_ARQUIVAMENTO.art2 : DEFAULT_ARTIGOS_SOLUCIONADA.art2,
      artigo_3: t === "arquivamento" ? DEFAULT_ARTIGOS_ARQUIVAMENTO.art3 : DEFAULT_ARTIGOS_SOLUCIONADA.art3,
      artigo_4: t === "arquivamento" ? DEFAULT_ARTIGOS_ARQUIVAMENTO.art4 : DEFAULT_ARTIGOS_SOLUCIONADA.art4,
      artigo_5: t === "arquivamento" ? "" : (DEFAULT_ARTIGOS_SOLUCIONADA as any).art5 || "",
      medidas: [],
    });
    setShowForm(true);
  };

  const openEdit = (t: Transparencia) => {
    setEditingId(t.id);
    setForm({
      tipo: t.tipo,
      numero_informe: t.numero_informe,
      data_emissao: t.data_emissao,
      denuncia_id: (t as any).denuncia_id || "",
      numero_referencia: t.numero_referencia,
      responsavel_nome: t.responsavel_nome,
      responsavel_posto: t.responsavel_posto,
      responsavel_assinatura: t.responsavel_assinatura || "",
      considerandos: t.considerandos,
      artigo_1: t.artigo_1,
      artigo_2: t.artigo_2,
      artigo_3: t.artigo_3,
      artigo_4: t.artigo_4,
      artigo_5: t.artigo_5 || "",
      medidas: [],
      observacoes: t.observacoes || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dbData = {
        numero_informe: form.numero_informe,
        tipo: form.tipo,
        data_emissao: form.data_emissao,
        numero_referencia: form.numero_referencia,
        denuncia_id: form.denuncia_id || null,
        responsavel_nome: form.responsavel_nome,
        responsavel_posto: form.responsavel_posto,
        responsavel_assinatura: form.responsavel_assinatura || null,
        considerandos: form.considerandos,
        artigo_1: form.artigo_1,
        artigo_2: form.artigo_2,
        artigo_3: form.artigo_3,
        artigo_4: form.artigo_4,
        artigo_5: form.artigo_5 || null,
        artigo_3: form.tipo === "solucionada" && form.medidas.length > 0
          ? `${form.artigo_3}\n\n${form.medidas.map(m => `• ${m}`).join("\n")}`
          : form.artigo_3,
        observacoes: form.observacoes || null,
        status: "concluido",
        autor_id: user?.id || null,
        autor_nome: user?.user_metadata?.full_name || null,
      };

      if (editingId) {
        const { data, error } = await supabase
          .from("transparencias")
          .update(dbData)
          .eq("id", editingId)
          .select()
          .single();
        if (error) throw error;
        setTransparencias(prev => prev.map(t => t.id === editingId ? data as Transparencia : t));
        logAudit({ action: "update", entity_type: "transparencia", entity_id: editingId, details: { tipo: form.tipo, numero_informe: form.numero_informe } });
      } else {
        const { data, error } = await supabase
          .from("transparencias")
          .insert(dbData)
          .select()
          .single();
        if (error) throw error;
        setTransparencias(prev => [data as Transparencia, ...prev]);
        logAudit({ action: "create", entity_type: "transparencia", entity_id: data.id, details: { tipo: form.tipo, numero_informe: form.numero_informe } });
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
    if (!confirm("Tem certeza que deseja excluir este informe?")) return;
    try {
      const { error } = await supabase.from("transparencias").delete().eq("id", id);
      if (error) throw error;
      setTransparencias(prev => prev.filter(t => t.id !== id));
      logAudit({ action: "delete", entity_type: "transparencia", entity_id: id });
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Transparências</h3>
          <div className="flex gap-2">
            <Button size="sm" className="gap-1" onClick={() => openForm("arquivamento")}>
              <Archive className="h-4 w-4" /> Arquivamento
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => openForm("solucionada")}>
              <CheckCircle2 className="h-4 w-4" /> Denúncia Solucionada
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por número, referência..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-1">
            <Button variant={filterTipo === "todos" ? "default" : "outline"} size="sm" onClick={() => setFilterTipo("todos")}>Todos ({stats.total})</Button>
            <Button variant={filterTipo === "arquivamento" ? "default" : "outline"} size="sm" onClick={() => setFilterTipo("arquivamento")}>
              <Archive className="h-3 w-3 mr-1" /> Arquivados ({stats.arquivamento})
            </Button>
            <Button variant={filterTipo === "solucionada" ? "default" : "outline"} size="sm" onClick={() => setFilterTipo("solucionada")}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Solucionadas ({stats.solucionada})
            </Button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum informe encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="border border-border rounded-lg bg-card p-4 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={t.tipo === "arquivamento" ? "secondary" : "default"}>
                      {t.tipo === "arquivamento" ? "Arquivamento" : "Solucionada"}
                    </Badge>
                    <span className="font-bold text-sm">INFORME DE {t.tipo === "arquivamento" ? "ARQUIVAMENTO" : "DENÚNCIA SOLUCIONADA"} Nº {t.numero_informe}/{new Date().getFullYear()} – CPM</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Ref: {t.numero_referencia || "–"} | {t.responsavel_posto} {t.responsavel_nome}</p>
                  <p className="text-xs text-muted-foreground mt-1">Criado em {format(parseLocalDate(t.data_emissao), "dd/MM/yyyy")}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar" onClick={() => { setPreviewData(t); setPreviewOpen(true); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Imprimir" onClick={() => printDoc(generateInformeHtml(t))}>
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEdit(t)}>
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Novo"} Informe de {form.tipo === "arquivamento" ? "Arquivamento" : "Denúncia Solucionada"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => {
                  const t = v as "arquivamento" | "solucionada";
                  setForm(f => ({
                    ...f,
                    tipo: t,
                    considerandos: t === "arquivamento" ? DEFAULT_CONSIDERANDOS_ARQUIVAMENTO : DEFAULT_CONSIDERANDOS_SOLUCIONADA,
                    artigo_1: t === "arquivamento" ? DEFAULT_ARTIGOS_ARQUIVAMENTO.art1 : DEFAULT_ARTIGOS_SOLUCIONADA.art1,
                    artigo_2: t === "arquivamento" ? DEFAULT_ARTIGOS_ARQUIVAMENTO.art2 : DEFAULT_ARTIGOS_SOLUCIONADA.art2,
                    artigo_3: t === "arquivamento" ? DEFAULT_ARTIGOS_ARQUIVAMENTO.art3 : DEFAULT_ARTIGOS_SOLUCIONADA.art3,
                    artigo_4: t === "arquivamento" ? DEFAULT_ARTIGOS_ARQUIVAMENTO.art4 : DEFAULT_ARTIGOS_SOLUCIONADA.art4,
                    artigo_5: t === "arquivamento" ? "" : (DEFAULT_ARTIGOS_SOLUCIONADA as any).art5 || "",
                    medidas: t === "solucionada" ? [] : f.medidas,
                  }));
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arquivamento">Arquivamento</SelectItem>
                    <SelectItem value="solucionada">Denúncia Solucionada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Nº do Informe * (próximo: {nextNumero})</Label>
                <Input value={form.numero_informe} onChange={e => setForm(f => ({ ...f, numero_informe: e.target.value }))} placeholder={nextNumero} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Data de Emissão *</Label>
                <Input type="date" value={form.data_emissao} onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Denúncia Vinculada *</Label>
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
            </div>
            <div>
              <Label className="text-xs font-semibold">Nº de Referência (aparece no documento)</Label>
              <Input value={form.numero_referencia} onChange={e => setForm(f => ({ ...f, numero_referencia: e.target.value }))} placeholder="Ex: Nº0001/26" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Nome do Corregedor *</Label>
                <Input value={form.responsavel_nome} onChange={e => setForm(f => ({ ...f, responsavel_nome: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Posto/Graduação *</Label>
                <Input value={form.responsavel_posto} onChange={e => setForm(f => ({ ...f, responsavel_posto: e.target.value }))} placeholder="Ex: Ten Cel PM" />
              </div>
            </div>

            {/* Solucionada-specific: Measures checklist */}
            {form.tipo === "solucionada" && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <Label className="text-sm font-bold">Art. 3º – Medidas Disciplinares Adotadas</Label>
                <p className="text-xs text-muted-foreground">Selecione as medidas aplicáveis (podem selecionar mais de uma):</p>
                <div className="grid grid-cols-1 gap-2">
                  {MEDIDAS_OPTIONS.map(medida => (
                    <label key={medida} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={form.medidas.includes(medida)}
                        onCheckedChange={(checked) => {
                          setForm(f => ({
                            ...f,
                            medidas: checked
                              ? [...f.medidas, medida]
                              : f.medidas.filter(m => m !== medida),
                          }));
                        }}
                      />
                      {medida}
                    </label>
                  ))}
                </div>
                {form.medidas.length > 0 && (
                  <div className="mt-3 p-3 bg-background rounded border text-xs">
                    <p className="font-semibold mb-1">Pré-visualização Art. 3º:</p>
                    <p className="text-muted-foreground mb-1">Em decorrência das conclusões alcançadas na apuração, foram adotadas as seguintes medidas administrativas e disciplinares:</p>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {form.medidas.map(m => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Arquivamento-specific: just shows fixed text info */}
            {form.tipo === "arquivamento" && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <Label className="text-sm font-bold">Artigos do Arquivamento (fixos)</Label>
                <p className="text-xs text-muted-foreground">Os artigos são gerados automaticamente conforme o modelo padrão.</p>
                <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                  <li><strong>Art. 1º</strong> – Determinar o ARQUIVAMENTO...</li>
                  <li><strong>Art. 2º</strong> – O arquivamento fundamenta-se...</li>
                  <li><strong>Art. 3º</strong> – O presente arquivamento possui natureza administrativa...</li>
                  <li><strong>Art. 4º</strong> – Dê-se ciência às partes interessadas...</li>
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.numero_informe || !form.responsavel_nome || (form.tipo === "solucionada" && !form.denuncia_id)}>
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
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
                  srcDoc={generateInformeHtml(previewData)}
                  title="Pré-visualização"
                  className="w-full border-0"
                  style={{ minHeight: "800px" }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setPreviewData(null); setPreviewOpen(false); }}>Fechar</Button>
                <Button onClick={() => printDoc(generateInformeHtml(previewData))} className="gap-1">
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
