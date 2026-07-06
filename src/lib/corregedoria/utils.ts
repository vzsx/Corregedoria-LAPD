import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BRASAO_SP_LOGO, PM_LOGO } from "@/components/corregedoria/ipm-logos";
import type { Depoimento, Relatorio, Investigacao, Denuncia } from "./types";

export const formatDateSafe = (dateStr: any, formatStr: string) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return format(date, formatStr);
  } catch {
    return "-";
  }
};

const IPM_BASE_CSS = `
<style type="text/css">
ol{margin:0;padding:0}
table td,table th{padding:0}
.c4{color:#000000;font-weight:700;text-decoration:none;vertical-align:baseline;font-size:11pt;font-family:"Arial";font-style:normal}
.c11{padding-top:12pt;padding-bottom:12pt;line-height:1.0;orphans:2;widows:2;text-align:justify}
.c17{padding-top:18pt;padding-bottom:4pt;line-height:1.0;orphans:2;widows:2;text-align:left}
.c3{padding-top:0pt;padding-bottom:0pt;line-height:1.15;orphans:2;widows:2;text-align:center}
.c1{padding-top:12pt;padding-bottom:12pt;line-height:1.0;orphans:2;widows:2;text-align:left}
.c10{font-weight:400;text-decoration:none;vertical-align:baseline;font-size:11pt;font-family:"Arial";font-style:normal}
.c14{padding-top:12pt;padding-bottom:12pt;line-height:1.0;orphans:2;widows:2;text-align:center}
.c9{font-weight:400;text-decoration:none;vertical-align:baseline;font-size:14pt;font-family:"Arial";font-style:normal}
.c15{padding-top:24pt;padding-bottom:6pt;line-height:1.0;orphans:2;widows:2;text-align:left}
.c12{text-decoration:none;vertical-align:baseline;font-size:11pt;font-family:"Arial";font-style:normal}
.c6{background-color:#ffffff;max-width:451.4pt;padding:72pt 72pt 72pt 72pt}
.c0{color:#434343;font-weight:700}
.c2{font-style:italic}
.c16{height:11pt}
.c5{color:#434343}
.c7{font-weight:700}
p{margin:0;color:#000000;font-size:11pt;font-family:"Arial"}
h2{padding-top:18pt;color:#000000;font-size:16pt;padding-bottom:6pt;font-family:"Arial";line-height:1.15;page-break-after:avoid;orphans:2;widows:2;text-align:left}
@media print{body{margin:0}.c6{max-width:none}}
</style>
`;

function wrapWithIpmLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${IPM_BASE_CSS}
</head>
<body class="c6 doc-content">

  <!-- CABECALHO -->
  <div>
    <p class="c3">
      <span class="c4">GOVERNO DO ESTADO DE SÃO PAULO &nbsp;</span>
      <span style="overflow:hidden;display:inline-block;margin:0;border:0;width:80.95px;height:93.01px;">
        <img src="${BRASAO_SP_LOGO}" style="width:80.95px;height:93.01px;" title="">
      </span>
      <span style="overflow:hidden;display:inline-block;margin:0;border:0;width:92.58px;height:107.00px;">
        <img src="${PM_LOGO}" style="width:92.58px;height:107.00px;" title="">
      </span>
    </p>
    <p class="c3"><span class="c4">SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA &nbsp;</span></p>
    <p class="c3"><span class="c4">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO &nbsp;</span></p>
    <p class="c3"><span class="c7">QUARTEL DA CORREGEDORIA-GERAL DA POLÍCIA MILITAR<br></span></p>
  </div>

  <!-- TITULOS -->
  <p class="c11"><span class="c4">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</span></p>
  <p class="c11"><span class="c4">CORREGEDORIA DA POLÍCIA MILITAR</span></p>

  <!-- TITULO DO DOCUMENTO -->
  <h1 class="c15"><span class="c12 c0">${title}</span></h1>

  <!-- CONTEUDO -->
  ${bodyContent}

