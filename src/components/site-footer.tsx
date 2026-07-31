export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-background text-foreground">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Polícia Militar do Estado de São Paulo
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Corregedoria Geral
            </p>
          </div>

          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="/" className="hover:text-foreground transition-colors">Quem Somos</a>
            <a href="/denuncias" className="hover:text-foreground transition-colors">Denúncia</a>
            <a href="/acompanhar" className="hover:text-foreground transition-colors">Acompanhar</a>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">São Paulo — SP</p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4 flex flex-col items-center gap-1 md:flex-row md:justify-between">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} PMESP — Corregedoria Geral
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            Projeto de Roleplay (GTA RP) — não representa a entidade real da PMESP.
          </p>
        </div>
      </div>
    </footer>
  );
}
