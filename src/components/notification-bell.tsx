import { useEffect, useState, useRef } from "react";
import { Bell, BellRing, AlertCircle, FileText, MessageSquare, UserCheck, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: "denuncia" | "depoimento" | "solicitacao" | "status";
  title: string;
  description: string;
  table: string;
  record_id: string;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const saved = localStorage.getItem("notificacoes");
      const parsed = saved ? JSON.parse(saved) : [];
      setNotifications(parsed);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const channel = supabase.channel("notificacoes-global");

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "denuncias" }, (payload) => {
        const n: Notification = {
          id: payload.new.id + "-denuncia",
          type: "denuncia",
          title: "Nova Denúncia",
          description: `Denúncia #${payload.new.numero_registro?.toString().padStart(4, "0") || "N/A"} registrada`,
          table: "denuncias",
          record_id: payload.new.id,
          read: false,
          created_at: new Date().toISOString(),
        };
        addNotification(n);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "depoimentos" }, (payload) => {
        const n: Notification = {
          id: payload.new.id + "-depoimento",
          type: "depoimento",
          title: "Novo Depoimento",
          description: `Depoimento de ${payload.new.oficial_nome || "oficial"} registrado`,
          table: "depoimentos",
          record_id: payload.new.id,
          read: false,
          created_at: new Date().toISOString(),
        };
        addNotification(n);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "denuncias" }, (payload) => {
        if (payload.new.status !== payload.old.status) {
          const n: Notification = {
            id: payload.new.id + "-status-" + Date.now(),
            type: "status",
            title: "Status Alterado",
            description: `Denúncia #${payload.new.numero_registro?.toString().padStart(4, "0") || "N/A"} → ${payload.new.status}`,
            table: "denuncias",
            record_id: payload.new.id,
            read: false,
            created_at: new Date().toISOString(),
          };
          addNotification(n);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addNotification = (n: Notification) => {
    setNotifications(prev => {
      const updated = [n, ...prev].slice(0, 20);
      localStorage.setItem("notificacoes", JSON.stringify(updated));
      return updated;
    });
  };

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem("notificacoes", JSON.stringify(updated));
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem("notificacoes");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const typeIcon = (type: string) => {
    switch (type) {
      case "denuncia": return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
      case "depoimento": return <MessageSquare className="h-3.5 w-3.5 text-blue-400" />;
      case "solicitacao": return <UserCheck className="h-3.5 w-3.5 text-amber-400" />;
      case "status": return <FileText className="h-3.5 w-3.5 text-emerald-400" />;
      default: return <Bell className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 hover:bg-muted ${
          open ? "bg-muted" : ""
        }`}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-4 w-4 text-primary" />
        ) : (
          <Bell className="h-4 w-4 text-muted-foreground" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground animate-scale-in">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-2xl animate-slide-down">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Notificações</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-primary hover:text-primary/80 uppercase tracking-wider transition-colors">
                  Ler todas
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors">
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Bell className="h-6 w-6 mb-2 opacity-30" />
                <p className="text-[10px] uppercase tracking-widest">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 border-b border-border/50 px-4 py-3 transition-all duration-200 hover:bg-muted/50 ${
                    !n.read ? "bg-muted/20" : ""
                  }`}
                >
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{n.description}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                      {format(new Date(n.created_at), "dd/MM 'às' HH:mm")}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
