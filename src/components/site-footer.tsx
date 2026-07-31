export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[#2A2A2A] bg-pmesp-sidebar text-[#D0D0D0]">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Polícia Militar do Estado de São Paulo
            </p>
            <p className="mt-0.5 text-xs text-[#777777]">
              Corregedoria Geral
            </p>
          </div>

          <div className="flex gap-6 text-xs text-[#888888]">
            <a href="/" className="hover:text-[#D0D0D0] transition-colors">Quem Somos</a>
            <a href="/denuncias" className="hover:text-[#D0D0D0] transition-colors">Denúncia</a>
            <a href="/acompanhar" className="hover:text-[#D0D0D0] transition-colors">Acompanhar</a>
          </div>

          <div className="text-right">
            <p className="text-xs text-[#777777]">São Paulo — SP</p>
          </div>
        </div>

        <div className="mt-6 border-t border-[#2A2A2A] pt-4 flex flex-col items-center gap-1 md:flex-row md:justify-between">
          <p className="text-[11px] text-[#666666]">
            © {new Date().getFullYear()} PMESP — Corregedoria Geral
          </p>
          <p className="text-[10px] text-[#555555]">
            Projeto de Roleplay (GTA RP) — não representa a entidade real da PMESP.
          </p>
        </div>
      </div>
    </footer>
  );
}
