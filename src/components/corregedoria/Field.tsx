import type React from "react";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
