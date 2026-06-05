import { format } from "date-fns";
import type { Depoimento, Relatorio } from "./types";

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

export const printRelatorio = (relatorio: Relatorio) => {
  const w = window.open("", "_blank");
  if (!w) return;
  const content = relatorio.conteudo || relatorio.dados_detalhados?.relato_fatos || "";
  const data = relatorio.dados_detalhados || {};

  w.document.write(`
    <html>
    <head>
      <title>${relatorio.titulo} - ${relatorio.tipo_denuncia}</title>
      <style>
        @page { margin: 20mm 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #1a1a1a;
          line-height: 1.6;
          padding: 20px;
        }
        .header { text-align: center; border-bottom: 2px solid #C9A03A; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { font-size: 16px; text-transform: uppercase; letter-spacing: 2px; color: #C9A03A; }
        .header p { font-size: 10px; color: #666; margin-top: 4px; }
        .badge { display: inline-block; padding: 2px 8px; border: 1px solid #ccc; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin: 2px; }
        .section { margin-bottom: 15px; }
        .section h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; border-left: 3px solid #C9A03A; padding-left: 8px; margin-bottom: 8px; color: #333; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .field { margin-bottom: 4px; }
        .field label { font-size: 9px; text-transform: uppercase; color: #999; letter-spacing: 1px; display: block; }
        .field span { font-size: 11px; color: #1a1a1a; }
        .content-block { border: 1px solid #ddd; padding: 12px; border-radius: 4px; margin-top: 8px; white-space: pre-wrap; font-size: 11px; line-height: 1.8; }
        .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 9px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
        hr { border: none; border-top: 1px dashed #ddd; margin: 12px 0; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${relatorio.tipo_denuncia}</h1>
        <p>PMESP · Corregedoria Geral · #${relatorio.numero_registro?.toString().padStart(4, '0') || '???'}</p>
        <p style="margin-top:4px;"><span class="badge">${relatorio.status.toUpperCase()}</span></p>
      </div>
      <div class="section">
        <h3>Identificação</h3>
        <div class="grid">
          <div class="field"><label>Título</label><span>${relatorio.titulo}</span></div>
          <div class="field"><label>Oficial</label><span>${relatorio.oficial}</span></div>
          <div class="field"><label>Data</label><span>${format(new Date(relatorio.created_at), "dd/MM/yyyy HH:mm")}</span></div>
          <div class="field"><label>Status</label><span>${(relatorio.status || "pendente").toUpperCase()}</span></div>
        </div>
      </div>
      ${data.numero_caso ? `
      <div class="section">
        <h3>Dados do Corregedor</h3>
        <div class="grid">
          <div class="field"><label>Nº do Caso</label><span>${data.numero_caso || "-"}</span></div>
          <div class="field"><label>Patente</label><span>${data.corregedor_patente || "-"}</span></div>
          <div class="field"><label>Abertura</label><span>${data.data_abertura || "-"}</span></div>
          <div class="field"><label>Recebimento</label><span>${data.data_recebimento || "-"}</span></div>
        </div>
      </div>` : ""}
      ${data.reclamante_nome ? `
      <div class="section">
        <h3>Reclamante</h3>
        <div class="grid">
          <div class="field"><label>Nome</label><span>${data.reclamante_nome}</span></div>
          <div class="field"><label>ID</label><span>${data.reclamante_id || "-"}</span></div>
          <div class="field"><label>Anônimo</label><span>${data.reclamante_anonimo || "-"}</span></div>
        </div>
      </div>` : ""}
      ${data.denunciado_nome ? `
      <div class="section">
        <h3>Policial Denunciado</h3>
        <div class="grid">
          <div class="field"><label>Nome</label><span>${data.denunciado_nome}</span></div>
          <div class="field"><label>Badge</label><span>#${data.denunciado_badge || "-"}</span></div>
          <div class="field"><label>Patente</label><span>${data.denunciado_patente || "-"}</span></div>
        </div>
      </div>` : ""}
      ${data.incidente_data ? `
      <div class="section">
        <h3>Incidente</h3>
        <div class="grid">
          <div class="field"><label>Data</label><span>${data.incidente_data || "-"}</span></div>
          <div class="field"><label>Horário</label><span>${data.incidente_horario || "-"}</span></div>
          <div class="field"><label>Local</label><span>${data.incidente_local || "-"}</span></div>
        </div>
      </div>` : ""}
      ${data.relato_fatos ? `<div class="section"><h3>Relato dos Fatos</h3><div class="content-block">${data.relato_fatos}</div></div>` : ""}
      ${content ? `<div class="section"><h3>Conteúdo</h3><div class="content-block">${content}</div></div>` : ""}
      ${data.testemunhas_nomes ? `<div class="section"><h3>Testemunhas</h3><p>${data.testemunhas_nomes}</p></div>` : ""}
      ${data.provas_descricao ? `<div class="section"><h3>Provas</h3><p>${data.provas_descricao}</p></div>` : ""}
      <div class="footer">PMESP · Corregedoria Geral · Documento Oficial · ${format(new Date(), "dd/MM/yyyy HH:mm")}</div>
      <script>window.print();window.close();<\u002fscript>
    </body>
    </html>
  `);
  w.document.close();
};

