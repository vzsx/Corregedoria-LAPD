import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { useState, useEffect } from "react";

export function SiteHeader() {
  const { user, isCorregedor, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Main header */}
      <div
        className={`border-b border-border bg-white transition-shadow duration-200 ${
          scrolled ? "shadow-md" : "shadow-sm"
        }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded overflow-hidden border border-border">
              <img
                src="/corregedoria-logo.png"
                alt="Brasão Corregedoria PMESP"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-pmesp-dark tracking-tight">
                Corregedoria Geral
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Polícia Militar do Estado de São Paulo
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              className="px-3 py-2 text-sm font-medium text-muted-foreground rounded-md transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "px-3 py-2 text-sm font-medium text-pmesp-dark bg-muted rounded-md" }}
              activeOptions={{ exact: true }}
            >
              Quem Somos
            </Link>
            <Link
              to="/denuncias"
              className="px-3 py-2 text-sm font-medium text-muted-foreground rounded-md transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "px-3 py-2 text-sm font-medium text-pmesp-dark bg-muted rounded-md" }}
            >
              Fazer Denúncia
            </Link>
            <Link
              to="/acompanhar"
              className="px-3 py-2 text-sm font-medium text-muted-foreground rounded-md transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "px-3 py-2 text-sm font-medium text-pmesp-dark bg-muted rounded-md" }}
            >
              Acompanhar
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {user && <NotificationBell />}
            {user ? (
              <div className="flex items-center gap-2">
                {(isCorregedor || isAdmin) && (
                  <Link to="/corregedoria">
                    <Button size="sm" className="bg-pmesp-red text-white hover:bg-pmesp-red/90 font-medium">
                      Abrir Terminal
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="bg-pmesp-red text-white hover:bg-pmesp-red/90 font-medium">
                  Acesso Restrito
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
