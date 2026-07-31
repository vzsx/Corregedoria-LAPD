import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { GovBar } from "@/components/gov-bar";

export function SiteHeader() {
  const { user, isCorregedor, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50">
      <GovBar />
      <div className="bg-pmesp-dark border-b border-[#3A3A3A]">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded overflow-hidden bg-[#3A3A3A]">
              <img
                src="/corregedoria-logo.png"
                alt="Brasão Corregedoria PMESP"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-[#E8E8E8] tracking-tight">
                Corregedoria Geral
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                Polícia Militar do Estado de São Paulo
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              className="px-3 py-1.5 text-sm font-medium text-[#ADADAD] rounded transition-colors hover:bg-[#3A3A3A] hover:text-[#E8E8E8]"
              activeProps={{ className: "px-3 py-1.5 text-sm font-medium text-[#E8E8E8] bg-[#3A3A3A] rounded" }}
              activeOptions={{ exact: true }}
            >
              Quem Somos
            </Link>
            <Link
              to="/denuncias"
              className="px-3 py-1.5 text-sm font-medium text-[#ADADAD] rounded transition-colors hover:bg-[#3A3A3A] hover:text-[#E8E8E8]"
              activeProps={{ className: "px-3 py-1.5 text-sm font-medium text-[#E8E8E8] bg-[#3A3A3A] rounded" }}
            >
              Fazer Denúncia
            </Link>
            <Link
              to="/acompanhar"
              className="px-3 py-1.5 text-sm font-medium text-[#ADADAD] rounded transition-colors hover:bg-[#3A3A3A] hover:text-[#E8E8E8]"
              activeProps={{ className: "px-3 py-1.5 text-sm font-medium text-[#E8E8E8] bg-[#3A3A3A] rounded" }}
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
                    <Button size="sm" className="bg-pmesp-red text-[#E8E8E8] hover:bg-pmesp-red/80 font-medium text-xs h-8">
                      Abrir Terminal
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#ADADAD] hover:text-[#E8E8E8] hover:bg-[#3A3A3A] text-xs h-8">
                  <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sair
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="bg-pmesp-red text-[#E8E8E8] hover:bg-pmesp-red/80 font-medium text-xs h-8">
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
