import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/corregedoria" });
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo, oficial.");
    navigate({ to: "/corregedoria" });
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/corregedoria`,
        data: {
          full_name: String(fd.get("full_name")),
          badge_number: String(fd.get("badge_number")),
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Cadastro realizado. Aguarde aprovação de um administrador.");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="container mx-auto max-w-md px-6 py-16">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-badge-gradient shadow-glow">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
            Acesso Corregedoria
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Restrito a oficiais designados da Internal Affairs.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-elegant">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="si-pass">Senha</Label>
                  <Input id="si-pass" name="password" type="password" required minLength={6} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-badge-gradient">
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="su-name">Nome completo</Label>
                  <Input id="su-name" name="full_name" required maxLength={120} />
                </div>
                <div>
                  <Label htmlFor="su-badge">Número da placa</Label>
                  <Input id="su-badge" name="badge_number" required maxLength={20} placeholder="Ex: 4521" />
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="su-pass">Senha</Label>
                  <Input id="su-pass" name="password" type="password" required minLength={6} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sua conta ficará pendente até a aprovação de um administrador.
                </p>
                <Button type="submit" disabled={loading} className="w-full bg-badge-gradient">
                  {loading ? "Cadastrando..." : "Solicitar acesso"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não é da Corregedoria?{" "}
          <Link to="/denuncias" className="text-gold hover:underline">
            Faça uma denúncia
          </Link>
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
