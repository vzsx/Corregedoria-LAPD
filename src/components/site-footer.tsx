export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card/50 animate-fade-in">
      <div className="container mx-auto px-6 py-10 text-center text-sm text-muted-foreground">
        <p className="font-display uppercase tracking-widest text-foreground tracking-[0.15em]">
          PMESP · Corregedoria Geral
        </p>
        <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground/70">
          São Paulo · Servir e Proteger
        </p>
        <div className="mx-auto mt-4 h-px w-12 bg-primary/30" />
        <p className="mt-4 text-xs opacity-50">
          Projeto de Roleplay (GTA RP) — não representa a entidade real da PMESP.
        </p>
      </div>
    </footer>
  );
}
