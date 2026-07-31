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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-pmesp-sidebar">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded overflow-hidden bg-white/10">
            <img
              src="/corregedoria-logo.png"
              alt="Brasão Corregedoria PMESP"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white tracking-tight">
              Corregedoria Geral
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">
              Polícia Militar do Estado de São Paulo
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className="px-3 py-1.5 text-sm font-medium text-white/60 rounded transition-colors hover:bg-white/10 hover:text-white"
            activeProps={{ className: "px-3 py-1.5 text-sm font-medium text-white bg-white/10 rounded" }}
            activeOptions={{ exact: true }}
          >
            Quem Somos
          </Link>
          <Link
            to="/denuncias"
            className="px-3 py-1.5 text-sm font-medium text-white/60 rounded transition-colors hover:bg-white/10 hover:text-white"
            activeProps={{ className: "px-3 py-1.5 text-sm font-medium text-white bg-white/10 rounded" }}
          >
            Fazer Denúncia
          </Link>
          <Link
            to="/acompanhar"
            className="px-3 py-1.5 text-sm font-medium text-white/60 rounded transition-colors hover:bg-white/10 hover:text-white"
            activeProps={{ className: "px-3 py-1.5 text-sm font-medium text-white bg-white/10 rounded" }}
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
                  <Button size="sm" className="bg-pmesp-red text-white hover:bg-pmesp-red/80 font-medium text-xs h-8">
                    Abrir Terminal
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/60 hover:text-white hover:bg-white/10 text-xs h-8">
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sair
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-pmesp-red text-white hover:bg-pmesp-red/80 font-medium text-xs h-8">
                Acesso Restrito
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
