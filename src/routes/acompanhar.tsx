import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Shield, FileText, Clock, CheckCircle2, AlertTriangle, ArrowLeft, Loader2, FileSignature, MessageSquare, Activity } from "lucide-react";
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
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [denuncia, setDenuncia] = useState<any>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setDenuncia(null);
    setSearched(true);

    const num = parseInt(code.trim(), 10);

    const { data, error: err } = await supabase
      .from("denuncias")
      .select("*")
      .eq("numero_registro", num)
      .single();

    setLoading(false);

    if (err || !data) {
      setError("Denúncia não encontrada. Verifique o código informado.");
      return;
    }

    setDenuncia(data);
  };

  const getDocCount = () => {
    if (!denuncia) return 0;
    const dd = denuncia.dados_detalhados;
    if (!dd) return 0;
    let count = 0;
    if (dd.provas_selecionadas?.length) count += dd.provas_selecionadas.length;
    if (dd.provas_descricao) count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="container mx-auto max-w-2xl px-6 py-16">
        {/* Header */}
        <div className="mb-10 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border shadow-glow">
            <Search className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
            Acompanhar Denúncia
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Digite o número de registro da sua denúncia para consultar o andamento.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-10 animate-slide-up">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">#</span>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="0001"
                className="pl-7 h-12 bg-card border-border text-foreground text-lg font-mono tracking-widest text-center"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !code.trim()}
              className="h-12 px-8 bg-primary text-primary-foreground font-bold uppercase tracking-widest transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Consultar"}
            </Button>
          </div>
        </form>

        {/* Result */}
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
              Você fez a denúncia pelo formulário online? Anote o número exibido após o envio.
            </p>
          </div>
        )}

        {denuncia && !loading && (
          <div className="space-y-6 animate-card-enter">
            {/* Status Card */}
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${STATUS_COLOR[denuncia.status as Status] || STATUS_COLOR.pendente}`}>
                {(() => {
                  const Icon = STATUS_ICON[denuncia.status as Status] || Clock;
                  return <Icon className="h-8 w-8" />;
                })()}
              </div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                Denúncia #{denuncia.numero_registro?.toString().padStart(4, "0")}
              </h2>
              <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest border ${STATUS_COLOR[denuncia.status as Status] || STATUS_COLOR.pendente}`}>
                {STATUS_LABEL[denuncia.status as Status] || "Pendente"}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Registrada em {format(new Date(denuncia.created_at), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>

            {/* Details Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b border-border pb-3">
                Informações da Denúncia
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Título</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{denuncia.titulo || "—"}</p>
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
            </div>

            {/* Documentos Anexados Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 border-b border-border pb-3 mb-4">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                  Documentos Anexados
                </h3>
              </div>

              {getDocCount() > 0 ? (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <FileSignature className="h-8 w-8 text-primary/60" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {getDocCount()} documento(s) anexado(s)
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {denuncia.status === "concluida" || denuncia.status === "em_analise"
                        ? "Os documentos estão em análise pela Corregedoria."
                        : "Os documentos serão analisados pela Corregedoria."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <FileText className="h-8 w-8 text-muted-foreground/30" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Nenhum documento anexado a esta denúncia.
                    </p>
                  </div>
                </div>
              )}

              {/* Show count but not content */}
              {denuncia.dados_detalhados?.provas_selecionadas?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {denuncia.dados_detalhados.provas_selecionadas.map((p: string) => (
                    <span key={p} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Note */}
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
              Insira o número de registro para consultar
            </p>
          </div>
        )}

        {/* Info Cards */}
        {!denuncia && !loading && (
          <div className="mt-10 grid gap-4 md:grid-cols-3 animate-card-enter stagger-1">
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <Search className="mx-auto h-5 w-5 text-primary mb-2" />
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
              <p className="text-[11px] text-muted-foreground mt-1">Acompanhe o andamento aqui</p>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
