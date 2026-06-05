import type React from "react";

export function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="text-4xl font-bold text-foreground tracking-wider">{value}</div>
    </div>
  );
}
