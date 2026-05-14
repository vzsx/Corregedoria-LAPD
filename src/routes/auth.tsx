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
      email: `${badgeNumber.trim()}@lapd.com`,
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
      email: `${badgeNumber.trim()}@lapd.com`,
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
    <div className="flex min-h-screen items-center justify-center bg-[#020617] p-6 font-mono">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20 text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-black uppercase tracking-widest text-white">
            Terminal IA<span className="text-red-600">G</span>
          </h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
            Internal Affairs Group · LAPD
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d141e] p-8 shadow-2xl">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="mb-8 grid w-full grid-cols-2 bg-slate-950 p-1">
              <TabsTrigger value="signin" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">ENTRAR</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">CADASTRAR</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="badge">Número do Distintivo (Badge)</Label>
                  <Input
                    id="badge"
                    placeholder="Ex: 55432"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-800 focus:border-red-600/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha de Acesso</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-800 focus:border-red-600/50"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-500 font-bold uppercase tracking-widest mt-4">
                  {loading ? "Processando..." : "Autenticar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Oficial Nome Sobrenome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-800 focus:border-red-600/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-badge">Número do Distintivo (Badge)</Label>
                  <Input
                    id="signup-badge"
                    placeholder="Ex: 55432"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-800 focus:border-red-600/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-800 focus:border-red-600/50"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-500 font-bold uppercase tracking-widest mt-4">
                  {loading ? "Enviando solicitação..." : "Solicitar Acesso"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-600">
          <BadgeCheck className="h-3 w-3" />
          Sistema de Uso Restrito da Polícia de Los Angeles
        </div>
      </div>
    </div>
  );
}
