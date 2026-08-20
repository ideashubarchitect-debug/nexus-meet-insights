import { Cloud, HardDrive, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DATA_LOCATION_LABEL } from "@/lib/kivora/profiles";
import type { DataLocation } from "@/lib/kivora/types";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("surface p-5", className)}>
      {title ? (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "local" | "primary";
}) {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        {Icon ? (
          <Icon
            className={cn(
              "size-4",
              tone === "local" ? "text-local" : tone === "primary" ? "text-primary" : "text-muted-foreground",
            )}
          />
        ) : null}
      </div>
      <p className={cn("num mt-2 text-2xl font-semibold", tone === "local" && "text-local")}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function DataLocationBadge({ location, className }: { location: DataLocation; className?: string }) {
  const map = {
    local_only: { icon: HardDrive, cls: "bg-local/12 text-local ring-local/30" },
    encrypted_sync: { icon: Lock, cls: "bg-primary/12 text-primary ring-primary/30" },
    cloud_recording: { icon: Cloud, cls: "bg-warning/12 text-warning ring-warning/30" },
  } as const;
  const { icon: Icon, cls } = map[location];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
        cls,
        className,
      )}
    >
      <Icon className="size-3" />
      {DATA_LOCATION_LABEL[location]}
    </span>
  );
}

export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--secondary)" strokeWidth="7" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute text-center">
        <p className="num text-xl font-semibold leading-none">{score}</p>
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground">/ 100</p>
      </div>
    </div>
  );
}

export function EvidenceNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-border bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}
