import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Shield, FileText, Clock, CheckCircle2, AlertTriangle, ArrowLeft, Loader2, FileSignature, MessageSquare, Activity, User } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/acompanhar")({
  component: AcompanharPage,
});

type Status = "pendente" | "em_analise" | "concluida" | "arquivada";

const STATUS_LABEL: Record<Status, string> = {
  pendente: "Pendente",
  em_analise: "Em Análise",
  concluida: "Concluída",
  arquivada: "Arquivada",
};

const STATUS_COLOR: Record<Status, string> = {
  pendente: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  em_analise: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  concluida: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  arquivada: "text-muted-foreground border-border bg-muted/50",
};

const STATUS_ICON: Record<Status, any> = {
  pendente: Clock,
  em_analise: Search,
  concluida: CheckCircle2,
  arquivada: AlertTriangle,
};

function AcompanharPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");
    setDenuncias([]);
    setSearched(true);

    const { data, error: err } = await supabase
      .from("denuncias")
      .select("*, denuncia_relatorio(*, relatorios(titulo, tipo_denuncia))")
      .or(`dados_detalhados->>reclamante_nome.ilike.%${name.trim()}%`)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (err) {
      console.error("Erro ao buscar denúncias:", err);
      setError("Erro ao consultar. Tente novamente.");
      return;
    }

    if (!data || data.length === 0) {
      setError("Nenhuma denúncia encontrada com esse nome. Verifique o nome informado.");
      return;
    }

    setDenuncias(data);
  };

  const getDocCount = (denuncia: any) => {
    const dd = denuncia.dados_detalhados;
    if (!dd) return 0;
    let count = 0;
    if (dd.provas_selecionadas?.length) count += dd.provas_selecionadas.length;
    if (dd.provas_descricao) count++;
    if (dd.relato) count++;
    return count;
  };

  const getLinkedDocs = (denuncia: any) => {
    if (!denuncia.denuncia_relatorio) return [];
    return denuncia.denuncia_relatorio
      .filter((dr: any) => dr.relatorios)
      .map((dr: any) => dr.relatorios);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="container mx-auto max-w-2xl px-6 py-16">
        <div className="mb-10 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border shadow-glow">
            <Search className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
            Acompanhar Denúncia
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Digite seu nome completo para consultar o andamento das suas denúncias.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-10 animate-slide-up">
          <div className="flex gap-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className="h-12 bg-card border-border text-foreground text-center"
            />
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="h-12 px-8 bg-primary text-primary-foreground font-bold uppercase tracking-widest transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Consultar"}
            </Button>
          </div>
        </form>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 text-center animate-scale-in">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
            <p className="mt-4 text-sm text-muted-foreground">{error}</p>
            <p className="mt-2 text-xs text-muted-foreground/50">
              Você fez a denúncia pelo formulário online? Utilize o mesmo nome cadastrado.
            </p>
          </div>
        )}

        {denuncias.length > 0 && !loading && (
          <div className="space-y-6 animate-card-enter">
            <p className="text-xs text-muted-foreground text-center">
              {denuncias.length} denúncia(s) encontrada(s) para <strong className="text-foreground">{name.trim()}</strong>
            </p>

            {denuncias.map((denuncia) => (
              <div key={denuncia.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Status Header */}
                <div className={`p-6 border-b border-border ${STATUS_COLOR[denuncia.status as Status] || STATUS_COLOR.pendente}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background/50">
                      {(() => {
                        const Icon = STATUS_ICON[denuncia.status as Status] || Clock;
                        return <Icon className="h-6 w-6" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground truncate">
                          {denuncia.titulo || "Denúncia"}
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest border shrink-0">
                          {STATUS_LABEL[denuncia.status as Status] || "Pendente"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        #{denuncia.numero_registro?.toString().padStart(4, "0")} · {format(new Date(denuncia.created_at), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Denunciante</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary/60" />
                        {denuncia.dados_detalhados?.reclamante_nome || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Policial Denunciado</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{denuncia.policial_denunciado || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Data do Ocorrido</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{denuncia.data_ocorrido ? format(new Date(denuncia.data_ocorrido), "dd/MM/yyyy") : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Última Atualização</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{format(new Date(denuncia.created_at), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                  </div>

                  {/* Documentos Anexados */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        Documentos Anexados
                      </h3>
                    </div>

                    {/* Linked relatorios (documents created by corregedoria) */}
                    {getLinkedDocs(denuncia).length > 0 && (
                      <div className="space-y-2 mb-3">
                        {getLinkedDocs(denuncia).map((doc: any) => (
                          <div key={doc.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 border border-border/50">
                            <FileSignature className="h-5 w-5 text-primary/60 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-foreground">{doc.titulo}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{doc.tipo_denuncia}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Evidence types (from the complaint form) */}
                    {getDocCount(denuncia) > 0 ? (
                      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                        <FileSignature className="h-6 w-6 text-primary/60 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {getDocCount(denuncia)} prova(s) anexada(s) pelo denunciante
                          </p>
                          {denuncia.dados_detalhados?.provas_selecionadas?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {denuncia.dados_detalhados.provas_selecionadas.map((p: string) => (
                                <span key={p} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
                Para mais informações, entre em contato com a Corregedoria Geral PMESP.
              </p>
              <Link to="/" className="mt-4 inline-flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Voltar ao início
              </Link>
            </div>
          </div>
        )}

        {!searched && !loading && (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <Search className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p className="text-xs uppercase tracking-widest">
              Digite seu nome para consultar o andamento
            </p>
          </div>
        )}

        {!denuncias.length && !loading && (
          <div className="mt-10 grid gap-4 md:grid-cols-3 animate-card-enter stagger-1">
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <User className="mx-auto h-5 w-5 text-primary mb-2" />
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Passo 1</h4>
              <p className="text-[11px] text-muted-foreground mt-1">Faça sua denúncia pelo formulário online</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <FileText className="mx-auto h-5 w-5 text-primary mb-2" />
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Passo 2</h4>
              <p className="text-[11px] text-muted-foreground mt-1">Anote o número de registro gerado</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <Activity className="mx-auto h-5 w-5 text-primary mb-2" />
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Passo 3</h4>
              <p className="text-[11px] text-muted-foreground mt-1">Consulte o andamento pelo seu nome</p>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
