import { useSyncExternalStore } from "react";
import {
  seedAudit,
  seedEvents,
  seedHardware,
  seedInsights,
  seedJobs,
  seedLimits,
  seedMeetings,
  seedModels,
  seedParticipants,
  seedPrivacy,
  seedRetention,
  seedTechnicalEvents,
  seedTranscript,
} from "./seed";
import { DEFAULT_WEIGHTS } from "./engagement";
import type {
  AuditLogEntry,
  DataLocation,
  DataRetentionPolicy,
  EngagementWeights,
  HardwareProfile,
  InferenceBackend,
  Meeting,
  MeetingEvent,
  MeetingInsight,
  ModelInstallation,
  Participant,
  PrivacyPreference,
  ProcessingJob,
  ProcessingProfileId,
  ProcessingStage,
  ResourceLimits,
  TechnicalQualityEvent,
  TranscriptSegment,
} from "./types";

/**
 * In-memory stand-in for the local encrypted SQLite database.
 *
 * The desktop build replaces this module with Tauri command bindings; every
 * screen reads through these selectors so no UI change is needed then.
 */
export interface KivoraState {
  hardware: HardwareProfile;
  meetings: Meeting[];
  participants: Participant[];
  events: MeetingEvent[];
  technicalEvents: TechnicalQualityEvent[];
  transcript: TranscriptSegment[];
  insights: MeetingInsight[];
  jobs: ProcessingJob[];
  models: ModelInstallation[];
  limits: ResourceLimits;
  privacy: PrivacyPreference;
  retention: DataRetentionPolicy[];
  audit: AuditLogEntry[];
  weights: EngagementWeights;
  activeProfile: ProcessingProfileId;
  backend: InferenceBackend;
  onboarded: boolean;
  resource: { cpu: number; gpu: number; ramGb: number; latencyMs: number };
}

let state: KivoraState = {
  hardware: seedHardware,
  meetings: seedMeetings,
  participants: seedParticipants,
  events: seedEvents,
  technicalEvents: seedTechnicalEvents,
  transcript: seedTranscript,
  insights: seedInsights,
  jobs: seedJobs,
  models: seedModels,
  limits: seedLimits,
  privacy: seedPrivacy,
  retention: seedRetention,
  audit: seedAudit,
  weights: DEFAULT_WEIGHTS,
  activeProfile: "balanced_local",
  backend: seedHardware.backend,
  onboarded: false,
  resource: { cpu: 21, gpu: 8, ramGb: 3.1, latencyMs: 0 },
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(patch: Partial<KivoraState> | ((s: KivoraState) => Partial<KivoraState>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useKivora<T>(selector: (s: KivoraState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export const getState = () => state;

/* ---------------------------- audit helper ---------------------------- */

function audit(action: string, target: string, detail: string) {
  const entry: AuditLogEntry = {
    id: `aud_${Math.random().toString(36).slice(2, 9)}`,
    at: new Date().toISOString(),
    actor: "local user",
    action,
    target,
    detail,
  };
  set({ audit: [entry, ...state.audit] });
}

/* ------------------------------ pipeline ------------------------------ */

export const PIPELINE_STAGES: { stage: ProcessingStage; label: string; weight: number }[] = [
  { stage: "import", label: "Create local encrypted meeting record", weight: 0.04 },
  { stage: "audio_extract", label: "Extract audio with bundled FFmpeg", weight: 0.08 },
  { stage: "vad", label: "Local voice-activity detection (Silero VAD)", weight: 0.06 },
  { stage: "transcribe", label: "Local speech-to-text", weight: 0.42 },
  { stage: "diarize", label: "Local speaker diarization", weight: 0.12 },
  { stage: "index", label: "Local embeddings + search index", weight: 0.08 },
  { stage: "insights", label: "Local LLM intelligence extraction", weight: 0.12 },
  { stage: "events", label: "Normalize non-biometric engagement events", weight: 0.04 },
  { stage: "report", label: "Evidence-linked report, encrypted at rest", weight: 0.04 },
];

const STAGE_LABEL = new Map(PIPELINE_STAGES.map((s) => [s.stage, s.label]));

let ticking = false;

/** Simulated local inference tick. Real backends replace this with job events. */
function startTicker() {
  if (ticking || typeof window === "undefined") return;
  ticking = true;
  window.setInterval(() => {
    const running = state.jobs.filter((j) => j.state === "running");
    if (running.length === 0) {
      set({ resource: { cpu: 14 + Math.round(Math.random() * 8), gpu: 5, ramGb: 3.0, latencyMs: 0 } });
      return;
    }
    const threadFactor = state.limits.cpuThreads / state.limits.maxCpuThreads;
    const jobs = state.jobs.map((job) => {
      if (job.state !== "running") return job;
      const step = 0.012 + 0.02 * threadFactor + (job.priority === "live" ? 0.01 : 0);
      const progress = Math.min(1, job.progress + step);
      let acc = 0;
      let stage: ProcessingStage = "report";
      const completed: ProcessingStage[] = [];
      for (const s of PIPELINE_STAGES) {
        if (progress >= acc + s.weight) completed.push(s.stage);
        if (progress < acc + s.weight) {
          stage = s.stage;
          break;
        }
        acc += s.weight;
      }
      if (progress >= 1) {
        finishMeeting(job.meetingId);
        return {
          ...job,
          progress: 1,
          state: "completed" as const,
          stage: "report" as const,
          completedStages: PIPELINE_STAGES.map((s) => s.stage),
          message: "Report generated and encrypted at rest.",
        };
      }
      return {
        ...job,
        progress,
        stage,
        completedStages: completed,
        message: STAGE_LABEL.get(stage) ?? "Processing locally",
      };
    });

    const gpuCap = state.limits.gpuUtilizationLimit;
    set({
      jobs,
      resource: {
        cpu: Math.min(100, Math.round(38 + threadFactor * 45 + Math.random() * 8)),
        gpu: state.backend === "cpu" ? 6 : Math.min(gpuCap, Math.round(gpuCap * 0.82 + Math.random() * 6)),
        ramGb: Math.min(state.limits.ramCapGb, 5.4 + Math.random() * 2),
        latencyMs: 420 + Math.round(Math.random() * 260),
      },
    });
    // Persist job state so a restart resumes instead of re-running paid stages.
    persist();
  }, 900);
}

function finishMeeting(meetingId: string) {
  set({
    meetings: state.meetings.map((m) =>
      m.id === meetingId
        ? { ...m, processing: { state: "completed", stage: "report", progress: 1 } }
        : m,
    ),
  });
  const title = state.meetings.find((m) => m.id === meetingId)?.title ?? meetingId;
  audit("processing.completed", title, "Processed locally. No content left the device.");
}

const PERSIST_KEY = "kivora.jobs.v1";

function persist() {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state.jobs));
  } catch {
    /* local persistence unavailable */
  }
}

/** Restores queued/running/paused jobs so completed stages are never redone. */
export function restoreJobs() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as ProcessingJob[];
      if (Array.isArray(saved) && saved.length > 0) {
        set({
          jobs: saved.map((j) => (j.state === "running" ? { ...j, state: "paused", message: "Resumable — paused after restart." } : j)),
        });
      }
    }
  } catch {
    /* ignore corrupt state */
  }
  startTicker();
}

