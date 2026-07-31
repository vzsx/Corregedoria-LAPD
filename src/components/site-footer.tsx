export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[#3A3A3A] bg-pmesp-dark text-[#E8E8E8]">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Polícia Militar do Estado de São Paulo
            </p>
            <p className="mt-0.5 text-xs text-[#999999]">
              Corregedoria Geral
            </p>
          </div>

          <div className="flex gap-6 text-xs text-[#ADADAD]">
            <a href="/" className="hover:text-[#E8E8E8] transition-colors">Quem Somos</a>
            <a href="/denuncias" className="hover:text-[#E8E8E8] transition-colors">Denúncia</a>
            <a href="/acompanhar" className="hover:text-[#E8E8E8] transition-colors">Acompanhar</a>
          </div>

          <div className="text-right">
            <p className="text-xs text-[#999999]">São Paulo — SP</p>
          </div>
        </div>

        <div className="mt-6 border-t border-[#3A3A3A] pt-4 flex flex-col items-center gap-1 md:flex-row md:justify-between">
          <p className="text-[11px] text-[#777777]">
            © {new Date().getFullYear()} PMESP — Corregedoria Geral
          </p>
          <p className="text-[10px] text-[#666666]">
            Projeto de Roleplay (GTA RP) — não representa a entidade real da PMESP.
          </p>
        </div>
      </div>
    </footer>
  );
}
