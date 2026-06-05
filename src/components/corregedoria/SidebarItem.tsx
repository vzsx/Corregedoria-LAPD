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
      className={`flex w-full items-center justify-between rounded-md px-4 py-3 text-sm font-medium transition-all ${
        active
          ? "bg-muted text-foreground shadow-[inset_2px_0_0_0_rgba(59,130,246,1)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {badge !== undefined && (
        <span className="flex h-5 items-center justify-center rounded-full bg-primary px-2 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
