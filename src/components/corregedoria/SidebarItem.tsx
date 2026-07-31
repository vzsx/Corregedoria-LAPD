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
      className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-[#7A0000] text-[#D0D0D0]"
          : "text-[#888888] hover:bg-[#2A2A2A] hover:text-[#D0D0D0]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {badge !== undefined && (
        <span
          className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
            active ? "bg-[#D0D0D0]/20 text-[#D0D0D0]" : "bg-[#7A0000]/80 text-[#D0D0D0]"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
