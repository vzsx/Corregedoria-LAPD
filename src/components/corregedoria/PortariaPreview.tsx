import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PortariaData } from "@/lib/corregedoria/portaria";
import { BRASAO_SP_LOGO, PM_LOGO } from "./ipm-logos";

interface PortariaPreviewProps {
  data: PortariaData;
  inqueritoNumero?: string;
}

export function PortariaPreview({ data, inqueritoNumero }: PortariaPreviewProps) {
  const dataEmissao = format(new Date(data.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dataInicio = format(new Date(data.data_inicio), "dd/MM/yyyy");
  const dataTermino = format(new Date(data.data_termino), "dd/MM/yyyy");

  return (
    <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden print:shadow-none" id="portaria-document">
      <style>{`
        ol{margin:0;padding:0}
        table td,table th{padding:0}
        .pc0{color:#000000;font-weight:400;font-size:10pt;font-family:"Arial";font-style:normal}
        .pc1{padding-top:14pt;padding-bottom:4pt;line-height:1.0;orphans:2;widows:2;text-align:left}
        .pc2{color:#000000;font-weight:700;font-size:10pt;font-family:"Arial";font-style:normal}
        .pc3{font-weight:700}
        .pc4{font-size:10pt}
        .pc5{color:#000000;font-size:11pt;font-family:"Arial";font-style:normal}
        .pc6{padding-top:0pt;padding-bottom:0pt;line-height:1.15;orphans:2;widows:2;text-align:center}
        .pc7{padding-top:12pt;padding-bottom:12pt;line-height:1.0;orphans:2;widows:2;text-align:left}
        .pc8{background-color:#ffffff;max-width:451.4pt;padding:72pt 72pt 72pt 72pt;margin:0 auto}
        .pc9{padding-top:12pt;padding-bottom:12pt;line-height:1.0;text-align:center;height:11pt}
        .pc11{padding-top:12pt;padding-bottom:12pt;line-height:1.0;text-align:center}
        .pc12{padding-top:0pt;padding-bottom:0pt;line-height:1.15;text-align:right;height:11pt}
        .pc13{font-weight:400}
        .pc14{padding-top:12pt;padding-bottom:12pt;line-height:1.0;text-align:justify}
        .portaria-doc p{margin:0;color:#000000;font-size:11pt;font-family:"Arial"}
        .portaria-doc h3{padding-top:14pt;color:#434343;font-size:14pt;padding-bottom:4pt;font-family:"Arial";line-height:1.15;page-break-after:avoid;orphans:2;widows:2;text-align:left}
        @media print{.pc8{max-width:none}}
      `}</style>

      <div className="portaria-doc">
        <div className="pc8">
          {/* CABECALHO */}
          <div>
            <p className="pc6">
              <span className="pc3 pc5">GOVERNO DO ESTADO DE SÃO PAULO &nbsp;</span>
              <span style={{overflow:"hidden",display:"inline-block",margin:0,border:0,width:"80.95px",height:"93.01px" as any}}>
                <img src={BRASAO_SP_LOGO} style={{width:"80.95px",height:"93.01px"}} title="" />
              </span>
              <span style={{overflow:"hidden",display:"inline-block",margin:0,border:0,width:"92.58px",height:"107.00px" as any}}>
                <img src={PM_LOGO} style={{width:"92.58px",height:"107.00px"}} title="" />
              </span>
            </p>
            <p className="pc6"><span className="pc5 pc3">SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA &nbsp;</span></p>
            <p className="pc6"><span className="pc5 pc3">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO &nbsp;</span></p>
            <p className="pc6"><span className="pc3">QUARTEL DA CORREGEDORIA-GERAL DA POLÍCIA MILITAR<br /></span></p>
          </div>

          {/* TITULOS */}
          <p className="pc14"><span className="pc5 pc3">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</span></p>
          <p className="pc14"><span className="pc5 pc3">CORREGEDORIA DA POLÍCIA MILITAR</span></p>

          {/* PORTARIA */}
          <h3><span className="pc2">PORTARIA Nº{data.numero_portaria || "____"}/2026 – CPM</span></h3>

          {/* TEXTO */}
          <p className="pc7">
            <span className="pc4 pc3">O CORREGEDOR DA POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</span>
            <span className="pc0">, no uso de suas atribuições legais e regulamentares, especialmente nos termos do Regulamento Disciplinar da Polícia Militar do Estado de São Paulo (RDPM),</span>
          </p>

          <p className="pc7">
            <span className="pc4 pc3">CONSIDERANDO</span>
            <span className="pc4">&nbsp;a necessidade de assegurar a regular, isenta e eficaz apuração dos fatos constantes de procedimento apuratório instaurado para verificar </span>
            <span className="pc3 pc4">suposta prática dos artigos: </span>
            <span className="pc3">.____________<br /></span>
            <span><br /></span>
            <span className="pc2">RESOLVE:</span>
          </p>

          {/* ARTIGOS */}
          <p className="pc7">
            <span className="pc4 pc3">Art. 1º</span>
            <span className="pc4">&nbsp;Determinar o </span>
            <span className="pc4 pc3">afastamento cautelar do serviço operacional</span>
            <span className="pc4">, pelo prazo </span>
            <span className="pc4 pc3">{dataInicio} a {dataTermino}</span>
            <span className="pc4">, dos seguintes policiais militares, a contar de </span>
            <span className="pc2">{dataInicio}</span>
          </p>

          <p className="pc7">
            <span className="pc4">I – {data.posto_graduacao || "________"} {data.nome_policial || "________"}, RG PM nº {data.rg_pm || "________"}, lotado(a) no(a) {data.unidade || "________"};<br /><br /></span>
            <span className="pc4 pc3">Art. 2º</span>
            <span className="pc4">&nbsp;Durante o afastamento, os policiais militares permanecerão </span>
            <span className="pc4 pc3">à disposição da Corregedoria da Polícia Militar</span>
            <span className="pc4">, devendo cumprir rigorosamente as determinações administrativas que lhes forem expedidas, manter seus dados de contato atualizados e </span>
            <span className="pc4 pc3">abster-se de frequentar dependências operacionais</span>
            <span className="pc0">, salvo mediante autorização expressa.</span>
          </p>

          <p className="pc7">
            <span className="pc4 pc3">Art. 3º</span>
            <span className="pc4">&nbsp;Os policiais militares ficam </span>
            <span className="pc4 pc3">temporariamente impedidos de exercer atividade operacional</span>
            <span className="pc4">&nbsp;e de </span>
            <span className="pc4 pc3">portar arma de fogo institucional</span>
            <span className="pc0">, devendo o armamento ser recolhido na forma da legislação e normas internas vigentes.</span>
          </p>

          <p className="pc7">
            <span className="pc4 pc3">Art. 4º</span>
            <span className="pc4">&nbsp;O afastamento de que trata esta Portaria possui </span>
            <span className="pc4 pc3">caráter meramente cautelar e não punitivo</span>
            <span className="pc0">, podendo ser revisto ou revogado a qualquer tempo, conforme o andamento do procedimento apuratório.</span>
          </p>

          <p className="pc7">
            <span className="pc4 pc3">Art. 5º</span>
            <span className="pc0">&nbsp;Esta Portaria entra em vigor na data de sua publicação.</span>
          </p>

          {/* PUBLIQUE-SE */}
          <p className="pc7">
            <span className="pc4 pc3">Publique-se. Registre-se. Cumpra-se.</span>
            <hr />
          </p>

          {/* DATA */}
          <p className="pc11">
            <span className="pc5 pc3">São Paulo, {dataEmissao}.<br /></span>
          </p>

          {/* ESPACO */}
          <p className="pc9"><span className="pc5 pc3"></span></p>

          {/* ASS: */}
          <p className="pc11"><span className="pc5 pc3">Ass: {data.responsavel_nome || "___________________________"}</span></p>
          {data.responsavel_posto && <p className="pc11"><span className="pc5 pc3">{data.responsavel_posto}</span></p>}
          <p className="pc11"><span className="pc5 pc3">Corregedor da Polícia Militar do Estado de São Paulo</span></p>

          {/* NUMERO DA PAGINA */}
          <div><p className="pc12"><span className="pc5 pc13">1</span></p></div>
        </div>
      </div>
    </div>
  );
}
