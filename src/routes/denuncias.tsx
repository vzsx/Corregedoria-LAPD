import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Shield, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/denuncias")({
  head: () => ({
    meta: [
      { title: "Fazer Denúncia — LAPD Corregedoria Compton" },
      { name: "description", content: "Registre uma denúncia anônima contra um policial da LAPD Compton." },
    ],
  }),
  component: DenunciasPage,
});

const schema = z.object({
  titulo: z.string().trim().min(5, "Título muito curto").max(150),
  descricao: z.string().trim().min(20, "Descreva com pelo menos 20 caracteres").max(5000),
  policial_denunciado: z.string().trim().max(200).optional(),
  data_ocorrido: z.string().trim().max(100).optional(),
  contato_opcional: z.string().trim().max(200).optional(),
});

function DenunciasPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = {
      titulo: String(fd.get("titulo") ?? ""),
      descricao: String(fd.get("descricao") ?? ""),
      policial_denunciado: String(fd.get("policial_denunciado") ?? "") || undefined,
      data_ocorrido: String(fd.get("data_ocorrido") ?? "") || undefined,
      contato_opcional: String(fd.get("contato_opcional") ?? "") || undefined,
    };
    const provas = String(fd.get("provas") ?? "").trim();
    
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    let finalDescricao = parsed.data.descricao;
    if (provas) {
      finalDescricao += `\n\n--- PROVAS ANEXADAS ---\n${provas}`;
    }

    const payload = {
      ...parsed.data,
      descricao: finalDescricao
    };

    setLoading(true);
    const { error } = await supabase.from("denuncias").insert(payload);
    setLoading(false);

    if (error) {
      toast.error("Não foi possível enviar. Tente novamente.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="container mx-auto max-w-2xl px-6 py-16">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-card/50 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gold">
            <Shield className="h-3 w-3" /> Canal Oficial
          </div>
          <h1 className="font-display text-4xl font-bold uppercase tracking-tight">
            Fazer uma Denúncia
          </h1>
          <p className="mt-3 text-muted-foreground">
            Sua denúncia é anônima por padrão. Forneça contato apenas se desejar
            ser chamado para depoimento.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-gold/30 bg-card p-10 text-center shadow-elegant">
            <CheckCircle2 className="mx-auto h-14 w-14 text-gold" />
            <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide">
              Denúncia Registrada
            </h2>
            <p className="mt-2 text-muted-foreground">
              Sua denúncia foi recebida e será analisada pela Corregedoria.
              Obrigado por contribuir com a integridade da LAPD.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>
              Enviar outra denúncia
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl border border-border bg-card p-8 shadow-elegant"
          >
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" name="titulo" required maxLength={150} placeholder="Ex: Abuso de autoridade durante abordagem" />
            </div>
            <div>
              <Label htmlFor="policial_denunciado">Policial denunciado</Label>
              <Input id="policial_denunciado" name="policial_denunciado" maxLength={200} placeholder="Nome / número de placa (se souber)" />
            </div>
            <div>
              <Label htmlFor="data_ocorrido">Quando ocorreu?</Label>
              <Input id="data_ocorrido" name="data_ocorrido" maxLength={100} placeholder="Ex: 12/05 por volta das 23h" />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição detalhada *</Label>
              <Textarea
                id="descricao"
                name="descricao"
                required
                rows={7}
                maxLength={5000}
                placeholder="Descreva o ocorrido: local, pessoas envolvidas, o que aconteceu..."
              />
            </div>
            <div>
              <Label htmlFor="provas">Anexar provas</Label>
              <Textarea
                id="provas"
                name="provas"
                rows={3}
                maxLength={2000}
                placeholder="Cole aqui os links das imagens (Imgur, Lightshot) ou vídeos (YouTube, Medal, etc.)"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Insira os links para comprovar a sua denúncia.
              </p>
            </div>
            <div>
              <Label htmlFor="contato_opcional">Contato (opcional)</Label>
              <Input id="contato_opcional" name="contato_opcional" maxLength={200} placeholder="Discord, telefone in-game, etc." />
              <p className="mt-1 text-xs text-muted-foreground">
                Deixe em branco para denúncia 100% anônima.
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-badge-gradient shadow-glow">
              {loading ? "Enviando..." : "Enviar Denúncia"}
            </Button>
          </form>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
