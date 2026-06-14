import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface PortariaData {
  numero_portaria: string;
  data_emissao: string;
  posto_graduacao: string;
  nome_policial: string;
  rg_pm: string;
  unidade: string;
  data_inicio: string;
  data_termino: string;
  inquerito_numero: string;
  responsavel_nome: string;
  responsavel_posto: string;
}

export function generatePortariaText(data: PortariaData): string {
  const dataEmissao = format(new Date(data.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dataInicio = format(new Date(data.data_inicio), "dd/MM/yyyy");
  const dataTermino = format(new Date(data.data_termino), "dd/MM/yyyy");
  const cidade = "São Paulo";

  return [
    `PORTARIA Nº ${data.numero_portaria} – CPM`,
    ``,
    `O ${data.responsavel_nome || "CORREGEDOR GERAL"}, ${data.responsavel_posto || "Corregedor Geral da Polícia Militar"}, no uso de suas atribuições legais e com fundamento no disposto na legislação vigente,`,
    ``,
    `RESOLVE:`,
    ``,
    `Art. 1º Determinar o afastamento cautelar do serviço operacional, no período de ${dataInicio} a ${dataTermino}, do seguinte policial militar:`,
    ``,
    `I – ${data.posto_graduacao} ${data.nome_policial}, RG PM nº ${data.rg_pm}, lotado(a) no(a) ${data.unidade}.`,
    ``,
    `Art. 2º Durante o afastamento, o policial militar permanecerá à disposição da Corregedoria da Polícia Militar, devendo cumprir rigorosamente as determinações administrativas que lhe forem expedidas, manter seus dados de contato atualizados e abster-se de frequentar dependências operacionais, salvo mediante autorização expressa.`,
    ``,
    `Art. 3º O policial militar fica temporariamente impedido de exercer atividade operacional e de portar arma de fogo institucional, devendo o armamento ser recolhido na forma da legislação e normas internas vigentes.`,
    ``,
    `Art. 4º O afastamento de que trata esta Portaria possui caráter meramente cautelar e não punitivo, podendo ser revisto ou revogado a qualquer tempo, conforme o andamento do procedimento apuratório.`,
    ``,
    `Art. 5º Esta Portaria entra em vigor na data de sua publicação.`,
    ``,
    `REGISTRE-SE, PUBLIQUE-SE E CUMPRA-SE.`,
    ``,
    `${cidade}, ${dataEmissao}.`,
    ``,
    `____________________________________`,
    `${data.responsavel_nome || "Corregedor Geral"}`,
    `${data.responsavel_posto || "Corregedor Geral da Polícia Militar"}`,
  ].join("\n");
}

export function generatePortariaHTML(data: PortariaData, inqueritoNumero?: string): string {
  const dataEmissao = format(new Date(data.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dataInicio = format(new Date(data.data_inicio), "dd/MM/yyyy");
  const dataTermino = format(new Date(data.data_termino), "dd/MM/yyyy");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Portaria nº ${data.numero_portaria} - CPM</title>
  <style>
    @page { margin: 2.5cm 2cm 2cm 2cm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #000;
    }
    .header .gov { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .header .org { font-size: 9pt; margin-top: 2px; }
    .header .title { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-top: 8px; letter-spacing: 2px; }
    .header .subtitle { font-size: 11pt; font-weight: bold; text-transform: uppercase; margin-top: 4px; }
    .portaria-num {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 30px 0 20px 0;
    }
    .info-box {
      border: 1px solid #999;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 10pt;
      background: #f9f9f9;
    }
    .info-box table { width: 100%; border-collapse: collapse; }
    .info-box td { padding: 3px 8px; }
    .info-box td:first-child { font-weight: bold; width: 180px; }
    .ementa {
      text-align: justify;
      font-size: 11pt;
      margin-bottom: 25px;
      font-style: italic;
    }
    .resolve {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 25px 0 20px 0;
      letter-spacing: 3px;
    }
    .artigo {
      text-align: justify;
      font-size: 12pt;
      margin-bottom: 12px;
      text-indent: 2cm;
    }
    .artigo strong { font-weight: bold; }
    .final {
      text-align: center;
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 25px 0 30px 0;
      letter-spacing: 2px;
    }
    .rodape {
      text-align: center;
      margin-top: 50px;
    }
    .rodape .local-data { font-size: 11pt; margin-bottom: 15px; }
    .rodape .linha { font-size: 11pt; margin-bottom: 5px; }
    .rodape .nome { font-size: 11pt; font-weight: bold; }
    .rodape .cargo { font-size: 10pt; }
    .footer-note {
      text-align: center;
      font-size: 8pt;
      color: #666;
      margin-top: 40px;
      padding-top: 10px;
      border-top: 1px solid #999;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="gov">Governo do Estado de São Paulo</div>
    <div class="org">Secretaria de Estado da Segurança Pública</div>
    <div class="org">Polícia Militar do Estado de São Paulo</div>
    <div class="title">Quartel da Corregedoria-Geral da Polícia Militar</div>
    <div class="subtitle">Corregedoria da Polícia Militar</div>
  </div>

  <div class="portaria-num">PORTARIA Nº ${data.numero_portaria} – CPM</div>

  ${inqueritoNumero ? `<div class="info-box"><table><tr><td>Inquérito Vinculado:</td><td>${inqueritoNumero}</td></tr><tr><td>Policial:</td><td>${data.posto_graduacao} ${data.nome_policial} – RG PM nº ${data.rg_pm}</td></tr><tr><td>Período:</td><td>${dataInicio} a ${dataTermino}</td></tr></table></div>` : ''}

  <div class="ementa">
    O ${data.responsavel_nome || "CORREGEDOR GERAL"}, ${data.responsavel_posto || "Corregedor Geral da Polícia Militar"}, no uso de suas atribuições legais e com fundamento no disposto na legislação vigente,
  </div>

  <div class="resolve">R E S O L V E:</div>

  <div class="artigo">
    <strong>Art. 1º</strong> Determinar o afastamento cautelar do serviço operacional, no período de ${dataInicio} a ${dataTermino}, do seguinte policial militar:
  </div>

  <div class="artigo" style="text-indent: 3cm;">
    <strong>I –</strong> ${data.posto_graduacao} ${data.nome_policial}, RG PM nº ${data.rg_pm}, lotado(a) no(a) ${data.unidade}.
  </div>

  <div class="artigo">
    <strong>Art. 2º</strong> Durante o afastamento, o policial militar permanecerá à disposição da Corregedoria da Polícia Militar, devendo cumprir rigorosamente as determinações administrativas que lhe forem expedidas, manter seus dados de contato atualizados e abster-se de frequentar dependências operacionais, salvo mediante autorização expressa.
  </div>

  <div class="artigo">
    <strong>Art. 3º</strong> O policial militar fica temporariamente impedido de exercer atividade operacional e de portar arma de fogo institucional, devendo o armamento ser recolhido na forma da legislação e normas internas vigentes.
  </div>

  <div class="artigo">
    <strong>Art. 4º</strong> O afastamento de que trata esta Portaria possui caráter meramente cautelar e não punitivo, podendo ser revisto ou revogado a qualquer tempo, conforme o andamento do procedimento apuratório.
  </div>

  <div class="artigo">
    <strong>Art. 5º</strong> Esta Portaria entra em vigor na data de sua publicação.
  </div>

  <div class="final">REGISTRE-SE, PUBLIQUE-SE E CUMPRA-SE.</div>

  <div class="rodape">
    <div class="local-data">São Paulo, ${dataEmissao}.</div>
    <div class="linha">____________________________________</div>
    <div class="nome">${data.responsavel_nome || "Corregedor Geral"}</div>
    <div class="cargo">${data.responsavel_posto || "Corregedor Geral da Polícia Militar"}</div>
  </div>

  <div class="footer-note">
    Documento gerado eletronicamente em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} - Corregedoria Geral PMESP
  </div>
</body>
</html>`;
}

export function printPortaria(data: PortariaData, inqueritoNumero?: string) {
  const html = generatePortariaHTML(data, inqueritoNumero);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
}
