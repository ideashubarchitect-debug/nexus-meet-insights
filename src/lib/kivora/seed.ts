import type {
  AuditLogEntry,
  DataRetentionPolicy,
  HardwareProfile,
  Meeting,
  MeetingEvent,
  MeetingInsight,
  ModelInstallation,
  Participant,
  PrivacyPreference,
  ProcessingJob,
  ResourceLimits,
  TechnicalQualityEvent,
  TranscriptSegment,
} from "./types";

let seq = 0;
const id = (prefix: string) => `${prefix}_${(++seq).toString(36)}`;

/* ------------------------------------------------------------------ */
/* Hardware (mocked capability detection until the Rust probe exists)  */
/* ------------------------------------------------------------------ */

export const seedHardware: HardwareProfile = {
  deviceName: "Kivora Workstation",
  os: "macOS 15.3 (arm64)",
  cpuModel: "Apple M3 Pro",
  cpuCores: 12,
  ramTotalGb: 36,
  ramAvailableGb: 21.4,
  gpuModel: "Apple M3 Pro (18-core GPU)",
  vramGb: 18,
  backend: "metal_mlx",
  availableBackends: ["metal_mlx", "cpu"],
  estimatedTranscriptionSpeed: "~11x realtime (whisper medium, Metal)",
  estimatedLlmCapability: "Up to 14B parameters at Q4_K_M",
  detectionSource: "mocked",
};

/* ------------------------------------------------------------------ */
/* Meeting 1 — Kloudbean Product Demo — Acme Digital                   */
/* ------------------------------------------------------------------ */

const m1 = "mtg_demo_acme";
const m2 = "mtg_webinar_scale";
const m3 = "mtg_sprint_review";

function participant(
  meetingId: string,
  displayName: string,
  role: string,
  organization: string,
  attendedMinutes: number,
  joinedAt: number,
  leftAt: number,
  speakerLabel?: string,
  rejoinCount = 0,
): Participant {
  return {
    id: id("par"),
    meetingId,
    displayName,
    role,
    organization,
    speakerLabel,
    joinedAt,
    leftAt,
    attendedMinutes,
    rejoinCount,
  };
}

export const seedParticipants: Participant[] = [
  participant(m1, "Vikram Rao", "Solutions Engineer", "Kloudbean", 45, 0, 2700, "Speaker 1"),
  participant(m1, "Priya Nandan", "Account Executive", "Kloudbean", 45, 0, 2700, "Speaker 2"),
  participant(m1, "Dana Whitfield", "VP Engineering", "Acme Digital", 44, 60, 2700, "Speaker 3"),
  participant(m1, "Marco Silveira", "Platform Lead", "Acme Digital", 41, 180, 2700, "Speaker 4"),
  participant(m1, "Iris Chen", "DevOps Engineer", "Acme Digital", 38, 240, 2520, "Speaker 5", 1),
  participant(m1, "Tom Kearns", "Procurement", "Acme Digital", 18, 1500, 2600, "Speaker 6"),
  participant(m1, "Sofia Duarte", "Product Manager", "Acme Digital", 34, 420, 2460, undefined, 1),
  participant(m1, "Ben Okafor", "Security Analyst", "Acme Digital", 26, 900, 2460),

  participant(m2, "Ana Kovacs", "Host", "Kloudbean", 60, 0, 3600, "Speaker 1"),
  participant(m2, "Rohit Verma", "Staff Engineer", "Kloudbean", 60, 0, 3600, "Speaker 2"),
  participant(m2, "Attendee cohort A", "Attendee", "Mixed", 52, 0, 3120),
  participant(m2, "Attendee cohort B", "Attendee", "Mixed", 41, 120, 2580),
  participant(m2, "Attendee cohort C", "Attendee", "Mixed", 24, 300, 1740, undefined, 2),

  participant(m3, "Lena Brandt", "Engineering Manager", "Kloudbean", 32, 0, 1920, "Speaker 1"),
  participant(m3, "Yusuf Demir", "Backend Engineer", "Kloudbean", 32, 0, 1920, "Speaker 2"),
  participant(m3, "Grace Lim", "Product Manager", "Kloudbean", 31, 60, 1920, "Speaker 3"),
  participant(m3, "Omar Haddad", "QA Lead", "Kloudbean", 29, 120, 1860, "Speaker 4"),
  participant(m3, "Nina Sørensen", "Designer", "Kloudbean", 27, 180, 1800),
  participant(m3, "Tarek Aziz", "SRE", "Kloudbean", 24, 240, 1740, undefined, 1),
];

