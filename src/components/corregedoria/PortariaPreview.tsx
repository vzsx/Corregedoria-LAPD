import React from "react";
import { format } from "date-fns";
import type { PortariaData } from "@/lib/corregedoria/portaria";

interface PortariaPreviewProps {
  data: PortariaData;
}

export function PortariaPreview({ data }: PortariaPreviewProps) {
  const dataFormatada = format(new Date(data.data_portaria), "dd 'de' MMMM 'de' yyyy");

  return (
    <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden print:shadow-none" id="portaria-document">
      <style>{`
        .portaria-doc { font-family: 'Times New Roman', Times, serif; }
        .portaria-doc .header { text-align: center; padding: 30px 20px 20px; border-bottom: 2px solid #000; }
        .portaria-doc .header .gov { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1a1a2e; }
        .portaria-doc .header .org { font-size: 12px; margin-top: 2px; color: #333; }
        .portaria-doc .header .title { font-size: 15px; font-weight: bold; text-transform: uppercase; margin-top: 8px; letter-spacing: 2px; color: #1a1a2e; }
        .portaria-doc .header .subtitle { font-size: 12px; font-weight: bold; text-transform: uppercase; margin-top: 4px; color: #1a1a2e; }
        .portaria-doc .content { padding: 25px 30px; }
        .portaria-doc .portaria-num { text-align: center; font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 20px 0; }
        .portaria-doc .ementa { text-align: justify; font-size: 12px; margin-bottom: 20px; font-style: italic; padding: 10px 15px; background: #f8f9fa; border-left: 3px solid #1a1a2e; }
        .portaria-doc .resolve { text-align: center; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 20px 0; letter-spacing: 4px; }
        .portaria-doc .artigo { text-align: justify; font-size: 12px; margin-bottom: 12px; text-indent: 1.5cm; line-height: 1.8; }
        .portaria-doc .final { text-align: center; font-size: 12px; font-weight: bold; text-transform: uppercase; margin: 25px 0; letter-spacing: 2px; }
        .portaria-doc .rodape { text-align: center; margin-top: 50px; }
        .portaria-doc .rodape .local-data { font-size: 12px; margin-bottom: 10px; }
        .portaria-doc .rodape .linha { font-size: 12px; margin: 8px 0 4px; }
        .portaria-doc .rodape .nome { font-size: 12px; font-weight: bold; }
        .portaria-doc .rodape .cargo { font-size: 11px; }
        .portaria-doc .footer-note { text-align: center; font-size: 9px; color: #888; margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; }
        .portaria-doc .brasao { font-size: 28px; margin-bottom: 8px; letter-spacing: 4px; }
      `}</style>

      <div className="portaria-doc">
        <div className="header">
          <div className="brasao">⚜️</div>
          <div className="gov">Governo do Estado de São Paulo</div>
          <div className="org">Secretaria de Estado da Segurança Pública</div>
          <div className="org">Polícia Militar do Estado de São Paulo</div>
          <div className="title">Quartel da Corregedoria-Geral da Polícia Militar</div>
          <div className="subtitle">Corregedoria da Polícia Militar</div>
        </div>

        <div className="content">
          <div className="portaria-num">PORTARIA Nº {data.numero_portaria}/{data.ano} – CPM</div>

          <div className="ementa">
            O {data.corregedor_responsavel || "CORREGEDOR GERAL DA POLÍCIA MILITAR"}, no uso de suas atribuições legais e com fundamento no disposto na legislação vigente,
          </div>

          <div className="resolve">R E S O L V E:</div>

          <div className="artigo">
            <b>Art. 1º</b> Determinar o afastamento cautelar do serviço operacional, pelo prazo de {data.prazo_afastamento}, do seguinte policial militar:
          </div>

          <div className="artigo" style={{ textIndent: "2.5cm" }}>
            <b>I –</b> {data.posto_graduacao} {data.nome_policial}, RG PM nº {data.rg_pm}, lotado(a) no(a) {data.unidade}.
          </div>

          <div className="artigo">
            <b>Art. 2º</b> Durante o afastamento, o policial militar permanecerá à disposição da Corregedoria da Polícia Militar, devendo cumprir rigorosamente as determinações administrativas que lhe forem expedidas, manter seus dados de contato atualizados e abster-se de frequentar dependências operacionais, salvo mediante autorização expressa.
          </div>

          <div className="artigo">
            <b>Art. 3º</b> O policial militar fica temporariamente impedido de exercer atividade operacional e de portar arma de fogo institucional, devendo o armamento ser recolhido na forma da legislação e normas internas vigentes.
          </div>

          <div className="artigo">
            <b>Art. 4º</b> O afastamento de que trata esta Portaria possui caráter meramente cautelar e não punitivo, podendo ser revisto ou revogado a qualquer tempo, conforme o andamento do procedimento apuratório.
          </div>

          <div className="artigo">
            <b>Art. 5º</b> Esta Portaria entra em vigor na data de sua publicação.
          </div>

          <div className="final">REGISTRE-SE, PUBLIQUE-SE E CUMPRA-SE.</div>

          <div className="rodape">
            <div className="local-data">São Paulo, {dataFormatada}.</div>
            <div className="linha">____________________________________</div>
            <div className="nome">{data.corregedor_responsavel || "Corregedor Geral"}</div>
            <div className="cargo">{data.corregedor_cargo || "Corregedor Geral da Polícia Militar"}</div>
          </div>

          <div className="footer-note">
            Documento gerado eletronicamente em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")} por {data.corregedor_responsavel || "Sistema"} — Corregedoria Geral PMESP
          </div>
        </div>
      </div>
    </div>
  );
}