export const printDepoimento = (depoimento: Depoimento) => {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`
    <html>
    <head>
      <title>Depoimento - ${depoimento.oficial_nome}</title>
      <style>
        @page { margin: 20mm 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #1a1a1a;
          line-height: 1.6;
          padding: 20px;
        }
        .header { text-align: center; border-bottom: 2px solid #C9A03A; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { font-size: 16px; text-transform: uppercase; letter-spacing: 2px; color: #C9A03A; }
        .header p { font-size: 10px; color: #666; margin-top: 4px; }
        .section { margin-bottom: 15px; }
        .section h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; border-left: 3px solid #C9A03A; padding-left: 8px; margin-bottom: 8px; color: #333; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .field { margin-bottom: 4px; }
        .field label { font-size: 9px; text-transform: uppercase; color: #999; letter-spacing: 1px; display: block; }
        .field span { font-size: 11px; color: #1a1a1a; }
        .content-block { border: 1px solid #ddd; padding: 12px; border-radius: 4px; margin-top: 8px; white-space: pre-wrap; font-size: 11px; line-height: 1.8; }
        .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 9px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Depoimento</h1>
        <p>PMESP · Corregedoria Geral · #${depoimento.numero_registro?.toString().padStart(4, '0') || '???'}</p>
      </div>
      <div class="section">
        <h3>Dados do Declarante</h3>
        <div class="grid">
          <div class="field"><label>Nome</label><span>${depoimento.oficial_nome}</span></div>
          <div class="field"><label>Patente</label><span>${depoimento.oficial_patente || "-"}</span></div>
          <div class="field"><label>R.E.</label><span>${depoimento.oficial_re || "-"}</span></div>
          <div class="field"><label>Data</label><span>${formatDateSafe(depoimento.data_depoimento, "dd/MM/yyyy")}</span></div>
          <div class="field"><label>Batalhão</label><span>${depoimento.oficial_batalhao || "-"}</span></div>
        </div>
      </div>
      <div class="section">
        <h3>Depoimento Prestado</h3>
        <div class="content-block">${depoimento.depoimento}</div>
      </div>
      ${depoimento.observacao ? `<div class="section"><h3>Observações</h3><div class="content-block">${depoimento.observacao}</div></div>` : ""}
      <div class="footer">PMESP · Corregedoria Geral · Documento Oficial · ${format(new Date(), "dd/MM/yyyy HH:mm")}</div>
      <script>window.print();window.close();<\u002fscript>
    </body>
    </html>
  `);
  w.document.close();
};