const pid = (meetingId: string, name: string) =>
  seedParticipants.find((p) => p.meetingId === meetingId && p.displayName === name)?.id;

function ev(
  meetingId: string,
  eventType: MeetingEvent["eventType"],
  timestamp: number,
  sourcePlatform: string,
  metadata: MeetingEvent["metadata"] = {},
  participantName?: string,
): MeetingEvent {
  return {
    id: id("evt"),
    meetingId,
    participantId: participantName ? pid(meetingId, participantName) : undefined,
    eventType,
    timestamp,
    sourcePlatform,
    metadata,
    createdAt: Date.now(),
  };
}

const zoom = "Zoom (authorized export)";
const webinar = "Kivora Webinar Import";
const meet = "Google Meet (authorized export)";

const demoEvents: MeetingEvent[] = [
  ev(m1, "attendee_joined", 0, zoom, {}, "Vikram Rao"),
  ev(m1, "attendee_joined", 0, zoom, {}, "Priya Nandan"),
  ev(m1, "attendee_joined", 60, zoom, {}, "Dana Whitfield"),
  ev(m1, "attendee_joined", 180, zoom, {}, "Marco Silveira"),
  ev(m1, "attendee_joined", 240, zoom, {}, "Iris Chen"),
  ev(m1, "screen_share_started", 300, zoom, { title: "Multi-cloud deployment topology" }),
  ev(m1, "attendee_joined", 420, zoom, {}, "Sofia Duarte"),
  ev(m1, "hand_raised", 640, zoom, {}, "Marco Silveira"),
  ev(m1, "question_submitted", 660, zoom, { text: "How do you handle regional failover for Node.js workers?" }, "Marco Silveira"),
  ev(m1, "question_answered", 720, zoom, {}, "Vikram Rao"),
  ev(m1, "chat_sent", 780, zoom, { text: "Link to the architecture diagram please" }, "Iris Chen"),
  ev(m1, "attendee_joined", 900, zoom, {}, "Ben Okafor"),
  ev(m1, "question_submitted", 980, zoom, { text: "Is data residency configurable per environment?" }, "Ben Okafor"),
  ev(m1, "resource_clicked", 1040, zoom, { resource: "Multi-cloud architecture PDF" }, "Iris Chen"),
  ev(m1, "reaction_sent", 1180, zoom, { reaction: "thumbs_up" }, "Dana Whitfield"),
  ev(m1, "attendee_rejoined", 1320, zoom, {}, "Iris Chen"),
  ev(m1, "attendee_joined", 1500, zoom, {}, "Tom Kearns"),
  ev(m1, "chat_sent", 1560, zoom, { text: "Can we see the annual pricing tiers?" }, "Tom Kearns"),
  ev(m1, "screen_share_ended", 1680, zoom, {}),
  ev(m1, "screen_share_started", 1700, zoom, { title: "Pricing and packaging" }),
  ev(m1, "question_submitted", 1760, zoom, { text: "What is included in the platform tier?" }, "Tom Kearns"),
  ev(m1, "technical_issue", 1740, zoom, { kind: "audio_dropout" }),
  ev(m1, "resource_clicked", 1980, zoom, { resource: "Pricing sheet" }, "Tom Kearns"),
  ev(m1, "chat_sent", 2100, zoom, { text: "Sending our security questionnaire after this" }, "Ben Okafor"),
  ev(m1, "hand_raised", 2210, zoom, {}, "Dana Whitfield"),
  ev(m1, "reaction_sent", 2400, zoom, { reaction: "clap" }, "Sofia Duarte"),
  ev(m1, "resource_clicked", 2520, zoom, { resource: "Follow-up call scheduling link" }, "Dana Whitfield"),
  ev(m1, "screen_share_ended", 2600, zoom, {}),
];

