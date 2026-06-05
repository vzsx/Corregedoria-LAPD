import { format } from "date-fns";
import { CheckCircle2, Clock, FileText, AlertCircle, ArrowRight, Shield } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "criada" | "status" | "anexo" | "depoimento" | "concluida" | "arquivada";
  title: string;
  description: string;
  date: string;
}

const typeConfig = {
  criada:     { icon: FileText,   color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  status:     { icon: ArrowRight, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  anexo:      { icon: Shield,     color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  depoimento: { icon: AlertCircle, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  concluida:  { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2 },
  arquivada:  { icon: Clock,      color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" },
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-[10px] uppercase tracking-widest">Nenhum evento registrado</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {events.map((event, idx) => {
        const cfg = typeConfig[event.type];
        const Icon = cfg.icon;
        return (
          <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Linha vertical */}
            {idx < events.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
            )}

            {/* Ícone do evento */}
            <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bg} border ${cfg.border}`}>
              <Icon className={`h-4 w-4 ${cfg.color}`} />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-semibold text-foreground">{event.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{event.description}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                {format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
