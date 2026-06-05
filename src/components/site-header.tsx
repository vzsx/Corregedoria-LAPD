import { Link, useNavigate } from "@tanstack/react-router";
import { Shield, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { useState, useEffect } from "react";

export function SiteHeader() {
  const { user, isCorregedor, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-500 ${
        scrolled
          ? "border-border/60 bg-background/90 backdrop-blur-xl shadow-lg shadow-black/10"
          : "border-transparent bg-background/40 backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-md overflow-hidden bg-card border border-border shadow-glow transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(201,160,58,0.4)] group-hover:border-primary/50">
            <img src="/corregedoria-logo.png" alt="Brasão Corregedoria PMESP" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-bold uppercase tracking-widest text-foreground transition-colors duration-300 group-hover:text-primary">
              PMESP · Corregedoria
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Corregedoria Geral</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-3/4"
            activeProps={{ className: "px-4 py-2 text-sm font-medium text-foreground after:w-3/4" }}
            activeOptions={{ exact: true }}
          >
            Quem Somos
          </Link>
          <Link
            to="/denuncias"
            className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-3/4"
            activeProps={{ className: "px-4 py-2 text-sm font-medium text-foreground after:w-3/4" }}
          >
            Fazer Denúncia
          </Link>
          <Link
            to="/acompanhar"
            className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-3/4"
            activeProps={{ className: "px-4 py-2 text-sm font-medium text-foreground after:w-3/4" }}
          >
            Acompanhar
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {user ? (
            <div className="flex items-center gap-2 animate-scale-in">
              {(isCorregedor || isAdmin) && (
                <Link to="/corregedoria">
                  <Button size="sm" className="bg-badge-gradient text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                    Abrir Terminal
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="transition-all duration-300 hover:scale-105">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-badge-gradient transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                Acesso Restrito
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