/* Webinar events — generated volume with a case-study chat spike and CTA burst */
const webinarEvents: MeetingEvent[] = [
  ev(m2, "attendee_joined", 0, webinar, { cohort: "wave-1", count: 96 }),
  ev(m2, "attendee_joined", 120, webinar, { cohort: "wave-2", count: 48 }),
  ev(m2, "attendee_joined", 300, webinar, { cohort: "wave-3", count: 20 }),
  ev(m2, "screen_share_started", 90, webinar, { title: "Scaling Node.js: the deck" }),
  ev(m2, "poll_opened", 600, webinar, { question: "How do you deploy Node.js today?" }),
  ev(m2, "poll_opened", 2100, webinar, { question: "What is your biggest scaling blocker?" }),
];

for (let i = 0; i < 118; i++) {
  // chat volume clusters during the case study (minute 22-34)
  const t = i < 74 ? 1320 + Math.floor((i / 74) * 720) : Math.floor((i / 118) * 3400);
  webinarEvents.push(ev(m2, "chat_sent", t, webinar, { text: `Attendee chat message #${i + 1}` }));
}
for (let i = 0; i < 132; i++) webinarEvents.push(ev(m2, "poll_submitted", 620 + (i % 40) * 3, webinar, { poll: 1 }));
for (let i = 0; i < 104; i++) webinarEvents.push(ev(m2, "poll_submitted", 2120 + (i % 40) * 3, webinar, { poll: 2 }));
for (let i = 0; i < 46; i++) webinarEvents.push(ev(m2, "question_submitted", 2400 + i * 22, webinar, { text: `Q&A submission #${i + 1}` }));
for (let i = 0; i < 29; i++) webinarEvents.push(ev(m2, "question_answered", 2500 + i * 30, webinar, {}));
for (let i = 0; i < 61; i++) webinarEvents.push(ev(m2, "reaction_sent", 200 + i * 45, webinar, { reaction: "thumbs_up" }));
for (let i = 0; i < 88; i++)
  webinarEvents.push(
    ev(m2, "resource_clicked", 1860 + (i % 30) * 8, webinar, { resource: "Deployment checklist CTA" }),
  );
for (let i = 0; i < 34; i++)
  webinarEvents.push(ev(m2, "resource_clicked", 3000 + i * 12, webinar, { resource: "Book a technical review" }));
for (let i = 0; i < 62; i++) webinarEvents.push(ev(m2, "attendee_left", 2600 + i * 15, webinar, { phase: "extended Q&A" }));

const sprintEvents: MeetingEvent[] = [
  ev(m3, "attendee_joined", 0, meet, {}, "Lena Brandt"),
  ev(m3, "attendee_joined", 0, meet, {}, "Yusuf Demir"),
  ev(m3, "attendee_joined", 60, meet, {}, "Grace Lim"),
  ev(m3, "attendee_joined", 120, meet, {}, "Omar Haddad"),
  ev(m3, "attendee_joined", 180, meet, {}, "Nina Sørensen"),
  ev(m3, "attendee_joined", 240, meet, {}, "Tarek Aziz"),
  ev(m3, "screen_share_started", 200, meet, { title: "Sprint 42 board" }),
  ev(m3, "chat_sent", 640, meet, { text: "Ticket link: KB-2214" }, "Yusuf Demir"),
  ev(m3, "chat_sent", 1180, meet, { text: "Design file updated" }, "Nina Sørensen"),
  ev(m3, "reaction_sent", 1320, meet, { reaction: "thumbs_up" }, "Grace Lim"),
  ev(m3, "attendee_rejoined", 1400, meet, {}, "Tarek Aziz"),
  ev(m3, "screen_share_ended", 1700, meet, {}),
  ev(m3, "resource_clicked", 1760, meet, { resource: "Sprint 42 retro doc" }, "Lena Brandt"),
];

export const seedEvents: MeetingEvent[] = [...demoEvents, ...webinarEvents, ...sprintEvents];

/* ------------------------------------------------------------------ */
/* Technical quality                                                   */
/* ------------------------------------------------------------------ */

export const seedTechnicalEvents: TechnicalQualityEvent[] = [
  {
    id: id("tq"),
    meetingId: m1,
    timestamp: 1740,
    kind: "audio_dropout",
    severity: "medium",
    detail: "Audio dropout on the host stream for 22s around minute 29 (packet loss 4.1%).",
    durationSeconds: 22,
  },
  {
    id: id("tq"),
    meetingId: m2,
    timestamp: 2340,
    kind: "video_degraded",
    severity: "low",
    detail: "Presenter video bitrate reduced during the case-study segment.",
    durationSeconds: 65,
  },
  {
    id: id("tq"),
    meetingId: m3,
    timestamp: 1400,
    kind: "packet_loss",
    severity: "low",
    detail: "Brief packet loss for one participant, reconnected automatically.",
    durationSeconds: 18,
  },
];

