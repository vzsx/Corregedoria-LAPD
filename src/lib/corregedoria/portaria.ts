import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BRASAO_SP_LOGO, PM_LOGO } from "@/components/corregedoria/ipm-logos";

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

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style type="text/css">
ol{margin:0;padding:0}
table td,table th{padding:0}
.c0{color:#000000;font-weight:400;font-size:10pt;font-family:"Arial";font-style:normal}
.c1{padding-top:14pt;padding-bottom:4pt;line-height:1.0;orphans:2;widows:2;text-align:left}
.c2{color:#000000;font-weight:700;font-size:10pt;font-family:"Arial";font-style:normal}
.c3{font-weight:700}
.c4{font-size:10pt}
.c5{color:#000000;font-size:11pt;font-family:"Arial";font-style:normal}
.c6{padding-top:0pt;padding-bottom:0pt;line-height:1.15;orphans:2;widows:2;text-align:center}
.c7{padding-top:12pt;padding-bottom:12pt;line-height:1.0;orphans:2;widows:2;text-align:left}
.c8{background-color:#ffffff;max-width:451.4pt;padding:72pt 72pt 72pt 72pt}
.c9{padding-top:12pt;padding-bottom:12pt;line-height:1.0;text-align:center;height:11pt}
.c11{padding-top:12pt;padding-bottom:12pt;line-height:1.0;text-align:center}
.c12{padding-top:0pt;padding-bottom:0pt;line-height:1.15;text-align:right;height:11pt}
.c13{font-weight:400}
.c14{padding-top:12pt;padding-bottom:12pt;line-height:1.0;text-align:justify}
p{margin:0;color:#000000;font-size:11pt;font-family:"Arial"}
h3{padding-top:14pt;color:#434343;font-size:14pt;padding-bottom:4pt;font-family:"Arial";line-height:1.15;page-break-after:avoid;orphans:2;widows:2;text-align:left}
@media print{body{margin:0}.c8{max-width:none}}
</style>
</head>
<body class="c8 doc-content">

  <!-- CABECALHO -->
  <div>
    <p class="c6">
      <span class="c3 c5">GOVERNO DO ESTADO DE SÃO PAULO &nbsp;</span>
      <span style="overflow:hidden;display:inline-block;margin:0;border:0;width:80.95px;height:93.01px;">
        <img src="${BRASAO_SP_LOGO}" style="width:80.95px;height:93.01px;" title="">
      </span>
      <span style="overflow:hidden;display:inline-block;margin:0;border:0;width:92.58px;height:107.00px;">
        <img src="${PM_LOGO}" style="width:92.58px;height:107.00px;" title="">
      </span>
    </p>
    <p class="c6"><span class="c5 c3">SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA &nbsp;</span></p>
    <p class="c6"><span class="c5 c3">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO &nbsp;</span></p>
    <p class="c6"><span class="c3">QUARTEL DA CORREGEDORIA-GERAL DA POLÍCIA MILITAR<br></span></p>
  </div>

  <!-- TITULOS -->
  <p class="c14"><span class="c5 c3">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</span></p>
  <p class="c14"><span class="c5 c3">CORREGEDORIA DA POLÍCIA MILITAR</span></p>

  <!-- PORTARIA -->
  <h3 class="c1"><span class="c2">PORTARIA Nº${data.numero_portaria || "____"}/2026 – CPM</span></h3>

  <!-- TEXTO -->
  <p class="c7">
    <span class="c4 c3">O CORREGEDOR DA POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</span>
    <span class="c0">, no uso de suas atribuições legais e regulamentares, especialmente nos termos do Regulamento Disciplinar da Polícia Militar do Estado de São Paulo (RDPM),</span>
  </p>

  <p class="c7">
    <span class="c4 c3">CONSIDERANDO</span>
    <span class="c4">&nbsp;a necessidade de assegurar a regular, isenta e eficaz apuração dos fatos constantes de procedimento apuratório instaurado para verificar </span>
    <span class="c3 c4">suposta prática dos artigos: </span>
    <span class="c3">.____________<br></span>
    <span><br></span>
    <span class="c2">RESOLVE:</span>
  </p>

  <!-- ARTIGOS -->
  <p class="c7">
    <span class="c4 c3">Art. 1º</span>
    <span class="c4">&nbsp;Determinar o </span>
    <span class="c4 c3">afastamento cautelar do serviço operacional</span>
    <span class="c4">, pelo prazo </span>
    <span class="c4 c3">${dataInicio} a ${dataTermino}</span>
    <span class="c4">, dos seguintes policiais militares, a contar de </span>
    <span class="c2">${dataInicio}</span>
  </p>

  <p class="c7">
    <span class="c4">I – ${data.posto_graduacao || "________"} ${data.nome_policial || "________"}, RG PM nº ${data.rg_pm || "________"}, lotado(a) no(a) ${data.unidade || "________"};<br><br></span>
    <span class="c4 c3">Art. 2º</span>
    <span class="c4">&nbsp;Durante o afastamento, os policiais militares permanecerão </span>
    <span class="c4 c3">à disposição da Corregedoria da Polícia Militar</span>
    <span class="c4">, devendo cumprir rigorosamente as determinações administrativas que lhes forem expedidas, manter seus dados de contato atualizados e </span>
    <span class="c4 c3">abster-se de frequentar dependências operacionais</span>
    <span class="c0">, salvo mediante autorização expressa.</span>
  </p>

  <p class="c7">
    <span class="c4 c3">Art. 3º</span>
    <span class="c4">&nbsp;Os policiais militares ficam </span>
    <span class="c4 c3">temporariamente impedidos de exercer atividade operacional</span>
    <span class="c4">&nbsp;e de </span>
    <span class="c4 c3">portar arma de fogo institucional</span>
    <span class="c0">, devendo o armamento ser recolhido na forma da legislação e normas internas vigentes.</span>
  </p>

  <p class="c7">
    <span class="c4 c3">Art. 4º</span>
    <span class="c4">&nbsp;O afastamento de que trata esta Portaria possui </span>
    <span class="c4 c3">caráter meramente cautelar e não punitivo</span>
    <span class="c0">, podendo ser revisto ou revogado a qualquer tempo, conforme o andamento do procedimento apuratório.</span>
  </p>

  <p class="c7">
    <span class="c4 c3">Art. 5º</span>
    <span class="c0">&nbsp;Esta Portaria entra em vigor na data de sua publicação.</span>
  </p>

  <!-- PUBLIQUE-SE -->
  <p class="c7">
    <span class="c4 c3">Publique-se. Registre-se. Cumpra-se.</span>
    <hr>
  </p>

  <!-- DATA + ASSINATURA -->
  <p class="c11">
    <span class="c5 c3">São Paulo, ${dataEmissao}.<br></span>
  </p>

  <!-- ESPACO -->
  <p class="c9"><span class="c5 c3"></span></p>

  <!-- ASS: -->
  <p class="c11"><span class="c5 c3">Ass: ${data.responsavel_nome || "___________________________"}</span></p>
  ${data.responsavel_posto ? `<p class="c11"><span class="c5 c3">${data.responsavel_posto}</span></p>` : ""}
  <p class="c11"><span class="c5 c3">Corregedor da Polícia Militar do Estado de São Paulo</span></p>

  <!-- NUMERO DA PAGINA -->
  <div><p class="c12"><span class="c5 c13">1</span></p></div>

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
