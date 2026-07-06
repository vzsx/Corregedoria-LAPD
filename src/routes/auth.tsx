import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield, Lock, User, BadgeCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { logAudit } from "@/lib/audit-log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { user, roles, loading: authLoading, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Normaliza o nome para ser usado como prefixo do email
  const normalizeName = (name: string) =>
    name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");

  useEffect(() => {
    if (user && !authLoading) {
      navigate({ to: "/corregedoria" });
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const emailFormatted = `${normalizeName(loginName)}@pmesp.sp.gov.br`;
    const { error } = await supabase.auth.signInWithPassword({
      email: emailFormatted,
      password,
    });

    if (!error) {
      await refreshRoles();
      toast.success("Login realizado com sucesso.");
    } else {
      toast.error("Nome ou senha incorretos.");
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const emailFormatted = `${normalizeName(fullName)}@pmesp.sp.gov.br`;

    const { data, error } = await supabase.auth.signUp({
      email: emailFormatted,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    if (data.user) {
      // Registrar papel pendente
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: "pending",
      });

      if (roleError) {
        console.error("Erro ao criar papel:", roleError);
        setLoading(false);
        return toast.error("Usuário criado na Auth, mas erro ao salvar papel: " + roleError.message);
      }

      // Registrar perfil
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        badge_number: emailFormatted,
        patente: "Oficial",
      });

      if (profileError) {
        console.error("Erro ao criar perfil:", profileError);
        setLoading(false);
        return toast.error("Usuário criado, mas erro ao salvar perfil: " + profileError.message);
      }

      toast.success("Cadastro realizado. Aguarde aprovação de um administrador.");
      logAudit({ user_id: data.user?.id, user_name: fullName, action: "create", entity_type: "user", details: { email: emailFormatted, nome: fullName } });
    }

    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 font-mono">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center animate-slide-up">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full overflow-hidden bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(201,160,58,0.3)] hover:border-primary/50">
            <img src="/corregedoria-logo.png" alt="Brasão Corregedoria PMESP" className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-black uppercase tracking-widest text-foreground">
            Terminal Corregedoria
          </h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Corregedoria Geral · PMESP
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(201,160,58,0.15)] hover:border-primary/30 animate-scale-in">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="mb-8 grid w-full grid-cols-2 bg-background border border-border p-1">
              <TabsTrigger value="signin" className="data-[state=active]:bg-muted data-[state=active]:text-foreground cursor-pointer">ENTRAR</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-muted data-[state=active]:text-foreground cursor-pointer">CADASTRAR</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-name" className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
                  <Input
                    id="login-name"
                    placeholder="Ex: João Silva"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    required
                    autoComplete="username"
                    className="bg-background border-input focus:ring-1 focus:ring-ring focus:border-ring text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Senha de Acesso</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="bg-background border-input focus:ring-1 focus:ring-ring focus:border-ring text-foreground"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-foreground text-background hover:bg-foreground/80 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold uppercase tracking-widest mt-4">
                  {loading ? "Processando..." : "Autenticar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Ex: João Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                    className="bg-background border-input focus:ring-1 focus:ring-ring focus:border-ring text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-xs uppercase tracking-wider text-muted-foreground">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="bg-background border-input focus:ring-1 focus:ring-ring focus:border-ring text-foreground"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground pt-1">Seu nome será usado como identificador de acesso ao sistema.</p>
                <Button type="submit" disabled={loading} className="w-full bg-foreground text-background hover:bg-foreground/80 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold uppercase tracking-widest mt-2">
                  {loading ? "Enviando solicitação..." : "Solicitar Acesso"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
          <BadgeCheck className="h-3 w-3 flex-shrink-0" />
          <span>Sistema de Uso Restrito da Polícia Militar de São Paulo</span>
        </div>
      </div>
    </div>
  );
}