/* ------------------------------------------------------------------ */
/* Transcripts                                                         */
/* ------------------------------------------------------------------ */

function seg(
  meetingId: string,
  start: number,
  end: number,
  speakerLabel: string,
  text: string,
  confidence = 0.93,
): TranscriptSegment {
  return { id: id("seg"), meetingId, start, end, speakerLabel, text, confidence };
}

export const seedTranscript: TranscriptSegment[] = [
  seg(m1, 40, 58, "Speaker 2", "Thanks for making time. Today we'll walk through the multi-cloud deployment model and then pricing.", 0.96),
  seg(m1, 300, 322, "Speaker 1", "This is the topology: Node.js workers deployed across two providers with a shared control plane.", 0.95),
  seg(m1, 655, 672, "Speaker 4", "How do you handle regional failover for the Node.js workers if a whole region goes down?", 0.94),
  seg(m1, 690, 726, "Speaker 1", "Failover is DNS plus health-check based. We drain the region and re-schedule workers in the standby region.", 0.92),
  seg(m1, 975, 992, "Speaker 6", "Is data residency configurable per environment, or is it a single account-level setting?", 0.93),
  seg(m1, 1000, 1032, "Speaker 1", "It is per environment. You pin each environment to a region and the control plane respects that pin.", 0.91),
  seg(m1, 1560, 1578, "Speaker 6", "Before we go further, the annual pricing tiers will matter for our procurement review.", 0.9),
  seg(m1, 1755, 1782, "Speaker 6", "Honestly the platform tier looks expensive compared with what we run today on our own Kubernetes.", 0.89),
  seg(m1, 1790, 1830, "Speaker 2", "That's fair. Most teams compare it against the engineering time spent maintaining that cluster.", 0.92),
  seg(m1, 2058, 2076, "Speaker 3", "We would need SSO with our identity provider before any rollout beyond the pilot team.", 0.94),
  seg(m1, 2210, 2232, "Speaker 3", "If the architecture holds up, we want to move on this in the next quarter.", 0.9),
  seg(m1, 2058 + 200, 2058 + 226, "Speaker 5", "Can you also confirm the log retention limits? That was a blocker for us last time.", 0.88),
  seg(m1, 2418, 2426, "Speaker 1", "I'll send you the multi-cloud architecture document after this call.", 0.93),
  seg(m1, 2460, 2488, "Speaker 3", "Let's book a technical deep-dive call with our platform team next week.", 0.95),
  seg(m1, 2520, 2544, "Speaker 2", "I'll set that up and include the pricing sheet with annual tiers.", 0.94),

  seg(m2, 60, 92, "Speaker 1", "Welcome everyone. Today is about scaling Node.js apps without rewriting them.", 0.96),
  seg(m2, 600, 628, "Speaker 1", "First poll: how do you deploy Node.js today?", 0.95),
  seg(m2, 1350, 1392, "Speaker 2", "In the case study, the team cut p95 latency by moving session state out of the process.", 0.93),
  seg(m2, 1860, 1888, "Speaker 1", "The deployment checklist is linked in the resources panel, grab it now.", 0.94),
  seg(m2, 2400, 2436, "Speaker 2", "We'll take the rest of the questions live, this may run long.", 0.91),
  seg(m2, 3200, 3232, "Speaker 1", "We will publish the recording and the checklist to everyone who registered.", 0.95),

  seg(m3, 120, 152, "Speaker 1", "Sprint 42 review. Let's confirm what shipped and what carries over.", 0.95),
  seg(m3, 620, 654, "Speaker 2", "The queue refactor is merged. We decided to keep the old consumer behind a flag for one sprint.", 0.94),
  seg(m3, 1120, 1150, "Speaker 3", "Decision: we ship the billing export in 42.1 and hold the dashboard redesign.", 0.95),
  seg(m3, 1410, 1444, "Speaker 4", "Omar will finish the regression suite for the export path by Friday.", 0.92),
  seg(m3, 1600, 1636, "Speaker 1", "Open question: who owns the migration runbook? We did not resolve that today.", 0.9),
  seg(m3, 1740, 1768, "Speaker 1", "Risk: if the flag stays past sprint 43 we carry two consumers in production.", 0.91),
];

