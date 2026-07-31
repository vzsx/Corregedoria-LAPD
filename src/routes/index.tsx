import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Scale, Eye, Lock, ArrowRight, FileText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  const heroSection = useInView(0.1);
  const aboutSection = useInView(0.1);
  const ctaSection = useInView(0.1);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SiteHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-pmesp-dark">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pmesp-dark via-pmesp-dark to-pmesp-red/30" />

        <div className="container relative mx-auto px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center" ref={heroSection.ref}>
            {/* PMESP Logo */}
            <div
              className={`mx-auto mb-6 flex h-28 w-28 items-center justify-center transition-all duration-700 ${
                mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
              }`}
            >
              <img src="/pmesp-logo.png" alt="Logo PMESP" className="h-full w-full object-contain" />
            </div>

            {/* Badge */}
            <div
              className={`mb-6 inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/80 transition-all duration-700 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              }`}
            >
              <Shield className="h-3 w-3" />
              Corregedoria Geral PMESP
            </div>

            {/* Headline */}
            <h1
              className={`text-3xl font-semibold leading-tight text-white md:text-4xl transition-all duration-700 delay-150 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Corregedoria Polícia Militar
              <br />
              <span className="text-white/60 font-normal text-2xl md:text-3xl">do Estado de São Paulo</span>
            </h1>

            {/* Subtitle */}
            <p
              className={`mx-auto mt-5 max-w-2xl text-base text-white/60 transition-all duration-700 delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Fiscalizamos a conduta dos policiais militares para garantir integridade,
              transparência e justiça em cada operação no Estado de São Paulo.
            </p>

            {/* CTA Buttons */}
            <div
              className={`mt-8 flex flex-wrap justify-center gap-3 transition-all duration-700 delay-500 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Link to="/denuncias">
                <Button
                  size="lg"
                  className="bg-white text-pmesp-dark hover:bg-white/90 font-medium"
                >
                  Fazer uma Denúncia
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link to="/auth">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 font-medium"
                >
                  Acesso Corregedor
                  <Lock className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Acompanhar Denúncia */}
            <div
              className={`mt-4 transition-all duration-700 delay-700 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Link to="/acompanhar" className="text-xs text-white/40 hover:text-white/70 underline underline-offset-4 transition-colors">
                Já fez uma denúncia? Acompanhe o andamento
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUEM SOMOS ── */}
      <section className="container mx-auto px-6 py-20" ref={aboutSection.ref}>
        <div
          className={`mx-auto max-w-3xl text-center transition-all duration-700 ${
            aboutSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-2xl font-semibold text-pmesp-dark md:text-3xl">
            Quem Somos
          </h2>
          <p className="mt-4 text-muted-foreground">
            A <span className="font-medium text-foreground">Corregedoria da Polícia Militar (PMESP)</span> é o órgão encarregado de investigar suspeitas de má conduta, corrupção, uso excessivo de força ou violação de regulamentos por parte de seus próprios policiais. Seu principal objetivo é manter a integridade da corporação militar e garantir a transparência perante a sociedade.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
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
          ].map((f, i) => (
            <div
              key={f.title}
              className={`rounded-lg border border-border bg-white p-6 transition-all duration-500 hover:shadow-card-hover
                ${aboutSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: aboutSection.inView ? `${i * 120}ms` : "0ms" }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-pmesp-dark">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container mx-auto px-6 pb-20" ref={ctaSection.ref}>
        <div
          className={`rounded-lg border border-border bg-white p-10 text-center md:p-14 transition-all duration-700
            ${ctaSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <FileText className="mx-auto h-10 w-10 text-primary" />

          <h2 className="mt-4 text-xl font-semibold text-pmesp-dark">
            Presenciou uma irregularidade?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Toda denúncia, anônima ou identificada, é registrada e investigada
            pela equipe da Corregedoria.
          </p>
          <Link to="/denuncias" className="mt-6 inline-block">
            <Button
              size="lg"
              className="bg-primary text-white hover:bg-primary/90 font-medium"
            >
              Registrar Denúncia
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
