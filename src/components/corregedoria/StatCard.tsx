import type React from "react";
import { useEffect, useState } from "react";

function AnimatedRing({
  value,
  max,
  color,
  size = 56,
  strokeWidth = 4,
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const [animated, setAnimated] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? (animated / max) * 100 : 0;
  const dashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(ease * value));
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        strokeLinecap="round"
        className={color}
        style={{ transition: "stroke-dashoffset 0.3s ease" }}
      />
    </svg>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  ringColor,
  max,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  ringColor?: string;
  max?: number;
}) {
  const numValue = typeof value === "string" ? parseInt(value) || 0 : value;

  return (
    <div className="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-border/80 hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
            {value}
          </div>
          {subtitle && (
            <div className="text-[10px] text-muted-foreground mt-1">{subtitle}</div>
          )}
        </div>
        {max !== undefined && (
          <AnimatedRing
            value={numValue}
            max={max}
            color={ringColor || "text-primary"}
            size={48}
            strokeWidth={3}
          />
        )}
      </div>
    </div>
  );
}
