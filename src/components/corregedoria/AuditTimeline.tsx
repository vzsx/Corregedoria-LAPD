import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  PlusCircle,
  Pencil,
  Trash2,
  LogIn,
  Link2,
  Unlink,
  RefreshCw,
  Clock,
} from "lucide-react";

interface AuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; borderColor: string; label: string }> = {
  create: {
    icon: PlusCircle,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    label: "Criou",
  },
  update: {
    icon: Pencil,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    label: "Atualizou",
  },
  delete: {
    icon: Trash2,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    label: "Excluiu",
  },
  login: {
    icon: LogIn,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    label: "Acessou",
  },
  link: {
    icon: Link2,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    label: "Vinculou",
  },
  unlink: {
    icon: Unlink,
    color: "text-[#888888]",
    bgColor: "bg-[#333333]/30",
    borderColor: "border-[#444444]",
    label: "Desvinculou",
  },
  status_change: {
    icon: RefreshCw,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    label: "Alterou status",
  },
};

const ENTITY_LABELS: Record<string, string> = {
  denuncia: "Denúncia",
  relatorio: "Relatório",
  investigacao: "Investigação",
  depoimento: "Depoimento",
  ipm: "IPM",
  user: "Usuário",
  user_role: "Permissão",
  profile: "Perfil",
  afastamentos: "Afastamento",
  atos_administrativos: "Ato Administrativo",
  portaria: "Portaria",
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHr < 24) return `${diffHr}h atrás`;
  if (diffDay < 7) return `${diffDay}d atrás`;
  return format(date, "dd/MM/yy", { locale: ptBR });
}

export function AuditTimeline({ logs }: { logs: AuditEntry[] }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[#333333]" />

      <div className="space-y-1">
        {logs.map((log, i) => {
          const config = ACTION_CONFIG[log.action] || {
            icon: Clock,
            color: "text-[#888888]",
            bgColor: "bg-[#333333]/30",
            borderColor: "border-[#444444]",
            label: log.action,
          };
          const Icon = config.icon;
          const entityLabel = ENTITY_LABELS[log.entity_type] || log.entity_type;

          return (
            <div
              key={log.id}
              className="relative flex items-start gap-4 py-3 pl-2 pr-4 rounded-lg transition-colors hover:bg-[#2A2A2A]/50 group"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Icon dot */}
              <div className={`relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border ${config.borderColor} ${config.bgColor} transition-transform group-hover:scale-110`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#D0D0D0]">
                    {log.user_name || "Sistema"}
                  </span>
                  <span className={`text-[10px] font-bold ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-[10px] text-[#888888]">
                    {entityLabel}
                  </span>
                  {log.entity_id && (
                    <span className="text-[10px] font-mono text-[#555555]">
                      #{log.entity_id.slice(0, 8)}
                    </span>
                  )}
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <p className="text-[11px] text-[#666666] mt-1 truncate max-w-md">
                    {Object.entries(log.details)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(" · ")}
                  </p>
                )}
              </div>

              {/* Timestamp */}
              <div className="flex flex-col items-end pt-1 shrink-0">
                <span className="text-[10px] text-[#555555] tabular-nums">
                  {getRelativeTime(log.created_at)}
                </span>
                <span className="text-[9px] text-[#444444]">
                  {format(new Date(log.created_at), "HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
