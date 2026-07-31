export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-pmesp-sidebar text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Polícia Militar do Estado de São Paulo
            </p>
            <p className="mt-0.5 text-xs text-white/40">
              Corregedoria Geral
            </p>
          </div>

          <div className="flex gap-6 text-xs text-white/50">
            <a href="/" className="hover:text-white transition-colors">Quem Somos</a>
            <a href="/denuncias" className="hover:text-white transition-colors">Denúncia</a>
            <a href="/acompanhar" className="hover:text-white transition-colors">Acompanhar</a>
          </div>

          <div className="text-right">
            <p className="text-xs text-white/40">São Paulo — SP</p>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 flex flex-col items-center gap-1 md:flex-row md:justify-between">
          <p className="text-[11px] text-white/30">
            © {new Date().getFullYear()} PMESP — Corregedoria Geral
          </p>
          <p className="text-[10px] text-white/20">
            Projeto de Roleplay (GTA RP) — não representa a entidade real da PMESP.
          </p>
        </div>
      </div>
    </footer>
  );
}
