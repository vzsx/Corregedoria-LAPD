import { Link } from "@tanstack/react-router";
import { Shield, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, isCorregedor, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-badge-gradient shadow-glow">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
              LAPD · Corregedoria
            </span>
            <span className="text-xs text-muted-foreground">Compton Division</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "px-4 py-2 text-sm font-medium text-foreground" }}
            activeOptions={{ exact: true }}
          >
            Quem Somos
          </Link>
          <Link
            to="/denuncias"
            className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "px-4 py-2 text-sm font-medium text-foreground" }}
          >
            Fazer Denúncia
          </Link>
          {isCorregedor && (
            <Link
              to="/corregedoria"
              className="px-4 py-2 text-sm font-medium text-gold transition-colors hover:opacity-80"
              activeProps={{ className: "px-4 py-2 text-sm font-bold text-gold" }}
            >
              Painel
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="px-4 py-2 text-sm font-medium text-gold transition-colors hover:opacity-80"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-badge-gradient">
                Acesso restrito
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