/* ------------------------------------------------------------------ */
/* Insights                                                            */
/* ------------------------------------------------------------------ */

const MODEL_TAG = "llama.cpp / qwen2.5-14b-instruct-q4_k_m (local)";

function insight(
  meetingId: string,
  kind: MeetingInsight["kind"],
  title: string,
  evidence: MeetingInsight["evidence"],
  extra: Partial<MeetingInsight> = {},
): MeetingInsight {
  return { id: id("ins"), meetingId, kind, title, evidence, ...extra };
}

export const seedInsights: MeetingInsight[] = [
  insight(m1, "topic", "Multi-cloud Node.js deployment topology", [
    { start: 300, end: 322, speakerLabel: "Speaker 1", quote: "This is the topology: Node.js workers deployed across two providers with a shared control plane.", confidence: 0.95, model: MODEL_TAG },
  ]),
  insight(m1, "topic", "Pricing and packaging tiers", [
    { start: 1560, end: 1578, speakerLabel: "Speaker 6", quote: "the annual pricing tiers will matter for our procurement review", confidence: 0.9, model: MODEL_TAG },
  ]),
  insight(m1, "question", "How is regional failover handled for Node.js workers?", [
    { start: 655, end: 672, speakerLabel: "Speaker 4", quote: "How do you handle regional failover for the Node.js workers if a whole region goes down?", confidence: 0.94, model: MODEL_TAG },
  ]),
  insight(m1, "question", "Is data residency configurable per environment?", [
    { start: 975, end: 992, speakerLabel: "Speaker 6", quote: "Is data residency configurable per environment, or is it a single account-level setting?", confidence: 0.93, model: MODEL_TAG },
  ]),
  insight(m1, "question", "What are the log retention limits?", [
    { start: 2258, end: 2284, speakerLabel: "Speaker 5", quote: "Can you also confirm the log retention limits? That was a blocker for us last time.", confidence: 0.88, model: MODEL_TAG },
  ], { needsReview: true }),
  insight(m1, "objection", "Platform tier perceived as expensive versus self-managed Kubernetes", [
    { start: 1755, end: 1782, speakerLabel: "Speaker 6", quote: "the platform tier looks expensive compared with what we run today on our own Kubernetes", confidence: 0.89, model: MODEL_TAG },
  ]),
  insight(m1, "feature_request", "SSO with the customer identity provider before broader rollout", [
    { start: 2058, end: 2076, speakerLabel: "Speaker 3", quote: "We would need SSO with our identity provider before any rollout beyond the pilot team.", confidence: 0.94, model: MODEL_TAG },
  ]),
  insight(m1, "next_step_signal", "Explicit request for a technical follow-up call", [
    { start: 2460, end: 2488, speakerLabel: "Speaker 3", quote: "Let's book a technical deep-dive call with our platform team next week.", confidence: 0.95, model: MODEL_TAG },
  ]),
  insight(m1, "action_item", "Send Acme the multi-cloud architecture document.", [
    { start: 2418, end: 2426, speakerLabel: "Speaker 1", quote: "I'll send you the multi-cloud architecture document after this call.", confidence: 0.93, model: MODEL_TAG },
  ], { owner: "Vikram", dueDate: "2026-08-21" }),
  insight(m1, "action_item", "Schedule the technical deep-dive call and include annual pricing tiers.", [
    { start: 2520, end: 2544, speakerLabel: "Speaker 2", quote: "I'll set that up and include the pricing sheet with annual tiers.", confidence: 0.94, model: MODEL_TAG },
  ], { owner: "Priya", dueDate: "2026-08-24" }),
  insight(m1, "risk", "Security questionnaire is a gating step before rollout", [
    { start: 2100, end: 2112, speakerLabel: "Speaker 6", quote: "Sending our security questionnaire after this", confidence: 0.82, model: MODEL_TAG },
  ], { needsReview: true }),

  insight(m2, "topic", "Moving session state out of the Node.js process", [
    { start: 1350, end: 1392, speakerLabel: "Speaker 2", quote: "the team cut p95 latency by moving session state out of the process", confidence: 0.93, model: MODEL_TAG },
  ]),
  insight(m2, "action_item", "Publish the recording and deployment checklist to all registrants.", [
    { start: 3200, end: 3232, speakerLabel: "Speaker 1", quote: "We will publish the recording and the checklist to everyone who registered.", confidence: 0.95, model: MODEL_TAG },
  ], { owner: "Ana", dueDate: "2026-08-22" }),
  insight(m2, "question", "Extended Q&A ran past the scheduled end", [
    { start: 2400, end: 2436, speakerLabel: "Speaker 2", quote: "We'll take the rest of the questions live, this may run long.", confidence: 0.91, model: MODEL_TAG },
  ]),

  insight(m3, "decision", "Ship the billing export in 42.1 and hold the dashboard redesign.", [
    { start: 1120, end: 1150, speakerLabel: "Speaker 3", quote: "Decision: we ship the billing export in 42.1 and hold the dashboard redesign.", confidence: 0.95, model: MODEL_TAG },
  ]),
  insight(m3, "decision", "Keep the old queue consumer behind a feature flag for one sprint.", [
    { start: 620, end: 654, speakerLabel: "Speaker 2", quote: "We decided to keep the old consumer behind a flag for one sprint.", confidence: 0.94, model: MODEL_TAG },
  ]),
  insight(m3, "action_item", "Finish the regression suite for the export path.", [
    { start: 1410, end: 1444, speakerLabel: "Speaker 4", quote: "Omar will finish the regression suite for the export path by Friday.", confidence: 0.92, model: MODEL_TAG },
  ], { owner: "Omar", dueDate: "2026-08-21" }),
  insight(m3, "question", "Unresolved: who owns the migration runbook?", [
    { start: 1600, end: 1636, speakerLabel: "Speaker 1", quote: "Open question: who owns the migration runbook? We did not resolve that today.", confidence: 0.9, model: MODEL_TAG },
  ], { needsReview: true }),
  insight(m3, "risk", "Two queue consumers in production if the flag outlives sprint 43.", [
    { start: 1740, end: 1768, speakerLabel: "Speaker 1", quote: "if the flag stays past sprint 43 we carry two consumers in production", confidence: 0.91, model: MODEL_TAG },
  ]),
];

