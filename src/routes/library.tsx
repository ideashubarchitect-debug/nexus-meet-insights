import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ShieldCheck, Upload } from "lucide-react";
import { AppShell } from "@/components/kivora/AppShell";
import { DataLocationBadge, PageHeader, Panel } from "@/components/kivora/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useKivora } from "@/lib/kivora/store";
import { computeEngagementScore } from "@/lib/kivora/engagement";
import type { DataLocation } from "@/lib/kivora/types";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Meeting library — Kivora" },
      {
        name: "description",
        content:
          "Search every locally processed meeting, see engagement activity scores, technical health, and where each recording is stored.",
      },
      { property: "og:title", content: "Kivora meeting library" },
      {
        property: "og:description",
        content: "Local-first meeting records with engagement activity scores and data-location indicators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

const FILTERS: Array<{ id: DataLocation | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "local_only", label: "Local only" },
  { id: "encrypted_sync", label: "Encrypted sync" },
  { id: "cloud_recording", label: "Cloud recording" },
];

function LibraryPage() {
  const state = useKivora((s) => s);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DataLocation | "all">("all");

  const rows = useMemo(() => {
    return state.meetings
      .filter((m) => (filter === "all" ? true : m.dataLocation === filter))
      .filter((m) =>
        query.trim() === ""
          ? true
          : `${m.title} ${m.account} ${m.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()),
      )
      .map((m) => {
        const participants = state.participants.filter((p) => p.meetingId === m.id);
        const events = state.events.filter((e) => e.meetingId === m.id);
        const technicalEvents = state.technicalEvents.filter((t) => t.meetingId === m.id);
        const engagement = computeEngagementScore({
          meeting: m,
          participants,
          events,
          technicalEvents,
          weights: state.weights,
          ...(m.kind === "webinar" ? { activeViewingRatio: 0.62 } : {}),
        });
        return { meeting: m, engagement };
      });
  }, [state, query, filter]);

  return (
    <AppShell>
      <PageHeader
        title="Meeting library"
        description="Every record was produced by local processing on this device. Data location is shown for each meeting."
        actions={
          <Button asChild>
            <Link to="/import">
              <Upload className="size-4" /> Import recording
            </Link>
          </Button>
        }
      />

      <Panel className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, accounts, tags — searched locally"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant={filter === f.id ? "secondary" : "ghost"}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid gap-4">
        {rows.map(({ meeting, engagement }) => (
          <Link
            key={meeting.id}
            to="/meetings/$meetingId"
            params={{ meetingId: meeting.id }}
            className="surface block p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold">{meeting.title}</h3>
                  <DataLocationBadge location={meeting.dataLocation} />
                  {meeting.processing.state !== "completed" ? (
                    <Badge variant="outline" className="text-warning">
                      {meeting.processing.state} · {meeting.processing.stage}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(meeting.startedAt).toLocaleString()} · {meeting.durationMinutes} min ·{" "}
                  {meeting.attendeeCount} attendees
                  {meeting.registrations ? ` of ${meeting.registrations} registrations` : ""} ·{" "}
                  {meeting.sourcePlatform}
                </p>
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {meeting.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </p>
              </div>
              <dl className="flex gap-6 text-right">
                <div>
                  <dt className="text-[11px] text-muted-foreground">Engagement activity</dt>
                  <dd className="num text-xl font-semibold">{engagement.score}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground">Technical health</dt>
                  <dd className="num text-xl font-semibold">{meeting.technicalHealth}</dd>
                </div>
              </dl>
            </div>
          </Link>
        ))}
        {rows.length === 0 ? (
          <Panel>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-local" /> No meetings match this filter.
            </p>
          </Panel>
        ) : null}
      </div>
    </AppShell>
  );
}
