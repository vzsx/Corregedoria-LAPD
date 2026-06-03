import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield, Lock, User, BadgeCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");

  useEffect(() => {
    if (user && !authLoading) {
      navigate({ to: "/corregedoria" });
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: `${badgeNumber.trim()}@pmesp.sp.gov.br`,
      password,
    });

    if (!error) {
      await refreshRoles();
      toast.success("Login realizado com sucesso.");
    } else {
      toast.error(error.message);
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: `${badgeNumber.trim()}@pmesp.sp.gov.br`,
      password,
      options: {
        data: {
          full_name: fullName,
          badge_number: badgeNumber,
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
        badge_number: badgeNumber,
        patente: "Oficial",
      });

      if (profileError) {
        console.error("Erro ao criar perfil:", profileError);
        setLoading(false);
        return toast.error("Usuário criado, mas erro ao salvar perfil: " + profileError.message);
      }

      toast.success("Cadastro realizado. Aguarde aprovação de um administrador.");
    }

    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 font-mono">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full overflow-hidden bg-card border border-border shadow-glow">
            <img src="/corregedoria-logo.png" alt="Brasão Corregedoria PMESP" className="h-full w-full object-cover" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-black uppercase tracking-widest text-white">
            Terminal Corregedoria
          </h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Corregedoria Geral · PMESP
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-2xl">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="mb-8 grid w-full grid-cols-2 bg-black border border-border p-1">
              <TabsTrigger value="signin" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white cursor-pointer">ENTRAR</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white cursor-pointer">CADASTRAR</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="badge" className="text-xs uppercase tracking-wider text-slate-400">Número do RE (Registro Especial)</Label>
                  <Input
                    id="badge"
                    placeholder="Ex: 123456"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    required
                    className="bg-black border-border focus:ring-1 focus:ring-white/40 focus:border-white/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs uppercase tracking-wider text-slate-400">Senha de Acesso</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-black border-border focus:ring-1 focus:ring-white/40 focus:border-white/50 text-white"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold uppercase tracking-widest mt-4">
                  {loading ? "Processando..." : "Autenticar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs uppercase tracking-wider text-slate-400">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Nome e Sobrenome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-black border-border focus:ring-1 focus:ring-white/40 focus:border-white/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-badge" className="text-xs uppercase tracking-wider text-slate-400">Número do RE (Registro Especial)</Label>
                  <Input
                    id="signup-badge"
                    placeholder="Ex: 123456"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    required
                    className="bg-black border-border focus:ring-1 focus:ring-white/40 focus:border-white/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-xs uppercase tracking-wider text-slate-400">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-black border-border focus:ring-1 focus:ring-white/40 focus:border-white/50 text-white"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold uppercase tracking-widest mt-4">
                  {loading ? "Enviando solicitação..." : "Solicitar Acesso"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-600 text-center">
          <BadgeCheck className="h-3 w-3 flex-shrink-0" />
          <span>Sistema de Uso Restrito da Polícia Militar de São Paulo</span>
        </div>
      </div>
    </div>
  );
}