/* ------------------------------------------------------------------ */
/* Meetings                                                            */
/* ------------------------------------------------------------------ */

export const seedMeetings: Meeting[] = [
  {
    id: m1,
    title: "Kloudbean Product Demo — Acme Digital",
    kind: "sales_demo",
    account: "Acme Digital",
    startedAt: "2026-08-18T14:00:00Z",
    durationMinutes: 45,
    sourcePlatform: zoom,
    localFilePath: "~/Kivora/recordings/acme-demo-2026-08-18.mp4",
    dataLocation: "local_only",
    processingProfile: "high_accuracy_local",
    transcriptionModel: "whisper.cpp large-v3 (Q5_0)",
    llmModel: "qwen2.5-14b-instruct-q4_k_m",
    language: "English (en)",
    diarizationEnabled: true,
    piiRedaction: true,
    embeddingsIndexed: true,
    encryptedAtRest: true,
    retentionPolicyId: "ret_standard",
    tags: ["sales", "multi-cloud", "pricing"],
    attendeeCount: 8,
    summary:
      "The transcript explicitly covers a multi-cloud Node.js deployment walkthrough, regional failover, per-environment data residency, and annual pricing tiers. Attendees asked five architecture questions, raised one pricing objection, and explicitly requested a technical deep-dive follow-up call. A 22-second audio dropout was logged around minute 29.",
    technicalHealth: 88,
    processing: { state: "completed", stage: "report", progress: 1 },
  },
  {
    id: m2,
    title: "Scale Node.js Apps — Growth Webinar",
    kind: "webinar",
    account: "Kloudbean Growth",
    startedAt: "2026-08-12T16:00:00Z",
    durationMinutes: 60,
    sourcePlatform: webinar,
    localFilePath: "~/Kivora/recordings/scale-nodejs-webinar.mp4",
    dataLocation: "encrypted_sync",
    processingProfile: "balanced_local",
    transcriptionModel: "faster-whisper medium (CTranslate2)",
    llmModel: "llama-3.1-8b-instruct-q4_k_m",
    language: "English (en)",
    diarizationEnabled: true,
    piiRedaction: true,
    embeddingsIndexed: true,
    encryptedAtRest: true,
    retentionPolicyId: "ret_marketing",
    tags: ["webinar", "growth", "nodejs"],
    registrations: 240,
    attendeeCount: 164,
    summary:
      "164 of 240 registrants attended. Two polls collected 236 responses in total, chat volume clustered during the case-study segment, and CTA clicks spiked after the deployment checklist was shown. Attendance declined during the extended Q&A segment.",
    technicalHealth: 94,
    processing: { state: "completed", stage: "report", progress: 1 },
  },
  {
    id: m3,
    title: "Internal Product Sprint Review",
    kind: "internal",
    account: "Kloudbean Platform",
    startedAt: "2026-08-19T09:30:00Z",
    durationMinutes: 32,
    sourcePlatform: meet,
    localFilePath: "~/Kivora/recordings/sprint-42-review.m4a",
    dataLocation: "local_only",
    processingProfile: "balanced_local",
    transcriptionModel: "whisper.cpp medium (Q5_0)",
    llmModel: "qwen2.5-14b-instruct-q4_k_m",
    language: "English (en)",
    diarizationEnabled: true,
    piiRedaction: false,
    embeddingsIndexed: true,
    encryptedAtRest: true,
    retentionPolicyId: "ret_standard",
    tags: ["internal", "sprint-42"],
    attendeeCount: 6,
    summary:
      "Two decisions were recorded with owners, plus one action item with a stated due date and one unresolved ownership question. Interaction event volume was low for this meeting; that is a count of logged events only and says nothing about participants' state of mind.",
    technicalHealth: 96,
    processing: { state: "completed", stage: "report", progress: 1 },
  },
];

