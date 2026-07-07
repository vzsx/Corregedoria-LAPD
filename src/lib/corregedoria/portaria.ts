import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BRASAO_SP_LOGO, PM_LOGO } from "@/components/corregedoria/ipm-logos";
import { PMESP_WATERMARK } from "@/components/corregedoria/pmesp-watermark";

export interface PortariaData {
  tipo_afastamento?: "cautelar" | "disciplinar";
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
  periodo?: "determinado" | "indeterminado";
}

export function generatePortariaText(data: PortariaData): string {
  const dataEmissao = format(new Date(data.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dataInicio = format(new Date(data.data_inicio), "dd/MM/yyyy");
  const cidade = "São Paulo";
  const isIndeterminado = data.periodo === "indeterminado";
  const isDisciplinar = data.tipo_afastamento === "disciplinar";
  const dataTermino = isIndeterminado ? "" : format(new Date(data.data_termino), "dd/MM/yyyy");

  const art1Cautelar = isIndeterminado
    ? `Art. 1º Determinar o afastamento cautelar do serviço operacional, por prazo indeterminado dos seguintes policiais militares, a contar de ${dataInicio}:`
    : `Art. 1º Determinar o afastamento cautelar do serviço operacional, pelo prazo ${dataInicio} a ${dataTermino}, dos seguintes policiais militares, a contar de ${dataInicio}:`;

  const art3Disciplinar = isIndeterminado
    ? `Art. 3º A medida disciplinar adicional de afastamento entrará em vigor em ${dataInicio}, devendo o policial militar permanecer afastado até nova deliberação da autoridade competente ou prazo que vier a ser fixado em decisão posterior.`
    : `Art. 3º A medida disciplinar adicional de afastamento entrará em vigor em ${dataInicio}, devendo o policial militar permanecer afastado até ${dataTermino}, nova deliberação da autoridade competente ou prazo que vier a ser fixado em decisão posterior.`;

  if (isDisciplinar) {
    return [
      `BOLETIM CORRECIONAL Nº ${data.numero_portaria}/2026`,
      ``,
      `INSTAURAÇÃO DE PROCESSO ADMINISTRATIVO DISCIPLINAR COM AFASTAMENTO TEMPORÁRIO`,
      ``,
      `O Corregedor ${data.responsavel_nome || "________________"} da Polícia Militar do Estado de São Paulo, no exercício de suas atribuições legais e regulamentares, com fundamento nos princípios da legalidade, disciplina, hierarquia e moralidade administrativa,`,
      ``,
      `RESOLVE:`,
      ``,
      `Art. 1º Instaurar Processo Administrativo Disciplinar (PAD) para apuração integral dos fatos.`,
      ``,
      `Art. 2º Determinar, como medida disciplinar adicional, o afastamento dos policiais militares abaixo relacionados das atividades operacionais e funções correlatas:`,
      ``,
      `I – ${data.posto_graduacao || "________"} ${data.nome_policial || "________"}, RG PM nº ${data.rg_pm || "________"}, lotado(a) no(a) ${data.unidade || "________"}.`,
      ``,
      art3Disciplinar,
      ``,
      `Publique-se. Registre-se. Cumpra-se.`,
      ``,
      `${cidade}, ${dataEmissao}.`,
      ``,
      `____________________________________`,
      `${data.responsavel_nome || "________________"}`,
      `${data.responsavel_posto || ""}`,
    ].join("\n");
  }

  return [
    `PORTARIA Nº ${data.numero_portaria} – CPM`,
    ``,
    `O ${data.responsavel_nome || "CORREGEDOR GERAL"}, ${data.responsavel_posto || "Corregedor Geral da Polícia Militar"}, no uso de suas atribuições legais e com fundamento no disposto na legislação vigente,`,
    ``,
    `RESOLVE:`,
    ``,
    art1Cautelar,
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
  const isIndeterminado = data.periodo === "indeterminado";
  const isDisciplinar = data.tipo_afastamento === "disciplinar";
  const dataTermino = isIndeterminado ? "" : format(new Date(data.data_termino), "dd/MM/yyyy");

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
.badge-tipo{display:inline-block;padding:2pt 8pt;border-radius:3pt;font-size:9pt;font-weight:700;letter-spacing:0.5pt;margin-bottom:8pt}
.badge-cautelar{background-color:#FEF3C7;color:#92400E;border:1pt solid #F59E0B}
.badge-disciplinar{background-color:#FEE2E2;color:#991B1B;border:1pt solid #EF4444}
.badge-determinado{background-color:#DBEAFE;color:#1E40AF;border:1pt solid #3B82F6}
.badge-indeterminado{background-color:#E0E7FF;color:#3730A3;border:1pt solid #6366F1}
@media print{
  body{margin:0;padding:0}
  .c8{max-width:none;padding:0}
  .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.08}
  .badge-tipo{-webkit-print-color-adjust:exact;print-color-adjust:exact}
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

  ${isDisciplinar ? `
  <!-- BOLETIM CORRECIONAL -->
  <h3 class="c1"><span class="c2">BOLETIM CORRECIONAL Nº ${data.numero_portaria || "____"}/2026</span></h3>
  <p class="c14"><span class="c5 c3">INSTAURAÇÃO DE PROCESSO ADMINISTRATIVO DISCIPLINAR COM AFASTAMENTO TEMPORÁRIO</span></p>

  <p class="c7"><span class="c4 c3">O Corregedor ${data.responsavel_nome || "________________"} da Polícia Militar do Estado de São Paulo</span><span class="c0">, no exercício de suas atribuições legais e regulamentares, com fundamento nos princípios da legalidade, disciplina, hierarquia e moralidade administrativa, bem como nas disposições do Regulamento Disciplinar da Polícia Militar e demais normas institucionais vigentes,</span></p>

  <p class="c7"><span class="c4 c3">CONSIDERANDO</span><span class="c0"> a denúncia formal regularmente protocolada perante esta Corregedoria, instruída com elementos audiovisuais que apontam indícios de possíveis irregularidades funcionais;</span></p>
  <p class="c7"><span class="c4 c3">CONSIDERANDO</span><span class="c0"> a necessidade de apuração ampla, técnica, imparcial e rigorosa dos fatos narrados, assegurando aos envolvidos o pleno exercício do contraditório e da ampla defesa, nos termos do devido processo legal;</span></p>
  <p class="c7"><span class="c4 c3">CONSIDERANDO</span><span class="c0"> que os elementos preliminares indicam, em tese, possíveis transgressões disciplinares relacionadas à conduta funcional, tratamento dispensado a superiores, pares e civis, emprego de algemas, uso progressivo da força e eventual descumprimento de deveres regulamentares;</span></p>
  <p class="c7"><span class="c4 c3">CONSIDERANDO</span><span class="c0"> a necessidade de resguardar a regularidade da instrução processual, a preservação da disciplina institucional e a lisura da apuração administrativa,</span></p>

  <p class="c14"><span class="c2">RESOLVE:</span></p>

  <p class="c7"><span class="c4 c3">Art. 1º -</span><span class="c0"> Instaurar Processo Administrativo Disciplinar (PAD) para apuração integral dos fatos constantes na denúncia formal e nas provas audiovisuais anexadas.</span></p>
  <p class="c7"><span class="c4 c3">Art. 2º -</span><span class="c0"> Determinar, como medida disciplinar adicional, o afastamento dos policiais militares abaixo relacionados das atividades operacionais e funções correlatas:</span></p>
  <p class="c7"><span class="c0">• ${data.posto_graduacao || "________"} ${data.nome_policial || "________"}, RG PM nº ${data.rg_pm || "________"}, lotado(a) no(a) ${data.unidade || "________"}.</span></p>
  <p class="c7"><span class="c4 c3">Art. 3º -</span><span class="c0"> A medida disciplinar adicional de afastamento entrará em vigor em ${dataInicio}, devendo o policial militar permanecer afastado ${isIndeterminado ? "até nova deliberação da autoridade competente ou prazo que vier a ser fixado em decisão posterior." : `até ${dataTermino}, nova deliberação da autoridade competente ou prazo que vier a ser fixado em decisão posterior.`}</span></p>
  <p class="c7"><span class="c4 c3">Art. 4º -</span><span class="c0"> O afastamento previsto nesta decisão possui natureza disciplinar e administrativa, sendo aplicado em razão da necessidade de preservação da ordem, da disciplina e do regular funcionamento institucional, sem prejuízo da continuidade da apuração dos fatos no âmbito do Processo Administrativo Disciplinar.</span></p>
  <p class="c7"><span class="c4 c3">Art. 5º -</span><span class="c0"> O policial militar ora afastado permanecerá à disposição da Corregedoria da Polícia Militar, devendo atender às convocações, diligências e determinações expedidas pela Autoridade Correcional durante o período de vigência da medida.</span></p>
  <p class="c7"><span class="c4 c3">Art. 6º -</span><span class="c0"> Fica determinada a designação de Comissão Processante, mediante Portaria específica, para condução, instrução e conclusão do presente Processo Administrativo Disciplinar.</span></p>
  <p class="c7"><span class="c4 c3">Art. 7º -</span><span class="c0"> Concluída a instrução processual, os autos deverão ser encaminhados ao Comando-Geral para decisão final e adoção das providências cabíveis.</span></p>

  <p class="c7"><span class="c4 c3">Publique-se.<br>Registre-se.<br>Cumpra-se.</span></p>
  <p class="c7"><span class="c4 c3">________________</span></p>
  ` : `
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
    ${isIndeterminado
      ? `<span class="c4">&nbsp;Determinar o afastamento cautelar do serviço operacional, por prazo indeterminado dos seguintes policiais militares, a contar de </span><span class="c2">${dataInicio}</span>`
      : `<span class="c4">&nbsp;Determinar o afastamento cautelar do serviço operacional, pelo prazo </span><span class="c4 c3">${dataInicio} a ${dataTermino}</span><span class="c4">, dos seguintes policiais militares, a contar de </span><span class="c2">${dataInicio}</span>`
    }
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
  `}

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
