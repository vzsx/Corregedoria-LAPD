import type React from "react";

export function SidebarItem({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-pmesp-red text-white"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {badge !== undefined && (
        <span
          className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
            active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