/* ------------------------------------------------------------------ */
/* Jobs, models, settings, audit                                       */
/* ------------------------------------------------------------------ */

export const seedJobs: ProcessingJob[] = [
  {
    id: "job_1",
    meetingId: m3,
    meetingTitle: "Internal Product Sprint Review",
    priority: "user_selected",
    state: "completed",
    stage: "report",
    progress: 1,
    completedStages: ["import", "audio_extract", "vad", "transcribe", "diarize", "index", "insights", "events", "report"],
    backend: "metal_mlx",
    profile: "balanced_local",
    startedAt: Date.now() - 3_600_000,
    message: "Report generated and encrypted at rest.",
  },
  {
    id: "job_2",
    meetingId: m1,
    meetingTitle: "Kloudbean Product Demo — Acme Digital",
    priority: "user_selected",
    state: "completed",
    stage: "report",
    progress: 1,
    completedStages: ["import", "audio_extract", "vad", "transcribe", "diarize", "index", "insights", "events", "report"],
    backend: "metal_mlx",
    profile: "high_accuracy_local",
    startedAt: Date.now() - 7_200_000,
    message: "Report generated and encrypted at rest.",
  },
];

export const seedModels: ModelInstallation[] = [
  {
    id: "mdl_whisper_large",
    name: "whisper large-v3 (Q5_0, GGUF)",
    task: "transcription",
    provider: "whisper.cpp",
    sizeGb: 1.08,
    quantization: "Q5_0",
    license: "MIT (model weights: OpenAI, MIT)",
    source: "huggingface.co/ggerganov/whisper.cpp",
    checksum: "sha256:9f3c…a71d",
    backends: ["metal_mlx", "cuda", "cpu"],
    installed: true,
  },
  {
    id: "mdl_whisper_medium",
    name: "faster-whisper medium",
    task: "transcription",
    provider: "CTranslate2",
    sizeGb: 0.77,
    quantization: "int8_float16",
    license: "MIT",
    source: "huggingface.co/Systran/faster-whisper-medium",
    checksum: "sha256:2b8e…04cc",
    backends: ["cuda", "cpu", "directml"],
    installed: true,
  },
  {
    id: "mdl_whisper_small",
    name: "whisper small (Q4_K, GGUF)",
    task: "transcription",
    provider: "whisper.cpp",
    sizeGb: 0.19,
    quantization: "Q4_K",
    license: "MIT",
    source: "huggingface.co/ggerganov/whisper.cpp",
    checksum: "sha256:71ad…9e02",
    backends: ["cpu", "metal_mlx", "cuda", "directml", "rocm", "openvino"],
    installed: false,
  },
  {
    id: "mdl_silero_vad",
    name: "Silero VAD v5",
    task: "vad",
    provider: "ONNX Runtime",
    sizeGb: 0.002,
    license: "MIT",
    source: "github.com/snakers4/silero-vad",
    checksum: "sha256:c410…77b1",
    backends: ["cpu"],
    installed: true,
  },
  {
    id: "mdl_diarize",
    name: "Offline diarization pipeline (pyannote-compatible)",
    task: "diarization",
    provider: "ONNX Runtime",
    sizeGb: 0.31,
    license: "Requires accepting the upstream model license",
    source: "local manifest: kivora-diarization-v2",
    checksum: "sha256:5da2…31f8",
    backends: ["cpu", "cuda", "metal_mlx"],
    installed: true,
  },
  {
    id: "mdl_qwen14b",
    name: "qwen2.5-14b-instruct (Q4_K_M, GGUF)",
    task: "llm",
    provider: "llama.cpp",
    sizeGb: 8.9,
    quantization: "Q4_K_M",
    license: "Apache-2.0",
    source: "huggingface.co/Qwen",
    checksum: "sha256:ab77…5c19",
    backends: ["metal_mlx", "cuda", "cpu"],
    installed: true,
    updateAvailable: true,
  },
  {
    id: "mdl_llama8b",
    name: "llama-3.1-8b-instruct (Q4_K_M, GGUF)",
    task: "llm",
    provider: "Ollama",
    sizeGb: 4.7,
    quantization: "Q4_K_M",
    license: "Llama 3.1 Community License",
    source: "ollama.com/library/llama3.1",
    checksum: "sha256:1c9f…8ee4",
    backends: ["metal_mlx", "cuda", "rocm", "cpu"],
    installed: true,
  },
  {
    id: "mdl_embed",
    name: "bge-small-en-v1.5 (ONNX)",
    task: "embedding",
    provider: "ONNX Runtime",
    sizeGb: 0.13,
    license: "MIT",
    source: "huggingface.co/BAAI/bge-small-en-v1.5",
    checksum: "sha256:4fe1…b620",
    backends: ["cpu", "cuda", "directml", "openvino"],
    installed: true,
  },
];

