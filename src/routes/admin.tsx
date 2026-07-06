import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Loader2, ShieldCheck, ScrollText, UserCheck, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { logAudit } from "@/lib/audit-log";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/pagination";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Role = "admin" | "corregedor" | "pending";
type Tab = "membros" | "auditoria";

interface Member {
  id: string;
  full_name: string;
  badge_number: string | null;
  roles: Role[];
}

interface AuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

const ACTION_LABEL: Record<string, string> = {
  create: "Criação",
  update: "Atualização",
  delete: "Exclusão",
  login: "Login",
  link: "Vinculação",
  unlink: "Desvinculação",
  status_change: "Mudança de Status",
};
const ACTION_COLOR: Record<string, string> = {
  create: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  update: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  delete: "text-red-400 border-red-500/30 bg-red-500/10",
  login: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  link: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  unlink: "text-muted-foreground border-border bg-muted/50",
  status_change: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
};

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("membros");

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const map = new Map<string, Role[]>();
    (roles ?? []).forEach((r) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role as Role);
      map.set(r.user_id, arr);
    });
    setMembers(
      (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        badge_number: p.badge_number,
        roles: map.get(p.id) ?? [],
      })),
    );
    setFetching(false);
  }, []);

  const loadAuditLogs = useCallback(async (page: number) => {
    setAuditLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data) {
      setAuditLogs(data as AuditEntry[]);
      setAuditTotal(count || 0);
    }
    setAuditLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
    else if (!loading) setFetching(false);
  }, [isAdmin, loading, load]);

  useEffect(() => {
    if (isAdmin && activeTab === "auditoria") loadAuditLogs(auditPage);
  }, [isAdmin, activeTab, auditPage, loadAuditLogs]);

  const setRole = async (userId: string, role: Role, enabled: boolean) => {
    if (enabled) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete()
        .eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    }
    logAudit({
      user_id: user?.id,
      user_name: user?.user_metadata?.full_name,
      action: enabled ? "create" : "delete",
      entity_type: "user_role",
      entity_id: userId,
      details: { role },
    });
    toast.success("Permissões atualizadas");
    load();
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="font-display text-2xl font-bold uppercase">Acesso negado</h1>
          <p className="mt-2 text-muted-foreground">Apenas administradores podem acessar esta área.</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="container mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
              Administração
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie permissões e acompanhe atividades do sistema.
            </p>
          </div>
          <ShieldCheck className="h-10 w-10 text-foreground" />
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-1 border-b border-border">
          <button
            onClick={() => setActiveTab("membros")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-200 border-b-2 ${
              activeTab === "membros"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" /> Membros
          </button>
          <button
            onClick={() => setActiveTab("auditoria")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-200 border-b-2 ${
              activeTab === "auditoria"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ScrollText className="h-3.5 w-3.5" /> Log de Auditoria
          </button>
        </div>

        {activeTab === "membros" && (
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-5 shadow-elegant transition-all duration-200 hover:border-primary/20"
              >
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide">
                    {m.full_name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Placa: {m.badge_number ?? "—"}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {m.roles.length === 0 && (
                      <Badge variant="outline" className="text-muted-foreground">sem cargo</Badge>
                    )}
                    {m.roles.map((r) => (
                      <Badge key={r} variant="outline" className="border-gold/40 text-gold">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <RoleToggle
                    active={m.roles.includes("corregedor")}
                    label="Corregedor"
                    onToggle={(on) => setRole(m.id, "corregedor", on)}
                  />
                  <RoleToggle
                    active={m.roles.includes("admin")}
                    label="Admin"
                    onToggle={(on) => setRole(m.id, "admin", on)}
                    disabled={m.id === user?.id}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "auditoria" && (
          <div>
            {auditLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/5 rounded bg-muted" />
                      <div className="h-2 w-2/5 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Clock className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-xs uppercase tracking-widest">Nenhum registro de auditoria encontrado</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:bg-muted/30"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        ACTION_COLOR[log.action] || "bg-muted/50 border-border"
                      }`}>
                        {log.action === "create" ? <Clock className="h-4 w-4" /> :
                         log.action === "delete" ? <Clock className="h-4 w-4" /> :
                         <Eye className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">{log.user_name || "Sistema"}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                            ACTION_COLOR[log.action] || "text-muted-foreground border-border bg-muted/50"
                          }`}>
                            {ACTION_LABEL[log.action] || log.action}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase">{log.entity_type}</span>
                          {log.entity_id && (
                            <span className="text-[10px] font-mono text-muted-foreground/50">#{log.entity_id.slice(0, 8)}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {log.details ? JSON.stringify(log.details).slice(0, 120) : ""}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1">
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination
                  current={auditPage}
                  total={auditTotal}
                  pageSize={PAGE_SIZE}
                  onChange={setAuditPage}
                />
              </>
            )}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function RoleToggle({
  active,
  label,
  onToggle,
  disabled,
}: {
  active: boolean;
  label: string;
  onToggle: (on: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Button
      size="sm"
      variant={active ? "default" : "outline"}
      disabled={disabled}
      onClick={() => onToggle(!active)}
      className={`transition-all duration-200 ${active ? "bg-badge-gradient" : ""} hover:scale-[1.03] active:scale-[0.97]`}
    >
      {active ? `✓ ${label}` : `+ ${label}`}
    </Button>
  );
}
