import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { BatteryCharging, CircleCheck, Cpu, HardDrive, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/kivora/AppShell";
import { PageHeader, Panel } from "@/components/kivora/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { actions, useKivora } from "@/lib/kivora/store";
import { PROFILES } from "@/lib/kivora/profiles";
import type { Meeting, ProcessingProfileId } from "@/lib/kivora/types";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Import & process locally — Kivora" },
      {
        name: "description",
        content:
          "Drag in an MP4, MOV, MKV, MP3, M4A or WAV recording and process it on your own CPU and GPU. Nothing is uploaded.",
      },
      { property: "og:title", content: "Process a recording on this device" },
      {
        property: "og:description",
        content: "Local transcription, diarization, redaction and insight extraction with estimated resource impact.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImportPage,
});

const ACCEPTED = ".mp4,.mov,.mkv,.mp3,.m4a,.wav";

function ImportPage() {
  const navigate = useNavigate();
  const hardware = useKivora((s) => s.hardware);
  const models = useKivora((s) => s.models.filter((m) => m.task === "transcription"));
  const activeProfile = useKivora((s) => s.activeProfile);
  const privacy = useKivora((s) => s.privacy);
  const limits = useKivora((s) => s.limits);

  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Meeting["kind"]>("sales_demo");
  const [language, setLanguage] = useState("English (en)");
  const [model, setModel] = useState(models.find((m) => m.installed)?.name ?? "");
  const [profile, setProfile] = useState<ProcessingProfileId>(activeProfile);
  const [diarization, setDiarization] = useState(true);
  const [pii, setPii] = useState(privacy.piiRedactionDefault);
  const [embeddings, setEmbeddings] = useState(true);
  const [sync, setSync] = useState(false);
  const [dragging, setDragging] = useState(false);

  const minutes = 42;
  const speedFactor = profile === "private_cpu" ? 1.6 : profile === "high_accuracy_local" ? 5 : 11;
  const estimate = Math.max(1, Math.round(minutes / speedFactor));
  const vram = profile === "private_cpu" ? 0 : model.includes("large") ? 3.4 : 1.9;

  function accept(name: string) {
    setFileName(name);
    setFilePath(`~/Kivora/recordings/${name}`);
    if (!title) setTitle(name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
  }

  function start() {
    if (!fileName) {
      toast.error("Choose a local recording first.");
      return;
    }
    const meetingId = actions.importMeeting({
      title,
      fileName,
      kind,
      language,
      transcriptionModel: model || "whisper.cpp medium (Q5_0)",
      profile,
      diarization,
      piiRedaction: pii,
      embeddings,
      durationMinutes: minutes,
    });
    toast.success("Processing locally on this device", {
      description: "The file never leaves your machine. You can pause or cancel any time.",
    });
    navigate({ to: "/meetings/$meetingId", params: { meetingId } });
  }

  return (
    <AppShell>
      <PageHeader
        title="Import & process"
        description="Recordings are read from local disk, decoded with the bundled FFmpeg, and transcribed by the local backend you select."
      />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-5">
          <Panel>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) accept(f.name);
              }}
              onClick={() => inputRef.current?.click()}
              className={`grid cursor-pointer place-items-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <UploadCloud className="size-7 text-primary" />
              <p className="text-sm font-medium">Drop an MP4, MOV, MKV, MP3, M4A or WAV file</p>
              <p className="text-xs text-muted-foreground">
                Files are opened in place. Kivora does not copy media to any server.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) accept(f.name);
                }}
              />
            </div>
            {fileName ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/50 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{fileName}</p>
                  <p className="num truncate text-[11px] text-muted-foreground">
                    {filePath} <span className="font-sans">(shown in the desktop app only, never in synced logs)</span>
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-local/12 px-2.5 py-1 text-[11px] font-medium text-local ring-1 ring-local/30">
                  <HardDrive className="size-3" /> Process locally on this device
                </span>
              </div>
            ) : null}
          </Panel>

          <Panel title="Processing options">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="title">Meeting title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled meeting" />
              </div>
              <div className="grid gap-1.5">
                <Label>Meeting type</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as Meeting["kind"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_demo">Sales demo</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="customer_success">Customer success call</SelectItem>
                    <SelectItem value="internal">Internal product meeting</SelectItem>
                    <SelectItem value="training">Training session</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["English (en)", "German (de)", "Spanish (es)", "French (fr)", "Hindi (hi)", "Auto-detect"].map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Transcription model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger><SelectValue placeholder="Select an installed model" /></SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.name} disabled={!m.installed}>
                        {m.name} {m.installed ? "" : "· not installed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label>Processing profile</Label>
                <Select value={profile} onValueChange={(v) => setProfile(v as ProcessingProfileId)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROFILES.filter((p) => p.id !== "live_assist").map((p) => (
                      <SelectItem key={p.id} value={p.id} disabled={p.id === "cloud_assisted" && !privacy.cloudSyncEnabled}>
                        {p.name} — {p.tagline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Speaker diarization", diarization, setDiarization, "Falls back to Speaker 1/2 labels if identity is unavailable."],
                ["On-device PII redaction", pii, setPii, "Redacts configured identifiers before anything is stored."],
                ["Local embeddings + search index", embeddings, setEmbeddings, "Vectors stay in the local store."],
                ["Sync derived insights", sync, setSync, privacy.cloudSyncEnabled ? "Client-side encrypted; raw media excluded." : "Cloud sync is disabled in the Privacy Center."],
              ].map(([label, value, setter, hint]) => (
                <label key={label as string} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <span>
                    <span className="block text-sm">{label as string}</span>
                    <span className="block text-[11px] text-muted-foreground">{hint as string}</span>
                  </span>
                  <Switch
                    checked={value as boolean}
                    disabled={label === "Sync derived insights" && !privacy.cloudSyncEnabled}
                    onCheckedChange={(v) => (setter as (b: boolean) => void)(v)}
                  />
                </label>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid content-start gap-5">
          <Panel title="Estimated local impact" description="Calculated from the detected hardware profile.">
            <dl className="grid gap-2 text-sm">
              {[
                ["Processing time", `~${estimate} min for a ${minutes} min recording`],
                ["Backend", hardware.backend === "cpu" ? "CPU fallback" : hardware.gpuModel],
                ["CPU threads", `${limits.cpuThreads} of ${limits.maxCpuThreads}`],
                ["Peak RAM", `~${(profile === "high_accuracy_local" ? 9.2 : 5.6).toFixed(1)} GB (cap ${limits.ramCapGb} GB)`],
                ["Peak VRAM", vram === 0 ? "Not used" : `~${vram.toFixed(1)} GB`],
                ["Disk written", "~180 MB (transcript, index, encrypted report)"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="num text-right text-xs">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-[11px] text-muted-foreground">
              <BatteryCharging className="mt-0.5 size-3.5 shrink-0 text-warning" />
              {limits.batteryPause
                ? "Battery-aware mode is on: heavy inference pauses on battery power unless you override it."
                : "Battery-aware mode is off, so processing will continue on battery power."}
            </p>
          </Panel>

          <Panel title="What happens on this device">
            <ol className="grid gap-2 text-xs text-muted-foreground">
              {[
                "Create a local encrypted meeting record",
                "Extract audio with the bundled FFmpeg",
                "Voice-activity detection, then local speech-to-text",
                "Optional diarization and PII redaction",
                "Local embeddings and search index",
                "Local LLM extracts summary, decisions, action items, questions",
                "Normalize non-biometric engagement events",
                "Evidence-linked report, encrypted at rest",
              ].map((s, i) => (
                <li key={s} className="flex gap-2">
                  <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-local" />
                  <span>
                    <span className="num mr-1 text-[10px]">{i + 1}</span>
                    {s}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>

          <Button size="lg" onClick={start}>
            <Cpu className="size-4" /> Process locally on this device
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
