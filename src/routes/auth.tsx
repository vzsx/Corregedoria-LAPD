import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield, Loader2 } from "lucide-react";
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
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: "pending",
      });

      if (roleError) {
        console.error("Erro ao criar papel:", roleError);
        setLoading(false);
        return toast.error("Usuário criado na Auth, mas erro ao salvar papel: " + roleError.message);
      }

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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — blue branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gov-dark flex-col items-center justify-center p-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded overflow-hidden border border-white/10 mb-6">
          <img src="/corregedoria-logo.png" alt="Brasão PMESP" className="h-full w-full object-cover" />
        </div>
        <h2 className="text-2xl font-semibold text-white">
          Corregedoria Geral
        </h2>
        <p className="mt-2 text-sm text-white/50">
          Polícia Militar do Estado de São Paulo
        </p>
        <div className="mt-6 h-px w-12 bg-white/10" />
        <p className="mt-6 max-w-xs text-xs text-white/40 leading-relaxed">
          Sistema de gestão e acompanhamento dos procedimentos corregatórios internos.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="flex flex-col items-center lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded overflow-hidden border border-border mb-4">
              <img src="/corregedoria-logo.png" alt="Brasão PMESP" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-lg font-semibold text-gov-dark">Corregedoria Geral</h1>
            <p className="text-xs text-muted-foreground">PMESP</p>
          </div>

          {/* Desktop title */}
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-gov-dark">Acesso ao Sistema</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-lg border border-border bg-white p-6 shadow-card">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:text-gov-dark data-[state=active]:shadow-sm font-medium">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-gov-dark data-[state=active]:shadow-sm font-medium">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-name" className="text-sm font-medium text-foreground">Nome</Label>
                    <Input
                      id="login-name"
                      placeholder="Ex: João Silva"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      required
                      autoComplete="username"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="bg-background"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gov-blue text-white hover:bg-gov-blue/90 font-medium mt-2">
                    {loading ? "Processando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">Nome Completo</Label>
                    <Input
                      id="name"
                      placeholder="Ex: João Silva"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoComplete="name"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="bg-background"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Seu nome será usado como identificador de acesso ao sistema.</p>
                  <Button type="submit" disabled={loading} className="w-full bg-gov-blue text-white hover:bg-gov-blue/90 font-medium mt-2">
                    {loading ? "Enviando solicitação..." : "Solicitar Acesso"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Shield className="h-3 w-3 flex-shrink-0" />
            <span>Sistema de Uso Restrito da Polícia Militar de São Paulo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
