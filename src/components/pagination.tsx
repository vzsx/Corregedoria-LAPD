import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function Pagination({ current, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const range: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) range.push(i);
  } else {
    range.push(1);
    if (current > 3) range.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);
    for (let i = start; i <= end; i++) range.push(i);
    if (current < totalPages - 2) range.push("...");
    range.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {range.map((item, i) =>
        item === "..." ? (
          <span key={`dots-${i}`} className="flex h-8 w-8 items-center justify-center text-muted-foreground text-xs">
            ...
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onChange(item as number)}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold transition-all duration-200 ${
              current === item
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item}
          </button>
        )
      )}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current >= totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
