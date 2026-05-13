import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Scale, Eye, Lock, ArrowRight, FileText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-20" />
        <div className="container relative mx-auto px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-card/50 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gold">
              <Shield className="h-3 w-3" /> Internal Affairs Division
            </div>
            <h1 className="font-display text-5xl font-bold uppercase leading-tight tracking-tight text-foreground md:text-7xl">
              Corregedoria da <span className="text-gold">LAPD</span>
              <br />
              Compton
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Fiscalizamos a conduta dos policiais para garantir integridade,
              transparência e justiça em cada operação no perímetro de Compton.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link to="/denuncias">
                <Button size="lg" className="bg-badge-gradient shadow-glow">
                  Fazer uma Denúncia <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline">
                  Acesso Corregedor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quem somos */}
      <section className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide md:text-4xl">
            Quem Somos
          </h2>
          <p className="mt-4 text-muted-foreground">
            A Corregedoria (Internal Affairs) é a divisão da LAPD responsável por
            investigar denúncias de má conduta, abuso de autoridade e violações
            de protocolo cometidas por agentes da própria corporação. Nosso
            compromisso é com a verdade — independente do uniforme.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Scale,
              title: "Imparcialidade",
              text: "Cada denúncia é tratada com sigilo e analisada sem favorecimento, seja contra recruta ou capitão.",
            },
            {
              icon: Eye,
              title: "Fiscalização Ativa",
              text: "Monitoramos ocorrências, abordagens e operações para detectar desvios de conduta.",
            },
            {
              icon: Lock,
              title: "Sigilo Garantido",
              text: "A identidade do denunciante é protegida. Você pode denunciar de forma totalmente anônima.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-elegant"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-badge-gradient">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 pb-20">
        <div className="rounded-xl border border-gold/30 bg-card p-10 text-center shadow-elegant md:p-16">
          <FileText className="mx-auto h-12 w-12 text-gold" />
          <h2 className="mt-6 font-display text-3xl font-bold uppercase tracking-wide">
            Presenciou uma irregularidade?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Toda denúncia, anônima ou identificada, é registrada e investigada
            pela equipe da Corregedoria.
          </p>
          <Link to="/denuncias" className="mt-8 inline-block">
            <Button size="lg" className="bg-badge-gradient shadow-glow">
              Registrar Denúncia <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