</body>
</html>`;
}

function printGeneric(title: string, bodyContent: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(wrapWithIpmLayout(title, bodyContent));
  w.document.close();
  setTimeout(() => w.print(), 500);
}

export const printRelatorio = (relatorio: Relatorio) => {
  const content = relatorio.conteudo || relatorio.dados_detalhados?.relato_fatos || "";
  const data = relatorio.dados_detalhados || {};
  const title = `${relatorio.tipo_denuncia} – ${relatorio.titulo}`;
  const regNum = relatorio.numero_registro?.toString().padStart(4, '0') || '???';

  const sections: string[] = [];

  sections.push(`<p class="c1"><span class="c0">Registro:</span> <span class="c5">#${regNum}</span></p>`);
  sections.push(`<p class="c1"><span class="c0">Status:</span> <span class="c5">${(relatorio.status || "pendente").toUpperCase()}</span></p>`);

  if (data.numero_caso) {
    sections.push(`<p class="c1"><span class="c0">Nº do Caso:</span> <span class="c5">${data.numero_caso || "-"}</span></p>`);
    sections.push(`<p class="c1"><span class="c0">Patente:</span> <span class="c5">${data.corregedor_patente || "-"}</span></p>`);
    sections.push(`<p class="c1"><span class="c0">Abertura:</span> <span class="c5">${data.data_abertura || "-"}</span></p>`);
  }

  if (data.reclamante_nome) {
    sections.push(`<p class="c1"><span class="c0">Reclamante:</span> <span class="c5">${data.reclamante_nome}</span></p>`);
  }

  if (data.denunciado_nome) {
    sections.push(`<p class="c1"><span class="c0">Policial Denunciado:</span> <span class="c5">${data.denunciado_nome} – Badge #${data.denunciado_badge || "-"}</span></p>`);
  }

  if (data.incidente_data) {
    sections.push(`<p class="c1"><span class="c0">Incidente:</span> <span class="c5">${data.incidente_data || "-"} ${data.incidente_horario || ""} – ${data.incidente_local || ""}</span></p>`);
  }

  if (data.relato_fatos) {
    sections.push(`<p class="c11"><span class="c4">RELATO DOS FATOS</span></p>`);
    sections.push(`<p class="c1"><span class="c5">${data.relato_fatos}</span></p>`);
  }

  if (content) {
    sections.push(`<p class="c11"><span class="c4">CONTEÚDO</span></p>`);
    sections.push(`<p class="c1"><span class="c5">${content}</span></p>`);
  }

  if (data.testemunhas_nomes) {
    sections.push(`<p class="c1"><span class="c0">Testemunhas:</span> <span class="c5">${data.testemunhas_nomes}</span></p>`);
  }

  if (data.provas_descricao) {
    sections.push(`<p class="c1"><span class="c0">Provas:</span> <span class="c5">${data.provas_descricao}</span></p>`);
  }

  sections.push(`<hr>`);
  sections.push(`<p class="c14"><span class="c4">São Paulo, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.</span></p>`);

  printGeneric(title, sections.join("\n"));
};

