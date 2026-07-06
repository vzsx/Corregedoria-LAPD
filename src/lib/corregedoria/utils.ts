import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BRASAO_SP_LOGO, PM_LOGO } from "@/components/corregedoria/ipm-logos";
import { PMESP_WATERMARK } from "@/components/corregedoria/pmesp-watermark";
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
@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');

/* Layout oficial compacto em A4, respeitando os limites da pagina */
@page {
  size: A4 portrait;
  margin: 3cm 2cm 3cm 2cm;
}

/* Reset */
ol{margin:0;padding:0}
table td,table th{padding:0}

*{box-sizing:border-box}

/* Tipografia oficial: Arial compacto, conforme modelo visual */
p{
  margin:0 0 8pt 0;
  color:#000000;
  font-size:11pt;
  font-family:"Arial",sans-serif;
  line-height:1.15;
  text-align:justify;
  overflow-wrap:break-word;
}
h2{
  margin:14pt 0 8pt 0;
  color:#000000;
  font-size:11pt;
  font-family:"Arial",sans-serif;
  line-height:1.15;
  page-break-after:avoid;
  orphans:2;
  widows:2;
  text-align:left;
}

/* Classes de paragrafo — sem recuo, espacamento compacto */
.c4{color:#000000;font-weight:700;text-decoration:none;vertical-align:baseline;font-size:11pt;font-family:"Arial",sans-serif;font-style:normal}
.c11{padding:0;margin:0 0 8pt 0;line-height:1.15;orphans:2;widows:2;text-align:justify}
.c17{padding:0;margin:8pt 0;line-height:1.15;orphans:2;widows:2;text-align:left}
.c3{padding:0;margin:0;line-height:1.15;orphans:2;widows:2;text-align:center}
.c1{padding:0;margin:0 0 8pt 0;line-height:1.15;orphans:2;widows:2;text-align:justify}
.c10{font-weight:400;text-decoration:none;vertical-align:baseline;font-size:11pt;font-family:"Arial",sans-serif;font-style:normal}
.c14{padding:0;margin:0 0 8pt 0;line-height:1.15;orphans:2;widows:2;text-align:center}
.c9{font-weight:400;text-decoration:none;vertical-align:baseline;font-size:11pt;font-family:"Arial",sans-serif;font-style:normal}
.c15{padding:0;margin:14pt 0 8pt 0;line-height:1.15;orphans:2;widows:2;text-align:left;page-break-after:avoid}
.c12{text-decoration:none;vertical-align:baseline;font-size:11pt;font-family:"Arial",sans-serif;font-style:normal}
.c6{background-color:#ffffff;max-width:160mm}

/* Texto bold e italic */
.c0{color:#434343;font-weight:700}
.c2{font-style:italic}
.c5{color:#434343}
.c7{font-weight:700}

/* Container do documento */
.doc-content{position:relative}
table{max-width:100%;page-break-inside:avoid}
img{max-width:100%}

/* Marca d'agua */
.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.08;pointer-events:none;z-index:0;width:15.9cm;height:13.5cm;object-fit:contain}
.doc-content > *:not(.watermark){position:relative;z-index:1}

/* Assinatura */
.signature-block{page-break-inside:avoid}
.signature-name{font-family:'Great Vibes',cursive;font-size:30pt;color:#000;font-weight:400;line-height:1}
.signature-line{display:inline-block;width:80mm;border-bottom:1px solid #000;height:12pt}
.signature-title{font-size:11pt;color:#000;margin-top:2pt}

/* Impressao */
@media print{
  body{margin:0;padding:0}
  .c6{max-width:none;padding:0}
  .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.08}
}
</style>
`;

function generateSignatureBlock(autorNome?: string, autorPosto?: string): string {
  const dataFormatada = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const nome = autorNome?.trim() || "";
  const posto = autorPosto?.trim() || "";
  const assinatura = nome ? `<span class="signature-name">${nome}</span>` : `<span class="signature-line"></span>`;
  const identificacao = nome ? `${posto ? posto + " " : ""}${nome}` : `<span class="signature-line" style="width:46mm;height:8pt;"></span>`;
  return `
  <div class="signature-block" style="margin-top:30pt;text-align:center;">
    <p class="c14" style="margin:0 0 18pt 0;"><span class="c4">São Paulo, ${dataFormatada}.</span></p>
    <p class="c14" style="margin:0 0 6pt 0;line-height:1;">
      <span class="c4">Ass: </span>${assinatura}
    </p>
    <p class="c14" style="margin:0;line-height:1;">
      <span class="signature-title">${identificacao}</span>
    </p>
    <p class="c14" style="margin:2pt 0 0 0;">
      <span class="c4" style="font-size:11pt;">Corregedor da Polícia Militar do Estado de São Paulo</span>
    </p>
  </div>`;
}

function wrapWithIpmLayout(title: string, bodyContent: string, autorNome?: string, autorPosto?: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${IPM_BASE_CSS}
</head>
<body class="c6 doc-content">

  <!-- MARCA D'AGUA -->
  <img class="watermark" src="${PMESP_WATERMARK}" alt="">

  <!-- CABECALHO -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
    <tr>
      <td style="width:80px;vertical-align:middle;padding:0;text-align:center;">
        <img src="${BRASAO_SP_LOGO}" style="width:75px;height:auto;" title="">
      </td>
      <td style="vertical-align:middle;padding:0 8px;text-align:center;">
        <p class="c3"><span class="c4">GOVERNO DO ESTADO DE SÃO PAULO</span></p>
        <p class="c3"><span class="c4">SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA</span></p>
        <p class="c3"><span class="c4">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</span></p>
        <p class="c3"><span class="c7">QUARTEL DA CORREGEDORIA-GERAL DA POLÍCIA MILITAR</span></p>
      </td>
      <td style="width:92px;vertical-align:middle;padding:0;text-align:center;">
        <img src="${PM_LOGO}" style="width:88px;height:auto;" title="">
      </td>
    </tr>
  </table>

  <!-- TITULOS -->
  <p class="c11"><span class="c4">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</span></p>
  <p class="c11"><span class="c4">CORREGEDORIA DA POLÍCIA MILITAR</span></p>

  <!-- TITULO DO DOCUMENTO -->
  <h1 class="c15"><span class="c12 c0">${title}</span></h1>

  <!-- CONTEUDO -->
  ${bodyContent}

  <!-- ASSINATURA -->
  ${generateSignatureBlock(autorNome, autorPosto)}

</body>
</html>`;
}

function printGeneric(title: string, bodyContent: string, autorNome?: string, autorPosto?: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(wrapWithIpmLayout(title, bodyContent, autorNome, autorPosto));
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

  printGeneric(title, sections.join("\n"), relatorio.oficial, relatorio.dados_detalhados?.corregedor_patente);
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

  printGeneric(title, sections.join("\n"), investigacao.autoridade_responsavel, investigacao.autoridade_patente);
};

export const printDepoimento = (depoimento: Depoimento) => {
  const title = `DEPOIMENTO – ${depoimento.oficial_nome}`;
  const registradorNome = depoimento.registrador_nome?.trim() || "";
  const registradorPatente = depoimento.registrador_patente?.trim() || "";

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

  sections.push(`<p class="c11"><span class="c4">POLICIAL REGISTRADOR</span></p>`);
  sections.push(`<p class="c1"><span class="c0">Nome:</span> <span class="c5">${registradorNome || "-"}</span></p>`);
  sections.push(`<p class="c1"><span class="c0">Patente:</span> <span class="c5">${registradorPatente || "-"}</span></p>`);

  sections.push(`<p class="c11"><span class="c4">DEPOIMENTO PRESTADO</span></p>`);
  sections.push(`<p class="c1"><span class="c5">${depoimento.depoimento}</span></p>`);

  if (depoimento.observacao) {
    sections.push(`<p class="c11"><span class="c4">OBSERVAÇÕES</span></p>`);
    sections.push(`<p class="c1"><span class="c5">${depoimento.observacao}</span></p>`);
  }

  printGeneric(
    title,
    sections.join("\n"),
    registradorNome || undefined,
    registradorPatente || undefined,
  );
};
