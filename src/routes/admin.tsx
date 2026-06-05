import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Role = "admin" | "corregedor" | "pending";

interface Member {
  id: string;
  full_name: string;
  badge_number: string | null;
  roles: Role[];
}

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [fetching, setFetching] = useState(true);

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

  useEffect(() => {
    if (isAdmin) load();
    else if (!loading) setFetching(false);
  }, [isAdmin, loading, load]);

  const setRole = async (userId: string, role: Role, enabled: boolean) => {
    if (enabled) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete()
        .eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    }
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
              Administração de Acesso
            </h1>
            <p className="text-sm text-muted-foreground">
              Aprove policiais como corregedores ou administradores.
            </p>
          </div>
          <ShieldCheck className="h-10 w-10 text-foreground" />
        </div>

        <div className="space-y-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-5 shadow-elegant"
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
      className={active ? "bg-badge-gradient" : ""}
    >
      {active ? `✓ ${label}` : `+ ${label}`}
    </Button>
  );
}
