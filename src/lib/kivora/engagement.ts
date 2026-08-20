import type {
  EngagementComponent,
  EngagementScore,
  EngagementWeights,
  Meeting,
  MeetingEvent,
  Participant,
  TechnicalQualityEvent,
} from "./types";

export const DEFAULT_WEIGHTS: EngagementWeights = {
  attendanceRetention: 0.3,
  explicitInteraction: 0.25,
  resourceEngagement: 0.2,
  activeViewing: 0.15,
  technicalQuality: 0.1,
};

const INTERACTION_TYPES = new Set([
  "chat_sent",
  "question_submitted",
  "poll_submitted",
  "reaction_sent",
  "hand_raised",
]);

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Non-biometric meeting-level engagement activity score (0-100).
 * Derived only from explicit, observable event data. It never models
 * emotion, attention, focus, personality, or individual performance.
 */
export function computeEngagementScore(input: {
  meeting: Meeting;
  participants: Participant[];
  events: MeetingEvent[];
  technicalEvents: TechnicalQualityEvent[];
  weights?: EngagementWeights;
  /** Player/active-viewing signals only when an authorized platform supplies them. */
  activeViewingRatio?: number;
}): EngagementScore {
  const weights = input.weights ?? DEFAULT_WEIGHTS;
  const { meeting, participants, events, technicalEvents } = input;

  const totalPossible = participants.length * meeting.durationMinutes;
  const attended = participants.reduce((sum, p) => sum + p.attendedMinutes, 0);
  const retention = totalPossible > 0 ? clamp01(attended / totalPossible) : 0;

  const interactionEvents = events.filter((e) => INTERACTION_TYPES.has(e.eventType));
  const perAttendee =
    participants.length > 0 ? interactionEvents.length / participants.length : 0;
  // 3 explicit interactions per attendee is treated as a fully interactive meeting.
  const interaction = clamp01(perAttendee / 3);

  const resourceClicks = events.filter((e) => e.eventType === "resource_clicked");
  const resource =
    participants.length > 0 ? clamp01(resourceClicks.length / participants.length / 0.6) : 0;

  const viewingSupplied = typeof input.activeViewingRatio === "number";
  const viewing = viewingSupplied ? clamp01(input.activeViewingRatio!) : 0;

  const severityCost = { low: 0.05, medium: 0.12, high: 0.25 } as const;
  const quality = clamp01(
    1 - technicalEvents.reduce((sum, e) => sum + severityCost[e.severity], 0),
  );

  const rows: Array<Omit<EngagementComponent, "points">> = [
    {
      key: "attendanceRetention",
      label: "Attendance retention",
      weight: weights.attendanceRetention,
      rawValue: retention,
      supplied: true,
      eventCount: events.filter((e) => e.eventType.startsWith("attendee")).length,
      explanation: `${attended} of ${totalPossible} possible attendee-minutes were logged across ${participants.length} attendees.`,
    },
    {
      key: "explicitInteraction",
      label: "Explicit interaction",
      weight: weights.explicitInteraction,
      rawValue: interaction,
      supplied: true,
      eventCount: interactionEvents.length,
      explanation: `${interactionEvents.length} chat, Q&A, poll, reaction and raised-hand events (${perAttendee.toFixed(2)} per attendee).`,
    },
    {
      key: "resourceEngagement",
      label: "Resource / CTA engagement",
      weight: weights.resourceEngagement,
      rawValue: resource,
      supplied: true,
      eventCount: resourceClicks.length,
      explanation: `${resourceClicks.length} logged resource or CTA clicks.`,
    },
    {
      key: "activeViewing",
      label: "Active-viewing player signals",
      weight: weights.activeViewing,
      rawValue: viewing,
      supplied: viewingSupplied,
      eventCount: 0,
      explanation: viewingSupplied
        ? `Authorized platform reported ${(viewing * 100).toFixed(0)}% active-viewing ratio.`
        : "No authorized platform supplied player signals, so this component contributes 0 points.",
    },
    {
      key: "technicalQuality",
      label: "Technical-quality adjustment",
      weight: weights.technicalQuality,
      rawValue: quality,
      supplied: true,
      eventCount: technicalEvents.length,
      explanation: `${technicalEvents.length} media/network quality events logged.`,
    },
  ];

  const components: EngagementComponent[] = rows.map((r) => ({
    ...r,
    points: Math.round(r.rawValue * r.weight * 100 * 10) / 10,
  }));

  const score = Math.round(components.reduce((sum, c) => sum + c.points, 0));
  return { score: Math.max(0, Math.min(100, score)), components };
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${String(h).padStart(2, "0")}:${mm}:${ss}` : `00:${mm}:${ss}`;
}

export function formatRange(start: number, end: number): string {
  return `${formatTime(start)}\u2013${formatTime(end)}`;
}
