import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Shield, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/corregedoria")({
  component: Corregedoria,
});

type Status = "pendente" | "em_analise" | "concluida" | "arquivada";

interface Denuncia {
  id: string;
  titulo: string;
  descricao: string;
  policial_denunciado: string | null;
  data_ocorrido: string | null;
  contato_opcional: string | null;
  status: Status;
  notas_internas: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<Status, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  concluida: "Concluída",
  arquivada: "Arquivada",
};

const STATUS_COLOR: Record<Status, string> = {
  pendente: "bg-destructive/20 text-destructive border-destructive/40",
  em_analise: "bg-primary/20 text-primary border-primary/40",
  concluida: "bg-green-500/20 text-green-400 border-green-500/40",
  arquivada: "bg-muted text-muted-foreground border-border",
};

function Corregedoria() {
  const { user, loading, isCorregedor } = useAuth();
  const navigate = useNavigate();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!isCorregedor) {
      setFetching(false);
      return;
    }
    const load = async () => {
      const { data, error } = await supabase
        .from("denuncias")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) toast.error("Erro ao carregar denúncias");
      else setDenuncias((data ?? []) as Denuncia[]);
      setFetching(false);
    };
    load();
  }, [isCorregedor]);

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("denuncias").update({ status }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    setDenuncias((d) => d.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success("Status atualizado");
  };

  const updateNotas = async (id: string, notas_internas: string) => {
    const { error } = await supabase.from("denuncias").update({ notas_internas }).eq("id", id);
    if (error) return toast.error("Erro ao salvar notas");
    toast.success("Notas salvas");
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

  if (!isCorregedor) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto max-w-md px-6 py-24 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold uppercase">Acesso pendente</h1>
          <p className="mt-2 text-muted-foreground">
            Sua conta ainda não foi aprovada como corregedor. Aguarde a
            autorização de um administrador.
          </p>
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
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
              Painel da Corregedoria
            </h1>
            <p className="text-sm text-muted-foreground">
              {denuncias.length} denúncia(s) registrada(s)
            </p>
          </div>
          <FileText className="h-10 w-10 text-gold" />
        </div>

        {denuncias.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            Nenhuma denúncia registrada até o momento.
          </div>
        ) : (
          <div className="space-y-4">
            {denuncias.map((d) => {
              const expanded = expandedId === d.id;
              return (
                <div key={d.id} className="rounded-xl border border-border bg-card shadow-elegant">
                  <button
                    onClick={() => setExpandedId(expanded ? null : d.id)}
                    className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-accent/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-bold uppercase tracking-wide">
                          {d.titulo}
                        </h3>
                        <Badge variant="outline" className={STATUS_COLOR[d.status]}>
                          {STATUS_LABEL[d.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {format(new Date(d.created_at), "dd/MM/yyyy 'às' HH:mm")}
                        {d.policial_denunciado && ` · Acusado: ${d.policial_denunciado}`}
                      </p>
                    </div>
                  </button>

                  {expanded && (
                    <div className="space-y-5 border-t border-border p-5">
                      <Field label="Descrição">
                        <p className="whitespace-pre-wrap text-sm text-foreground">{d.descricao}</p>
                      </Field>
                      {d.data_ocorrido && (
                        <Field label="Quando ocorreu">
                          <p className="text-sm">{d.data_ocorrido}</p>
                        </Field>
                      )}
                      {d.contato_opcional && (
                        <Field label="Contato do denunciante">
                          <p className="text-sm">{d.contato_opcional}</p>
                        </Field>
                      )}

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Status">
                          <Select
                            defaultValue={d.status}
                            onValueChange={(v) => updateStatus(d.id, v as Status)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>

                      <Field label="Notas internas (apenas Corregedoria)">
                        <Textarea
                          defaultValue={d.notas_internas ?? ""}
                          rows={4}
                          id={`notas-${d.id}`}
                          placeholder="Observações da investigação..."
                        />
                        <Button
                          size="sm"
                          className="mt-2"
                          variant="outline"
                          onClick={() => {
                            const el = document.getElementById(`notas-${d.id}`) as HTMLTextAreaElement;
                            updateNotas(d.id, el.value);
                          }}
                        >
                          Salvar notas
                        </Button>
                      </Field>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
