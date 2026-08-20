import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Activity,
  Cpu,
  FolderDown,
  Gauge,
  LayoutDashboard,
  Library,
  Radio,
  ShieldCheck,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { restoreJobs, useKivora } from "@/lib/kivora/store";
import { BACKEND_LABEL } from "@/lib/kivora/profiles";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/library", label: "Meeting library", icon: Library },
  { to: "/import", label: "Import & process", icon: FolderDown },
  { to: "/live", label: "Live Assist", icon: Radio },
  { to: "/models", label: "Local models", icon: Boxes },
  { to: "/device", label: "Device & performance", icon: Gauge },
  { to: "/privacy", label: "Privacy Center", icon: ShieldCheck },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const backend = useKivora((s) => s.backend);
  const resource = useKivora((s) => s.resource);
  const runningJobs = useKivora((s) => s.jobs.filter((j) => j.state === "running").length);

  useEffect(() => {
    restoreJobs();
  }, []);

  return (
    <div className="app-gradient flex min-h-screen text-foreground">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="grid size-9 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
            <Activity className="size-4.5 text-primary" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Kivora</p>
            <p className="text-[11px] text-muted-foreground">Meeting intelligence</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-2.5">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-panel"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="m-2.5 rounded-lg border border-sidebar-border bg-card/60 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-local">
            <Cpu className="size-3.5" /> Processing on this device
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            {BACKEND_LABEL[backend]}
          </p>
          <dl className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
            {[
              ["CPU", `${resource.cpu}%`],
              ["GPU", `${resource.gpu}%`],
              ["RAM", `${resource.ramGb.toFixed(1)}G`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md bg-secondary/60 py-1">
                <dt className="text-[10px] text-muted-foreground">{k}</dt>
                <dd className="num text-[11px]">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {runningJobs > 0 ? `${runningJobs} local job running` : "Queue idle"}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background/75 px-5 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Activity className="size-4 text-primary" />
            <span className="text-sm font-semibold">Kivora</span>
          </div>
          <p className="hidden text-xs text-muted-foreground lg:block">
            Kivora turns meeting activity into clear next steps.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-local/12 px-2.5 py-1 text-[11px] font-medium text-local ring-1 ring-local/30">
              <span className="size-1.5 rounded-full bg-local" /> Local-first · no raw media uploaded
            </span>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
        <nav className="sticky bottom-0 flex items-center justify-around border-t border-border bg-background/90 px-2 py-2 backdrop-blur lg:hidden">
          {NAV.slice(0, 5).map((item) => (
            <Link key={item.to} to={item.to} className="grid place-items-center gap-0.5 px-2 text-muted-foreground [&.active]:text-primary">
              <item.icon className="size-4" />
              <span className="text-[10px]">{item.label.split(" ")[0]}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
