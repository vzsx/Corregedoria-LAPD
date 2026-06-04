import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Scale, Eye, Lock, ArrowRight, FileText, ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

// Hook para detectar quando um elemento entra na viewport
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

function Index() {
  const [mounted, setMounted] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const heroSection = useInView(0.1);
  const aboutSection = useInView(0.1);
  const ctaSection = useInView(0.1);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const addRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rip => rip.id !== id)), 700);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SiteHeader />

      {/* ── HERO ── */}
      <section className="bg-hero relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-20" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-[orb1_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[var(--gold)]/5 blur-2xl animate-[orb2_6s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/5 animate-[spin_30s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/8 animate-[spin_20s_linear_infinite_reverse]" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        <div className="container relative mx-auto px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center" ref={heroSection.ref}>

            {/* PMESP Logo */}
            <div
              className={`mx-auto mb-6 flex h-32 w-32 items-center justify-center transition-all duration-700 ${
                mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
              }`}
            >
              <img src="/pmesp-logo.png" alt="Logo PMESP" className="h-full w-full object-contain" />
            </div>

            {/* Badge pill */}
            <div
              className={`mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-foreground backdrop-blur transition-all duration-700 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              }`}
            >
              <span className="relative flex h-3 w-3 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground opacity-50" />
                <Shield className="h-3 w-3 relative z-10" />
              </span>
              Corregedoria Geral PMESP
            </div>

            {/* Headline */}
            <h1
              className={`font-display text-3xl font-bold uppercase leading-snug tracking-wide text-foreground md:text-4xl transition-all duration-700 delay-150 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Corregedoria Polícia Militar
              <br />
              <span className="text-muted-foreground font-medium text-2xl md:text-3xl tracking-widest">do Estado de São Paulo</span>
            </h1>

            {/* Subtitle */}
            <p
              className={`mx-auto mt-6 max-w-2xl text-lg text-muted-foreground transition-all duration-700 delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Fiscalizamos a conduta dos policiais militares para garantir integridade,
              transparência e justiça em cada operação no Estado de São Paulo.
            </p>

            {/* CTA Buttons */}
            <div
              className={`mt-10 flex flex-wrap justify-center gap-3 transition-all duration-700 delay-500 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {/* Primary button with ripple */}
              <div
                className="relative overflow-hidden rounded-md group cursor-pointer"
                onClick={addRipple}
              >
                {ripples.map(r => (
                  <span
                    key={r.id}
                    className="absolute rounded-full bg-white/20 animate-[ripple_0.7s_ease-out_forwards] pointer-events-none"
                    style={{ left: r.x - 50, top: r.y - 50, width: 100, height: 100 }}
                  />
                ))}
                <Link to="/denuncias">
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-[var(--gold)] hover:text-black group-hover:scale-105 transition-all duration-300 font-bold tracking-wide"
                  >
                    Fazer uma Denúncia
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300 text-black group-hover:text-black" />
                  </Button>
                </Link>
              </div>

              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-[var(--gold)] hover:text-black font-bold tracking-wide transition-all duration-300"
                >
                  Acesso Corregedor
                  <Lock className="ml-2 h-4 w-4 text-black group-hover:text-black transition-colors duration-300" />
                </Button>
              </Link>
            </div>

            {/* Scroll indicator */}
            <div
              className={`mt-16 flex flex-col items-center gap-1 text-muted-foreground/50 transition-all duration-700 delay-700 ${
                mounted ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="text-[10px] uppercase tracking-widest">Scroll</span>
              <ChevronDown className="h-4 w-4 animate-bounce" />
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
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide md:text-4xl">
            Quem Somos
          </h2>
          <p className="mt-4 text-muted-foreground">
            A <span className="font-semibold text-foreground">Corregedoria da Polícia Militar (PMESP)</span> é o órgão encarregado de investigar suspeitas de má conduta, corrupção, uso excessivo de força ou violação de regulamentos por parte de seus próprios policiais. Seu principal objetivo é manter a integridade da corporação militar e garantir a transparência perante a sociedade.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Scale,
              title: "Imparcialidade",
              text: "Cada denúncia é tratada com sigilo e analisada sem favorecimento, seja contra recruta ou capitão.",
              color: "from-primary/20 to-transparent",
              border: "hover:border-primary/60",
              glow: "hover:shadow-[0_0_40px_var(--color-primary)/0.15]",
            },
            {
              icon: Eye,
              title: "Fiscalização Ativa",
              text: "Monitoramos ocorrências, abordagens e operações para detectar desvios de conduta.",
              color: "from-[var(--gold)]/20 to-transparent",
              border: "hover:border-[var(--gold)]/60",
              glow: "hover:shadow-[0_0_40px_var(--gold)/0.15]",
            },
            {
              icon: Lock,
              title: "Sigilo Garantido",
              text: "A identidade do denunciante é protegida. Você pode denunciar de forma totalmente anônima.",
              color: "from-emerald-500/20 to-transparent",
              border: "hover:border-emerald-500/60",
              glow: "hover:shadow-[0_0_40px_oklch(0.7_0.2_160)/0.15]",
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className={`group relative rounded-lg border border-border bg-card p-6 overflow-hidden cursor-default
                transition-all duration-500 ${f.border} ${f.glow} hover:-translate-y-2 hover:bg-card/80
                ${aboutSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: aboutSection.inView ? `${i * 120}ms` : "0ms" }}
            >
              {/* Gradient glow sweep */}
              <div
                className={`absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg bg-gradient-to-br ${f.color} pointer-events-none`}
              />

              {/* Icon */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-white relative group-hover:scale-110 transition-transform duration-300">
                <f.icon className="h-6 w-6 text-black group-hover:text-[var(--gold)] transition-colors duration-300" />
              </div>

              <h3 className="font-display text-lg font-bold uppercase tracking-wide group-hover:text-[var(--gold)] transition-colors duration-300">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                {f.text}
              </p>

              {/* Corner accent */}
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-[var(--gold)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tl-3xl" />
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container mx-auto px-6 pb-20" ref={ctaSection.ref}>
        <div
          className={`rounded-xl border border-[var(--gold)]/30 bg-card p-10 text-center md:p-16 relative overflow-hidden
            transition-all duration-700 hover:border-[var(--gold)]/60 hover:shadow-[0_30px_80px_-20px_var(--gold)/0.2]
            ${ctaSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Background pulse */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--gold)/5_0%,_transparent_70%)] animate-[ctaPulse_4s_ease-in-out_infinite]" />

          <div className="relative z-10">
            <div className="relative inline-block">
              <FileText className="mx-auto h-12 w-12 text-white group-hover:text-[var(--gold)] animate-[floatIcon_3s_ease-in-out_infinite] transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-[var(--gold)]/20 animate-ping opacity-30" />
              </div>
            </div>

            <h2 className="mt-6 font-display text-3xl font-bold uppercase tracking-wide">
              Presenciou uma irregularidade?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Toda denúncia, anônima ou identificada, é registrada e investigada
              pela equipe da Corregedoria.
            </p>
            <Link to="/denuncias" className="mt-8 inline-block">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-[var(--gold)] hover:text-black hover:scale-105 transition-all duration-300 font-bold tracking-wide"
              >
                Registrar Denúncia
                <ArrowRight className="ml-2 h-4 w-4 text-black group-hover:text-black group-hover:translate-x-1 transition-all duration-300" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
