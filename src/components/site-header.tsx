import { Link, useNavigate } from "@tanstack/react-router";
import { Shield, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, isCorregedor, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md overflow-hidden bg-card border border-border shadow-glow">
            <img src="/corregedoria-logo.png" alt="Brasão Corregedoria PMESP" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
              PMESP · Corregedoria
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Corregedoria Geral</span>
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
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              {(isCorregedor || isAdmin) && (
                <Link to="/corregedoria">
                  <Button size="sm" className="bg-badge-gradient text-white">
                    Abrir Terminal
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-badge-gradient">
                Acesso Restrito
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