export const seedLimits: ResourceLimits = {
  cpuThreads: 8,
  maxCpuThreads: 12,
  gpuUtilizationLimit: 80,
  ramCapGb: 16,
  diskSafetyGb: 20,
  batteryPause: true,
  thermalAware: true,
  idleOnly: false,
  scheduleWindow: { start: "22:00", end: "06:00", enabled: false },
};

export const seedPrivacy: PrivacyPreference = {
  localOnlyDefault: true,
  cloudSyncEnabled: false,
  syncRawRecording: false,
  telemetryEnabled: false,
  piiRedactionDefault: true,
  consentAcknowledged: false,
};

export const seedRetention: DataRetentionPolicy[] = [
  { id: "ret_standard", name: "Standard (local)", keepRecordingDays: 30, keepTranscriptDays: 365, keepInsightsDays: 730, autoDelete: true },
  { id: "ret_marketing", name: "Marketing webinars", keepRecordingDays: 90, keepTranscriptDays: 540, keepInsightsDays: 1095, autoDelete: true },
  { id: "ret_minimal", name: "Minimal footprint", keepRecordingDays: 7, keepTranscriptDays: 90, keepInsightsDays: 180, autoDelete: true },
];

export const seedAudit: AuditLogEntry[] = [
  { id: "aud_1", at: "2026-08-19T10:04:11Z", actor: "local user", action: "processing.completed", target: "Internal Product Sprint Review", detail: "Processed locally on Apple M3 Pro (Metal). No data left the device." },
  { id: "aud_2", at: "2026-08-18T15:02:40Z", actor: "local user", action: "export.report", target: "Kloudbean Product Demo — Acme Digital", detail: "PDF report exported to ~/Documents." },
  { id: "aud_3", at: "2026-08-12T17:20:02Z", actor: "local user", action: "cloudsync.enabled", target: "Scale Node.js Apps — Growth Webinar", detail: "Derived insights only; client-side encrypted with a customer-held key." },
  { id: "aud_4", at: "2026-08-10T08:11:55Z", actor: "local user", action: "retention.delete", target: "Recording: kb-onboarding-jul.mp4", detail: "Auto-deleted by policy 'Minimal footprint' after 7 days." },
];