/* ------------------------------- actions ------------------------------ */

export const actions = {
  completeOnboarding(profile: ProcessingProfileId) {
    set({ onboarded: true, activeProfile: profile, privacy: { ...state.privacy, consentAcknowledged: true } });
    audit("onboarding.completed", "This device", `Consent acknowledged, profile set to ${profile}.`);
  },

  setProfile(profile: ProcessingProfileId) {
    set({ activeProfile: profile });
    audit("profile.changed", "This device", `Processing profile set to ${profile}.`);
  },

  setBackend(backend: InferenceBackend) {
    set({ backend });
    audit("backend.changed", "This device", `Inference backend set to ${backend}.`);
  },

  setLimits(patch: Partial<ResourceLimits>) {
    set({ limits: { ...state.limits, ...patch } });
  },

  setWeights(patch: Partial<EngagementWeights>) {
    set({ weights: { ...state.weights, ...patch } });
  },

  setPrivacy(patch: Partial<PrivacyPreference>) {
    // Raw-recording sync can never be implied by enabling sync.
    const next = { ...state.privacy, ...patch };
    if (!next.cloudSyncEnabled) next.syncRawRecording = false;
    set({ privacy: next });
    audit("privacy.changed", "Workspace", JSON.stringify(patch));
  },

  setMeetingDataLocation(meetingId: string, location: DataLocation) {
    if (location !== "local_only" && !state.privacy.cloudSyncEnabled) {
      return { ok: false, reason: "Cloud sync is disabled in the Privacy Center." } as const;
    }
    if (location === "cloud_recording" && !state.privacy.syncRawRecording) {
      return { ok: false, reason: "Raw recording upload requires a separate explicit confirmation." } as const;
    }
    set({
      meetings: state.meetings.map((m) => (m.id === meetingId ? { ...m, dataLocation: location } : m)),
    });
    const title = state.meetings.find((m) => m.id === meetingId)?.title ?? meetingId;
    audit("cloudsync.changed", title, `Data location set to ${location}.`);
    return { ok: true } as const;
  },

  toggleModel(modelId: string) {
    set({
      models: state.models.map((m) => (m.id === modelId ? { ...m, installed: !m.installed } : m)),
    });
    const m = state.models.find((x) => x.id === modelId);
    if (m) audit(m.installed ? "model.installed" : "model.deleted", m.name, `${m.sizeGb} GB, ${m.license}`);
  },

  importMeeting(input: {
    title: string;
    fileName: string;
    kind: Meeting["kind"];
    language: string;
    transcriptionModel: string;
    profile: ProcessingProfileId;
    diarization: boolean;
    piiRedaction: boolean;
    embeddings: boolean;
    durationMinutes: number;
  }) {
    const meetingId = `mtg_${Math.random().toString(36).slice(2, 9)}`;
    const meeting: Meeting = {
      id: meetingId,
      title: input.title || input.fileName,
      kind: input.kind,
      account: "Unassigned",
      startedAt: new Date().toISOString(),
      durationMinutes: input.durationMinutes,
      sourcePlatform: "Local import",
      localFilePath: `~/Kivora/recordings/${input.fileName}`,
      dataLocation: "local_only",
      processingProfile: input.profile,
      transcriptionModel: input.transcriptionModel,
      llmModel: state.models.find((m) => m.task === "llm" && m.installed)?.name ?? "local LLM",
      language: input.language,
      diarizationEnabled: input.diarization,
      piiRedaction: input.piiRedaction,
      embeddingsIndexed: input.embeddings,
      encryptedAtRest: true,
      retentionPolicyId: "ret_standard",
      tags: ["imported"],
      attendeeCount: 0,
      summary: "Processing locally. The summary appears when the local pipeline finishes.",
      technicalHealth: 100,
      processing: { state: "queued", stage: "import", progress: 0 },
    };
    const job: ProcessingJob = {
      id: `job_${Math.random().toString(36).slice(2, 9)}`,
      meetingId,
      meetingTitle: meeting.title,
      priority: "user_selected",
      state: "running",
      stage: "import",
      progress: 0,
      completedStages: [],
      backend: state.backend,
      profile: input.profile,
      startedAt: Date.now(),
      message: "Creating local encrypted meeting record",
    };
    set({ meetings: [meeting, ...state.meetings], jobs: [job, ...state.jobs] });
    audit("import.local", meeting.title, "Imported from local disk; file path stays on this device.");
    startTicker();
    return meetingId;
  },

  setJobState(jobId: string, next: "running" | "paused" | "canceled") {
    set({
      jobs: state.jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              state: next,
              message:
                next === "paused"
                  ? "Paused — partial output preserved."
                  : next === "canceled"
                    ? "Canceled by user. Completed stages are kept."
                    : "Resuming from the last completed stage.",
            }
          : j,
      ),
    });
    persist();
    startTicker();
  },

  deleteMeetingData(meetingId: string, scope: "recording" | "all") {
    const title = state.meetings.find((m) => m.id === meetingId)?.title ?? meetingId;
    if (scope === "all") {
      set({
        meetings: state.meetings.filter((m) => m.id !== meetingId),
        transcript: state.transcript.filter((t) => t.meetingId !== meetingId),
        insights: state.insights.filter((i) => i.meetingId !== meetingId),
        events: state.events.filter((e) => e.meetingId !== meetingId),
        participants: state.participants.filter((p) => p.meetingId !== meetingId),
        technicalEvents: state.technicalEvents.filter((t) => t.meetingId !== meetingId),
        jobs: state.jobs.filter((j) => j.meetingId !== meetingId),
      });
      audit("retention.delete", title, "All local artifacts for this meeting were deleted.");
    } else {
      set({
        meetings: state.meetings.map((m) =>
          m.id === meetingId ? { ...m, localFilePath: "(recording deleted)" } : m,
        ),
      });
      audit("retention.delete", title, "Local recording deleted; derived artifacts kept.");
    }
  },
};

/* ------------------------------ selectors ----------------------------- */

export const selectMeeting = (s: KivoraState, id: string) => s.meetings.find((m) => m.id === id);
export const selectParticipants = (s: KivoraState, id: string) =>
  s.participants.filter((p) => p.meetingId === id);
export const selectEvents = (s: KivoraState, id: string) =>
  s.events.filter((e) => e.meetingId === id).sort((a, b) => a.timestamp - b.timestamp);
export const selectTranscript = (s: KivoraState, id: string) =>
  s.transcript.filter((t) => t.meetingId === id).sort((a, b) => a.start - b.start);
export const selectInsights = (s: KivoraState, id: string) =>
  s.insights.filter((i) => i.meetingId === id);
export const selectTechnical = (s: KivoraState, id: string) =>
  s.technicalEvents.filter((t) => t.meetingId === id);
