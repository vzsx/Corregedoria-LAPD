import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BRASAO_SP_LOGO, PM_LOGO } from "@/components/corregedoria/ipm-logos";
import { PMESP_WATERMARK } from "@/components/corregedoria/pmesp-watermark";

export interface PortariaData {
  numero_portaria: string;
  data_emissao: string;
  posto_graduacao: string;
  nome_policial: string;
  rg_pm: string;
  unidade: string;
  data_inicio: string;
  data_termino: string;
  artigos: string;
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
@import url('https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap');

@page {
  size: A4 portrait;
  margin: 3cm 2cm 3cm 2cm;
}

ol{margin:0;padding:0}
table td,table th{padding:0}

*{box-sizing:border-box}

p{
  margin:0 0 8pt 0;
  color:#000000;
  font-size:11pt;
  font-family:"Arial",sans-serif;
  line-height:1.15;
  text-align:justify;
  overflow-wrap:break-word;
}

/* Classes portaria — sem recuo, espacamento compacto */
.c0{color:#000000;font-weight:400;font-size:11pt;font-family:"Arial",sans-serif;font-style:normal}
.c1{padding:0;margin:0 0 8pt 0;line-height:1.15;orphans:2;widows:2;text-align:justify}
.c2{color:#000000;font-weight:700;font-size:11pt;font-family:"Arial",sans-serif;font-style:normal}
.c3{font-weight:700}
.c4{font-size:11pt}
.c5{color:#000000;font-size:11pt;font-family:"Arial",sans-serif;font-style:normal}
.c6{padding:0;margin:0;line-height:1.15;orphans:2;widows:2;text-align:center}
.c7{padding:0;margin:0 0 8pt 0;line-height:1.15;orphans:2;widows:2;text-align:justify}
.c8{background-color:#ffffff;max-width:160mm}
.c9{padding:0;margin:0 0 8pt 0;line-height:1.15;text-align:center}
.c11{padding:0;margin:0 0 8pt 0;line-height:1.15;text-align:center}
.c12{padding:0;margin:0;line-height:1.15;text-align:right;height:11pt}
.c13{font-weight:400}
.c14{padding:0;margin:0 0 8pt 0;line-height:1.15;text-align:justify}
h3{margin:14pt 0 8pt 0;color:#434343;font-size:12pt;font-family:"Arial",sans-serif;line-height:1.15;page-break-after:avoid;orphans:2;widows:2;text-align:left}
.doc-content{position:relative}
table{max-width:100%;page-break-inside:avoid}
img{max-width:100%}
.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.08;pointer-events:none;z-index:0;width:15.9cm;height:13.5cm;object-fit:contain}
.doc-content > *:not(.watermark){position:relative;z-index:1}
.signature-block{page-break-inside:avoid}
.signature-name{font-family:'Pinyon Script',cursive;font-size:30pt;color:#000;font-weight:400;line-height:1}
.signature-line{display:inline-block;width:80mm;border-bottom:1px solid #000;height:12pt}
.signature-title{font-size:11pt;color:#000;margin-top:2pt}
@media print{
  body{margin:0;padding:0}
  .c8{max-width:none;padding:0}
  .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.08}
}
</style>
</head>
<body class="c8 doc-content">

  <!-- MARCA D'AGUA -->
  <img class="watermark" src="${PMESP_WATERMARK}" alt="">

  <!-- CABECALHO: tabela com logos laterais -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
    <tr>
      <td style="width:80px;vertical-align:middle;padding:0;text-align:center;">
        <img src="${BRASAO_SP_LOGO}" style="width:75px;height:auto;" title="">
      </td>
      <td style="vertical-align:middle;padding:0 8px;text-align:center;">
        <p class="c6"><span class="c3 c5">GOVERNO DO ESTADO DE SÃO PAULO</span></p>
        <p class="c6"><span class="c3 c5">SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA</span></p>
        <p class="c6"><span class="c3 c5">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</span></p>
        <p class="c6"><span class="c3">QUARTEL DA CORREGEDORIA-GERAL DA POLÍCIA MILITAR</span></p>
      </td>
      <td style="width:92px;vertical-align:middle;padding:0;text-align:center;">
        <img src="${PM_LOGO}" style="width:88px;height:auto;" title="">
      </td>
    </tr>
  </table>

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
    <span class="c3">${data.artigos || "____________"}</span>
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
  <div class="signature-block" style="margin-top:30pt;text-align:center;">
    <p class="c11" style="margin:0 0 18pt 0;">
      <span class="c5 c3">São Paulo, ${dataEmissao}.</span>
    </p>
    <p class="c11" style="margin:0 0 6pt 0;line-height:1;">
      <span class="c5 c3">Ass: </span>${data.responsavel_nome ? `<span class="signature-name">${data.responsavel_nome}</span>` : `<span class="signature-line"></span>`}
    </p>
    <p class="c11" style="margin:0;line-height:1;">
      <span class="signature-title">${data.responsavel_nome ? `${data.responsavel_posto ? data.responsavel_posto + " " : ""}${data.responsavel_nome}` : `<span class="signature-line" style="width:46mm;height:8pt;"></span>`}</span>
    </p>
    <p class="c11" style="margin:2pt 0 0 0;">
      <span class="c5 c3" style="font-size:11pt;">Corregedor da Polícia Militar do Estado de São Paulo</span>
    </p>
  </div>

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