export const printDenuncia = (denuncia: Denuncia) => {
  const data = denuncia.dados_detalhados || {};
  const title = `DENÚNCIA – ${denuncia.titulo}`;
  const regNum = denuncia.numero_registro?.toString().padStart(4, '0') || '???';

  const sections: string[] = [];

  sections.push(`<p class="c1"><span class="c0">Registro:</span> <span class="c5">#${regNum}</span></p>`);
  sections.push(`<p class="c1"><span class="c0">Status:</span> <span class="c5">${(denuncia.status || "pendente").toUpperCase()}</span></p>`);

  if (denuncia.policial_denunciado) {
    sections.push(`<p class="c1"><span class="c0">Policial Denunciado:</span> <span class="c5">${denuncia.policial_denunciado}</span></p>`);
  }

  if (data.reclamante_nome) {
    sections.push(`<p class="c11"><span class="c4">DADOS DO DENUNCIANTE</span></p>`);
    sections.push(`<p class="c1"><span class="c0">Nome:</span> <span class="c5">${data.reclamante_nome}</span></p>`);
    if (data.reclamante_id) sections.push(`<p class="c1"><span class="c0">ID:</span> <span class="c5">${data.reclamante_id}</span></p>`);
    if (data.reclamante_contato) sections.push(`<p class="c1"><span class="c0">Contato:</span> <span class="c5">${data.reclamante_contato}</span></p>`);
    if (data.reclamante_anonimo) sections.push(`<p class="c1"><span class="c0">Anônimo:</span> <span class="c5">${data.reclamante_anonimo}</span></p>`);
  }

  if (data.reclamado_nome) {
    sections.push(`<p class="c11"><span class="c4">DADOS DO RECLAMADO</span></p>`);
    sections.push(`<p class="c1"><span class="c0">Nome:</span> <span class="c5">${data.reclamado_nome}</span></p>`);
    if (data.reclamado_badge) sections.push(`<p class="c1"><span class="c0">Badge:</span> <span class="c5">#${data.reclamado_badge}</span></p>`);
    if (data.reclamado_patente) sections.push(`<p class="c1"><span class="c0">Patente:</span> <span class="c5">${data.reclamado_patente}</span></p>`);
    if (data.reclamado_unidade) sections.push(`<p class="c1"><span class="c0">Unidade:</span> <span class="c5">${data.reclamado_unidade}</span></p>`);
  }

  if (data.incidente_data) {
    sections.push(`<p class="c11"><span class="c4">DADOS DO INCIDENTE</span></p>`);
    sections.push(`<p class="c1"><span class="c0">Data:</span> <span class="c5">${data.incidente_data || "-"}</span></p>`);
    if (data.incidente_horario) sections.push(`<p class="c1"><span class="c0">Horário:</span> <span class="c5">${data.incidente_horario}</span></p>`);
    if (data.incidente_local) sections.push(`<p class="c1"><span class="c0">Local:</span> <span class="c5">${data.incidente_local}</span></p>`);
  }

  if (data.relato_fatos) {
    sections.push(`<p class="c11"><span class="c4">RELATO DOS FATOS</span></p>`);
    sections.push(`<p class="c1"><span class="c5">${data.relato_fatos}</span></p>`);
  }

  if (denuncia.descricao) {
    sections.push(`<p class="c11"><span class="c4">DESCRIÇÃO</span></p>`);
    sections.push(`<p class="c1"><span class="c5">${denuncia.descricao}</span></p>`);
  }

  if (data.provas_descricao) {
    sections.push(`<p class="c11"><span class="c4">PROVAS E EVIDÊNCIAS</span></p>`);
    if (data.provas_selecionadas?.length) {
      sections.push(`<p class="c1"><span class="c5">${data.provas_selecionadas.join(", ")}</span></p>`);
    }
    sections.push(`<p class="c1"><span class="c5">${data.provas_descricao}</span></p>`);
  }

  sections.push(`<hr>`);
  sections.push(`<p class="c14"><span class="c4">São Paulo, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.</span></p>`);

  printGeneric(title, sections.join("\n"));
};

