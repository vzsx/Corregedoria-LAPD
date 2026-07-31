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
          ? "bg-pmesp-red text-[#E8E8E8]"
          : "text-[#ADADAD] hover:bg-[#3A3A3A] hover:text-[#E8E8E8]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {badge !== undefined && (
        <span
          className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
            active ? "bg-[#E8E8E8]/20 text-[#E8E8E8]" : "bg-pmesp-red/80 text-[#E8E8E8]"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
