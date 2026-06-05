import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Shield, FileText, CheckCircle2, ShieldAlert, 
  User, Users, MapPin, Image, CheckSquare, Info,
  ArrowLeft, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/denuncias")({
  component: Denuncias,
});

const TIPO_DENUNCIA_OPTIONS = [
  "Abuso de Autoridade",
  "Uso Excessivo de Força",
  "Corrupção / Suborno",
  "Má Conduta Profissional",
  "Discriminação",
  "Negligência de Dever",
];

const PROVAS_OPTIONS = [
  "Vídeo",
  "Áudio",
  "Fotos",
  "Documentos",
  "Mensagens/Chat",
];

function Denuncias() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    reclamante_nome: "",
    reclamante_id: "",
    reclamante_contato: "",
    reclamante_anonimo: "Não",
    denunciado_nome: "",
    denunciado_patente: "",
    denunciado_badge: "",
    tipo_denuncia: [] as string[],
    tipo_denuncia_outro: "",
    incidente_data: "",
    incidente_horario: "",
    incidente_local: "",
    relato_fatos: "",
    testemunhas_tem: "Não",
    testemunhas_nomes: "",
    provas_selecionadas: [] as string[],
    provas_outro: "",
    provas_descricao: "",
    declaracao_assinatura: ""
  });

  const handleCheckboxChange = (listName: 'tipo_denuncia' | 'provas_selecionadas', value: string) => {
    setFormData(prev => {
      const list = prev[listName];
      if (list.includes(value)) {
        return { ...prev, [listName]: list.filter(i => i !== value) };
      } else {
        return { ...prev, [listName]: [...list, value] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const finalReclamanteNome = formData.reclamante_anonimo === "Sim" ? "ANÔNIMO" : (formData.reclamante_nome || "Desconhecido");

    const { error } = await supabase
      .from("denuncias")
      .insert([{
        titulo: `DENÚNCIA: ${formData.denunciado_nome || "Oficial Desconhecido"}`,
        descricao: `Denúncia via formulário da Corregedoria. Reclamante: ${finalReclamanteNome}`,
        policial_denunciado: formData.denunciado_nome,
        data_ocorrido: `${formData.incidente_data} ${formData.incidente_horario}`,
        contato_opcional: formData.reclamante_contato,
        status: "pendente",
        dados_detalhados: formData
      }]);
      
    setLoading(false);
    
    if (error) {
      console.error("Erro ao enviar denúncia:", error);
      toast.error("Erro ao enviar denúncia. Tente novamente.");
    } else {
      toast.success("Denúncia protocolada com sucesso!");
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="container mx-auto max-w-3xl px-6 py-12">
        <div className="mb-12 text-center animate-fade-in">
          {/* PMESP Logo */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-card/50 p-2 border border-border shadow-glow transition-all duration-300 hover:shadow-[0_0_30px_rgba(201,160,58,0.3)] hover:border-primary/50">
            <img src="/pmesp-logo.png" alt="Logo PMESP" className="h-full w-full object-contain transition-transform duration-500 hover:scale-110" />
          </div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground">
            <ShieldAlert className="h-3 w-3 text-foreground" /> Canal de Ética e Corregedoria
          </div>
          <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-foreground sm:text-5xl">
            Corregedoria Geral <span className="text-muted-foreground">PMESP</span>
          </h1>
          <p className="mt-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Formulário Simplificado de Denúncia
          </p>
          <div className="mx-auto mt-6 h-1 w-24 bg-primary"></div>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-12 text-center shadow-2xl animate-scale-in">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="mt-8 font-display text-3xl font-black uppercase tracking-tight text-foreground animate-slide-up">
              Denúncia Protocolada
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Seu relato foi recebido pelo sistema de integridade da Corregedoria Geral da PMESP. 
              Um corregedor será designado para analisar as informações fornecidas.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-widest uppercase px-8 shadow-sm transition-all duration-300 hover:scale-105">
                <Link to="/">Voltar ao Início</Link>
              </Button>
              <button onClick={() => setSubmitted(false)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
                Enviar outro relato
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 pb-20">
            
            {/* 1. DADOS DO DENUNCIANTE */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(201,160,58,0.1)] hover:border-primary/20 animate-card-enter stagger-1">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-500/10 text-blue-600">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="font-bold uppercase tracking-wider text-foreground">1. Dados do Denunciante</h3>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome Completo</Label>
                  <Input 
                    value={formData.reclamante_nome}
                    onChange={(e) => setFormData({...formData, reclamante_nome: e.target.value})}
                    placeholder="Seu nome oficial" 
                    className="bg-background border-input text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Número do ID</Label>
                  <Input 
                    value={formData.reclamante_id}
                    onChange={(e) => setFormData({...formData, reclamante_id: e.target.value})}
                    placeholder="Ex: 12345" 
                    className="bg-background border-input text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Telefone / Discord</Label>
                  <Input 
                    value={formData.reclamante_contato}
                    onChange={(e) => setFormData({...formData, reclamante_contato: e.target.value})}
                    placeholder="Contato para retorno" 
                    className="bg-background border-input text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deseja permanecer anônimo?</Label>
                  <RadioGroup value={formData.reclamante_anonimo} onValueChange={(v) => setFormData({...formData, reclamante_anonimo: v})} className="flex gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Sim" id="anon-sim" className="border-input text-red-500" />
                      <Label htmlFor="anon-sim" className="text-sm cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Não" id="anon-nao" className="border-input text-blue-500" />
                      <Label htmlFor="anon-nao" className="text-sm cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </section>

            {/* 2. DADOS DO POLICIAL */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(201,160,58,0.1)] hover:border-primary/20 animate-card-enter stagger-2">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-red-500/10 text-red-600">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="font-bold uppercase tracking-wider text-foreground">2. Dados do Policial Denunciado</h3>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome do Policial</Label>
                  <Input 
                    value={formData.denunciado_nome}
                    onChange={(e) => setFormData({...formData, denunciado_nome: e.target.value})}
                    placeholder="Nome ou Apelido" 
                    className="bg-background border-input text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Patente/Cargo</Label>
                  <Input 
                    value={formData.denunciado_patente}
                    onChange={(e) => setFormData({...formData, denunciado_patente: e.target.value})}
                    placeholder="Ex: Sargento" 
                    className="bg-background border-input text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Badge Number</Label>
                  <Input 
                    value={formData.denunciado_badge}
                    onChange={(e) => setFormData({...formData, denunciado_badge: e.target.value})}
                    placeholder="Número da Placa" 
                    className="bg-background border-input text-foreground" 
                  />
                </div>
              </div>
            </section>

            {/* 3. TIPO DE DENÚNCIA */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(201,160,58,0.1)] hover:border-primary/20 animate-card-enter stagger-3">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-amber-500/10 text-amber-600">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <h3 className="font-bold uppercase tracking-wider text-foreground">3. Tipo de Denúncia</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TIPO_DENUNCIA_OPTIONS.map(opt => (
                  <div key={opt} className="flex items-center space-x-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted">
                    <Checkbox 
                      id={`tipo-${opt}`} 
                      checked={formData.tipo_denuncia.includes(opt)}
                      onCheckedChange={() => handleCheckboxChange('tipo_denuncia', opt)}
                      className="border-input data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                    />
                    <Label htmlFor={`tipo-${opt}`} className="text-xs font-medium uppercase tracking-tight cursor-pointer flex-1">{opt}</Label>
                  </div>
                ))}
                <div className="col-span-1 md:col-span-2 space-y-2 mt-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Outro Tipo de Violação</Label>
                  <Input 
                    value={formData.tipo_denuncia_outro}
                    onChange={(e) => setFormData({...formData, tipo_denuncia_outro: e.target.value})}
                    placeholder="Especifique o tipo de denúncia..." 
                    className="bg-background border-input text-foreground" 
                  />
                </div>
              </div>
            </section>

            {/* 4. INFORMAÇÕES DO OCORRIDO */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(201,160,58,0.1)] hover:border-primary/20 animate-card-enter stagger-4">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-indigo-500/10 text-indigo-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="font-bold uppercase tracking-wider text-foreground">4. Informações do Ocorrido</h3>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data do Ocorrido</Label>
                  <Input 
                    type="date"
                    value={formData.incidente_data}
                    onChange={(e) => setFormData({...formData, incidente_data: e.target.value})}
                    className="bg-background border-input text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Horário Aproximado</Label>
                  <Input 
                    type="time"
                    value={formData.incidente_horario}
                    onChange={(e) => setFormData({...formData, incidente_horario: e.target.value})}
                    className="bg-background border-input text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Local do Ocorrido</Label>
                  <Input 
                    value={formData.incidente_local}
                    onChange={(e) => setFormData({...formData, incidente_local: e.target.value})}
                    placeholder="Ex: DP Sul, Praça Central..." 
                    className="bg-background border-input text-foreground" 
                  />
                </div>
              </div>
            </section>

            {/* 5. RELATO DOS FATOS */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-bold uppercase tracking-wider text-foreground">5. Relato dos Fatos</h3>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descrição Resumida do Evento</Label>
                <Textarea 
                  value={formData.relato_fatos}
                  onChange={(e) => setFormData({...formData, relato_fatos: e.target.value})}
                  rows={6}
                  placeholder="Relate com o máximo de detalhes possível o que aconteceu..." 
                  className="bg-background border-input text-foreground leading-relaxed resize-none" 
                  required
                />
              </div>
            </section>

            {/* 6. TESTEMUNHAS */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-emerald-500/10 text-emerald-600">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="font-bold uppercase tracking-wider text-foreground">6. Testemunhas</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Havia testemunhas no local?</Label>
                  <RadioGroup value={formData.testemunhas_tem} onValueChange={(v) => setFormData({...formData, testemunhas_tem: v})} className="flex gap-4 pt-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Sim" id="test-sim" className="border-input" />
                      <Label htmlFor="test-sim" className="text-sm cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Não" id="test-nao" className="border-input" />
                      <Label htmlFor="test-nao" className="text-sm cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {formData.testemunhas_tem === "Sim" && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome(s) das Testemunhas</Label>
                    <Input 
                      value={formData.testemunhas_nomes}
                      onChange={(e) => setFormData({...formData, testemunhas_nomes: e.target.value})}
                      placeholder="Separe os nomes por vírgula" 
                      className="bg-background border-input text-foreground" 
                    />
                  </div>
                )}
              </div>
            </section>

            {/* 7. PROVAS */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-purple-500/10 text-purple-600">
                  <Image className="h-5 w-5" />
                </div>
                <h3 className="font-bold uppercase tracking-wider text-foreground">7. Provas</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {PROVAS_OPTIONS.map(opt => (
                  <div key={opt} className="flex items-center space-x-3 rounded-lg border border-border bg-muted/30 p-3">
                    <Checkbox 
                      id={`prova-${opt}`} 
                      checked={formData.provas_selecionadas.includes(opt)}
                      onCheckedChange={() => handleCheckboxChange('provas_selecionadas', opt)}
                      className="border-input data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <Label htmlFor={`prova-${opt}`} className="text-xs font-medium uppercase tracking-tight cursor-pointer flex-1">{opt}</Label>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Outros tipos de Prova</Label>
                  <Input 
                    value={formData.provas_outro}
                    onChange={(e) => setFormData({...formData, provas_outro: e.target.value})}
                    placeholder="Especifique..." 
                    className="bg-background border-input text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descrição das Provas (Links)</Label>
                  <Textarea 
                    value={formData.provas_descricao}
                    onChange={(e) => setFormData({...formData, provas_descricao: e.target.value})}
                    rows={3}
                    placeholder="Cole aqui os links de vídeos, fotos ou áudios comprobatórios" 
                    className="bg-background border-input text-foreground text-xs resize-none" 
                  />
                  <p className="text-[9px] text-muted-foreground italic mt-1">
                    * Importante: Todas as provas (vídeos, imagens, áudios) devem ser enviadas através de links (Imgur, YouTube, Medal, etc).
                  </p>
                </div>
              </div>
            </section>

            {/* 8. DECLARAÇÃO FINAL */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <h3 className="font-bold uppercase tracking-wider text-foreground">8. Declaração Final</h3>
              </div>
              
              <div className="space-y-6">
                <div className="rounded-lg bg-muted p-4 border border-border">
                  <p className="text-sm text-muted-foreground italic">
                    "Declaro que as informações fornecidas são verdadeiras de acordo com meu conhecimento, 
                    estando ciente de que a falsidade desta declaração pode acarretar em sanções administrativas e penais."
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Assinatura / Nome Completo</Label>
                  <Input 
                    value={formData.declaracao_assinatura}
                    onChange={(e) => setFormData({...formData, declaracao_assinatura: e.target.value})}
                    required
                    placeholder="Digite seu nome completo para assinar" 
                    className="bg-background border-input focus:ring-1 focus:ring-ring focus:border-ring text-foreground font-serif italic text-lg" 
                  />
                </div>
              </div>
            </section>

            <div className="pt-8 animate-card-enter stagger-5">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-16 bg-foreground text-background hover:bg-foreground/80 text-lg font-black uppercase tracking-[0.2em] shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Protocolando...</span>
                ) : "Protocolar Denúncia Oficial"}
              </Button>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                <Info className="h-3 w-3" />
                Sistema de Segurança de Dados Criptografado
              </div>
            </div>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
