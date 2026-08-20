/**
 * Kivora domain model.
 *
 * These types mirror the local encrypted SQLite schema of the desktop agent.
 * The demo build reads them from the seeded in-memory local store
 * (src/lib/kivora/store.ts) so the same UI can later bind to Tauri commands.
 */

export type DataLocation = "local_only" | "encrypted_sync" | "cloud_recording";

export type ProcessingProfileId =
  | "private_cpu"
  | "balanced_local"
  | "high_accuracy_local"
  | "live_assist"
  | "cloud_assisted";

export type MeetingKind =
  | "sales_demo"
  | "webinar"
  | "customer_success"
  | "internal"
  | "training";

export type ProcessingStage =
  | "import"
  | "audio_extract"
  | "vad"
  | "transcribe"
  | "diarize"
  | "index"
  | "insights"
  | "events"
  | "report";

export type JobState =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export interface HardwareProfile {
  deviceName: string;
  os: string;
  cpuModel: string;
  cpuCores: number;
  ramTotalGb: number;
  ramAvailableGb: number;
  gpuModel: string;
  vramGb: number;
  backend: InferenceBackend;
  availableBackends: InferenceBackend[];
  estimatedTranscriptionSpeed: string;
  estimatedLlmCapability: string;
  detectionSource: "native" | "mocked";
}

export type InferenceBackend =
  | "metal_mlx"
  | "cuda"
  | "directml"
  | "rocm"
  | "openvino"
  | "cpu";

export interface Participant {
  id: string;
  meetingId: string;
  displayName: string;
  role: string;
  organization: string;
  speakerLabel?: string | undefined;
  joinedAt: number;
  leftAt: number;
  attendedMinutes: number;
  rejoinCount: number;
}

export type EventType =
  | "attendee_joined"
  | "attendee_left"
  | "attendee_rejoined"
  | "chat_sent"
  | "question_submitted"
  | "question_answered"
  | "poll_opened"
  | "poll_submitted"
  | "reaction_sent"
  | "hand_raised"
  | "resource_clicked"
  | "screen_share_started"
  | "screen_share_ended"
  | "technical_issue";

export interface MeetingEvent {
  id: string;
  meetingId: string;
  participantId?: string | undefined;
  eventType: EventType;
  timestamp: number; // seconds from meeting start
  sourcePlatform: string;
  metadata: Record<string, string | number | boolean>;
  createdAt: number;
}

export interface TranscriptSegment {
  id: string;
  meetingId: string;
  start: number;
  end: number;
  speakerLabel: string;
  participantId?: string | undefined;
  text: string;
  confidence: number;
  redacted?: boolean | undefined;
}

export interface EvidenceCitation {
  start: number;
  end: number;
  speakerLabel: string;
  quote: string;
  confidence: number;
  model: string;
}

export type InsightKind =
  | "topic"
  | "decision"
  | "action_item"
  | "question"
  | "objection"
  | "feature_request"
  | "risk"
  | "next_step_signal";

export interface MeetingInsight {
  id: string;
  meetingId: string;
  kind: InsightKind;
  title: string;
  detail?: string | undefined;
  owner?: string | undefined;
  dueDate?: string | undefined;
  needsReview?: boolean | undefined;
  evidence: EvidenceCitation[];
}

export interface TechnicalQualityEvent {
  id: string;
  meetingId: string;
  timestamp: number;
  kind: "audio_dropout" | "packet_loss" | "cpu_spike" | "video_degraded";
  severity: "low" | "medium" | "high";
  detail: string;
  durationSeconds: number;
}

export interface Meeting {
  id: string;
  title: string;
  kind: MeetingKind;
  account: string;
  startedAt: string;
  durationMinutes: number;
  sourcePlatform: string;
  localFilePath: string;
  dataLocation: DataLocation;
  processingProfile: ProcessingProfileId;
  transcriptionModel: string;
  llmModel: string;
  language: string;
  diarizationEnabled: boolean;
  piiRedaction: boolean;
  embeddingsIndexed: boolean;
  encryptedAtRest: boolean;
  retentionPolicyId: string;
  tags: string[];
  registrations?: number | undefined;
  attendeeCount: number;
  summary: string;
  technicalHealth: number;
  processing: { state: JobState; stage: ProcessingStage; progress: number };
}

export interface ProcessingJob {
  id: string;
  meetingId: string;
  meetingTitle: string;
  priority: "live" | "user_selected" | "background";
  state: JobState;
  stage: ProcessingStage;
  progress: number;
  completedStages: ProcessingStage[];
  backend: InferenceBackend;
  profile: ProcessingProfileId;
  startedAt: number;
  message: string;
  error?: string | undefined;
}

export interface ModelInstallation {
  id: string;
  name: string;
  task: "transcription" | "diarization" | "llm" | "embedding" | "vad";
  provider: string;
  sizeGb: number;
  quantization?: string | undefined;
  license: string;
  source: string;
  checksum: string;
  backends: InferenceBackend[];
  installed: boolean;
  updateAvailable?: boolean | undefined;
}

export interface ResourceLimits {
  cpuThreads: number;
  maxCpuThreads: number;
  gpuUtilizationLimit: number;
  ramCapGb: number;
  diskSafetyGb: number;
  batteryPause: boolean;
  thermalAware: boolean;
  idleOnly: boolean;
  scheduleWindow: { start: string; end: string; enabled: boolean };
}

export interface PrivacyPreference {
  localOnlyDefault: boolean;
  cloudSyncEnabled: boolean;
  syncRawRecording: boolean;
  telemetryEnabled: boolean;
  piiRedactionDefault: boolean;
  consentAcknowledged: boolean;
}

export interface DataRetentionPolicy {
  id: string;
  name: string;
  keepRecordingDays: number;
  keepTranscriptDays: number;
  keepInsightsDays: number;
  autoDelete: boolean;
}

export interface AuditLogEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}

export interface EngagementWeights {
  attendanceRetention: number;
  explicitInteraction: number;
  resourceEngagement: number;
  activeViewing: number;
  technicalQuality: number;
}

export interface EngagementComponent {
  key: keyof EngagementWeights;
  label: string;
  weight: number;
  rawValue: number; // 0..1
  points: number;
  explanation: string;
  supplied: boolean;
  eventCount: number;
}

export interface EngagementScore {
  score: number;
  components: EngagementComponent[];
}