export const printInvestigacao = (investigacao: Investigacao) => {
  const title = `INVESTIGAÇÃO INTERNA – ${investigacao.titulo || "Procedimento Investigatório"}`;
  const regNum = investigacao.numero_registro?.toString().padStart(4, '0') || '???';

  const sections: string[] = [];

  sections.push(`<p class="c1"><span class="c0">Registro:</span> <span class="c5">#${regNum}</span></p>`);
  sections.push(`<p class="c1"><span class="c0">Status:</span> <span class="c5">${(investigacao.status || "pendente").toUpperCase()}</span></p>`);

  if (investigacao.tipo_procedimento) {
    sections.push(`<p class="c1"><span class="c0">Tipo de Procedimento:</span> <span class="c5">${investigacao.tipo_procedimento}</span></p>`);
  }

  if (investigacao.investigado) {
    sections.push(`<p class="c1"><span class="c0">Investigado:</span> <span class="c5">${investigacao.investigado_patente || ""} ${investigacao.investigado}</span></p>`);
    if (investigacao.investigado_badge) sections.push(`<p class="c1"><span class="c0">Badge:</span> <span class="c5">#${investigacao.investigado_badge}</span></p>`);
    if (investigacao.investigado_unidade) sections.push(`<p class="c1"><span class="c0">Unidade:</span> <span class="c5">${investigacao.investigado_unidade}</span></p>`);
  }

  if (investigacao.autoridade_responsavel) {
    sections.push(`<p class="c1"><span class="c0">Autoridade Responsável:</span> <span class="c5">${investigacao.autoridade_patente || ""} ${investigacao.autoridade_responsavel}</span></p>`);
  }

  if (investigacao.origem_caso) {
    sections.push(`<p class="c1"><span class="c0">Origem:</span> <span class="c5">${investigacao.origem_caso}${investigacao.origem_outro ? " – " + investigacao.origem_outro : ""}</span></p>`);
  }

  if (investigacao.descricao) {
    sections.push(`<p class="c11"><span class="c4">DESCRIÇÃO SUMÁRIA DOS FATOS</span></p>`);
    sections.push(`<p class="c1"><span class="c5">${investigacao.descricao}</span></p>`);
  }

  if (investigacao.fundamentacao) {
    sections.push(`<p class="c11"><span class="c4">FUNDAMENTAÇÃO PARA ABERTURA</span></p>`);
    sections.push(`<p class="c1"><span class="c5">${investigacao.fundamentacao}</span></p>`);
  }

  if (investigacao.medidas_iniciais?.length) {
    sections.push(`<p class="c11"><span class="c4">MEDIDAS INICIAIS ADOTADAS</span></p>`);
    const medStr = investigacao.medidas_iniciais.map((m: string) => m === "Outro" && investigacao.medidas_outro ? `Outro: ${investigacao.medidas_outro}` : m).join(", ");
    sections.push(`<p class="c1"><span class="c5">${medStr}</span></p>`);
  }

  if (investigacao.detalhes_adicionais) {
    sections.push(`<p class="c1"><span class="c0">Detalhes Adicionais:</span> <span class="c5">${investigacao.detalhes_adicionais}</span></p>`);
  }

  sections.push(`<hr>`);
  sections.push(`<p class="c14"><span class="c4">São Paulo, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.</span></p>`);

  printGeneric(title, sections.join("\n"));
};

export const printDepoimento = (depoimento: Depoimento) => {
  const title = `DEPOIMENTO – ${depoimento.oficial_nome}`;

  const sections: string[] = [];

  sections.push(`<p class="c1"><span class="c0">Registro:</span> <span class="c5">#${depoimento.numero_registro?.toString().padStart(4, '0') || '???'}</span></p>`);

  sections.push(`<p class="c11"><span class="c4">DADOS DO DECLARANTE</span></p>`);
  sections.push(`<p class="c1"><span class="c0">Nome:</span> <span class="c5">${depoimento.oficial_nome}</span></p>`);
  sections.push(`<p class="c1"><span class="c0">Patente:</span> <span class="c5">${depoimento.oficial_patente || "-"}</span></p>`);
  sections.push(`<p class="c1"><span class="c0">R.E.:</span> <span class="c5">${depoimento.oficial_re || "-"}</span></p>`);
  sections.push(`<p class="c1"><span class="c0">Data:</span> <span class="c5">${formatDateSafe(depoimento.data_depoimento, "dd/MM/yyyy")}</span></p>`);
  if (depoimento.oficial_batalhao) {
    sections.push(`<p class="c1"><span class="c0">Batalhão:</span> <span class="c5">${depoimento.oficial_batalhao}</span></p>`);
  }

  sections.push(`<p class="c11"><span class="c4">DEPOIMENTO PRESTADO</span></p>`);
  sections.push(`<p class="c1"><span class="c5">${depoimento.depoimento}</span></p>`);

  if (depoimento.observacao) {
    sections.push(`<p class="c11"><span class="c4">OBSERVAÇÕES</span></p>`);
    sections.push(`<p class="c1"><span class="c5">${depoimento.observacao}</span></p>`);
  }

  sections.push(`<hr>`);
  sections.push(`<p class="c14"><span class="c4">São Paulo, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.</span></p>`);

  printGeneric(title, sections.join("\n"));
};
