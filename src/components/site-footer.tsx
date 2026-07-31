export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-pmesp-dark text-white">
      <div className="container mx-auto px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Branding */}
          <div>
            <p className="text-sm font-semibold tracking-tight">
              Polícia Militar do Estado de São Paulo
            </p>
            <p className="mt-1 text-xs text-white/60">
              Corregedoria Geral
            </p>
            <div className="mt-3 h-px w-8 bg-pmesp-red/40" />
          </div>

          {/* Links */}
          <div className="flex flex-col gap-1.5 text-xs text-white/60">
            <a href="/" className="hover:text-white transition-colors">Quem Somos</a>
            <a href="/denuncias" className="hover:text-white transition-colors">Fazer Denúncia</a>
            <a href="/acompanhar" className="hover:text-white transition-colors">Acompanhar Denúncia</a>
          </div>

          {/* Info */}
          <div className="text-xs text-white/60 md:text-right">
            <p>São Paulo — SP</p>
            <p className="mt-1">Serviço e Proteger</p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 flex flex-col items-center gap-2 md:flex-row md:justify-between">
          <p className="text-[11px] text-white/40">
            © {new Date().getFullYear()} PMESP — Corregedoria Geral
          </p>
          <p className="text-[10px] text-white/30">
            Projeto de Roleplay (GTA RP) — não representa a entidade real da PMESP.
          </p>
        </div>
      </div>
    </footer>
  );
}
