# Kivora Insights

IBuild a production-quality desktop-first, local-first meeting intelligence platform named “Kivora.”

TAGLINE

“Kivora turns meeting activity into clear next steps.”

CORE PRINCIPLE

Kivora must process meeting recordings and live meeting streams using the user’s own local CPU and GPU wherever possible. Raw video, raw audio, camera frames, facial data, and meeting recordings must never be uploaded to Kivora cloud servers by default.

Kivora analyzes observable engagement and collaboration signals. It must NOT infer emotion, personality, truthfulness, attention, mental state, intent from facial expression, or employee performance from biometric data.

POSITIONING

Kivora is a privacy-first meeting intelligence platform for sales calls, customer success calls, webinars, training sessions, and internal product discussions.

The product shows what occurred:

- Who attended and for how long.

- When attendees joined, left, or returned.

- Chat, Q&A, poll, reaction, raised-hand, and resource-click activity.

- Transcript topics, decisions, questions, objections, and explicit next steps.

- Speaker participation and talk-time balance.

- Recording/viewing retention where available.

- Network and media-quality events.

- Meeting-level engagement trends based on explicit event data.

The product does NOT claim to know what participants felt or thought.

PRIMARY USE CASES

- Sales demo intelligence: objections, explicit buying signals, next steps, stakeholder questions.

- Webinar analytics: registrations, attendance, retention, poll activity, Q&A, CTA and resource clicks.

- Customer-success calls: issues, requests, commitments, action items, risk statements.

- Internal product meetings: decisions, owners, tasks, unresolved questions.

- Training sessions: attendance, quiz/poll responses, interaction timeline, course follow-up.

ARCHITECTURE

Build Kivora as a hybrid local-first architecture.

1. LOCAL DESKTOP AGENT

- Build a Tauri desktop application.

- Use React + TypeScript for the UI.

- Use Rust for native desktop functions, local media access, secure storage, and performance-critical orchestration.

- Detect OS, CPU cores, available RAM, GPU vendor, GPU memory, and compute backend at onboarding.

- Support macOS, Windows, and Linux architecture abstraction.

- Never use privileged device permissions unless needed and explicitly approved by the user.

2. LOCAL PROCESSING ENGINE

All of the following must run locally by default:

- Audio extraction from a local recording.

- Audio normalization and voice activity detection.

- Speech-to-text transcription.

- Speaker diarization where locally supported.

- Transcript chunking, search indexing, and embeddings.

- Summarization and extraction of topics, decisions, action items, questions, and explicit intent statements.

- Analysis of meeting event logs.

- Audio/video/network quality aggregation.

- On-device anonymization/redaction for PII where configured.

- Local data encryption and retention/deletion jobs.

3. OPTIONAL CLOUD SYNC

Cloud sync must be opt-in and disabled by default.

- The user can sync only derived artifacts such as encrypted transcript, aggregate event data, summaries, action items, and report metadata.

- Provide granular per-meeting controls:

  - Keep fully local.

  - Sync derived insights only.

  - Sync encrypted recording plus insights.

- Do not upload raw recording without a separate, unmistakable confirmation.

- Design the backend as a zero-knowledge-compatible service: server operators should not be able to read customer content without customer-controlled keys.

- Use end-to-end encryption for synced content.

- Clearly display the current data location on every meeting detail page: “Local only,” “Encrypted sync,” or “Cloud recording enabled.”

LOCAL HARDWARE ACCELERATION

Implement an inference runtime abstraction that selects the best available local backend, with safe fallbacks.

Priority order:

- Apple Silicon: Metal / Core ML / MLX where compatible.

- NVIDIA GPU: CUDA or TensorRT where available.

- Windows AI hardware: DirectML fallback.

- AMD GPU: ROCm where supported; otherwise CPU fallback.

- Intel hardware: OpenVINO where supported; otherwise CPU fallback.

- CPU fallback: optimized ONNX Runtime / llama.cpp / native quantized inference.

Hardware detection UI should show:

- Device name.

- CPU model and core count.

- RAM available.

- GPU model, VRAM, and backend.

- Estimated transcription speed.

- Estimated local LLM capability.

- Current selected processing profile.

PROCESSING PROFILES

Create selectable profiles:

1. Private CPU

- Works on CPU only.

- Uses quantized small models.

- Best for laptops without a compatible GPU.

- Lower speed, maximum compatibility.

2. Balanced Local

- Uses local GPU when available.

- Uses a medium transcription model.

- Uses a quantized local LLM for summary/action extraction.

- Recommended default.

3. High Accuracy Local

- Uses the strongest compatible local transcription and diarization models.

- Uses GPU acceleration aggressively.

- Gives slower processing and higher local resource use.

- Best for important sales calls, webinars, and executive reviews.

4. Live Assist

- Processes low-latency audio chunks locally.

- Shows live transcript, key questions, suggested action items, and topic shifts.

- Must visibly show processing status and never block the call application.

- Uses adaptive resource throttling.

5. Cloud Assisted, Optional

- Disabled by default.

- User must separately approve cloud model use and review exactly what data leaves the device.

- Make local-only alternatives visible.

LOCAL AI MODEL OPTIONS

Create pluggable local model providers rather than hard-coding one model.

Transcription:

- Whisper.cpp with GGML/GGUF quantized models.

- faster-whisper with CTranslate2.

- ONNX Runtime-compatible Whisper models.

- User-selectable tiny, base, small, medium, and large model classes depending on device capacity.

Voice activity detection:

- Silero VAD, WebRTC VAD, or equivalent local runtime.

Speaker diarization:

- Local pyannote-compatible pipeline where model and licensing setup permits.

- Offline alternative diarization option.

- Gracefully degrade to “Speaker 1,” “Speaker 2,” etc. when speaker identity is unavailable.

Local LLM inference:

- llama.cpp with GGUF models.

- Ollama local API provider.

- MLX provider for Apple Silicon.

- ONNX Runtime GenAI provider where supported.

- Local model configuration screen where a user can choose installed models.

Embedding and local search:

- Local embedding model through ONNX Runtime, Ollama, or sentence-transformers-compatible local service.

- Store vectors locally using SQLite vector extension, LanceDB, or a local vector store.

- Never send embeddings to cloud by default.

All model downloads must be explicit, show file size, license, source, checksum, and disk impact. Do not silently download multi-gigabyte models.

RESOURCE MANAGEMENT

Build a serious local resource-control system.

- User-configurable CPU thread limit.

- User-configurable GPU utilization limit when supported.

- RAM limit and disk-space safety threshold.

- Pause / resume / cancel processing.

- Job queue with priority: live meeting > user-selected meeting > background batch processing.

- Battery-aware mode: pause heavy inference on battery unless the user overrides it.

- Thermal-aware mode where OS telemetry is available.

- Run heavy processing only when idle option.

- Scheduled background processing window.

- Automatic fallback from GPU to CPU if GPU inference fails.

- Record model/backend errors locally and show plain-language remediation.

PROCESSING PIPELINE

Build this pipeline as resumable, observable background jobs:

1. Import a local video/audio recording or connect to an authorized meeting platform export.

2. Create a local encrypted meeting record.

3. Extract audio locally using FFmpeg bundled or securely invoked by the desktop application.

4. Run local VAD to identify speech segments.

5. Run local speech-to-text using selected GPU/CPU backend.

6. Run local diarization if enabled.

7. Generate transcript with timestamps and speaker labels.

8. Index transcript locally for semantic search.

9. Extract structured meeting intelligence using a local LLM:

   - Summary.

   - Topics.

   - Decisions.

   - Action items.

   - Owners.

   - Due dates.

   - Questions.

   - Objections.

   - Feature requests.

   - Risks.

   - Explicit buying/next-step signals.

10. Import and normalize non-biometric engagement events:

   - attendee joined/left/rejoined

   - chat sent

   - Q&A submitted/answered

   - poll opened/submitted

   - reaction sent

   - hand raised

   - resource/CTA clicked

   - screen-share began/ended

   - technical issue detected

11. Produce an evidence-linked meeting report.

12. Save output locally, encrypt it at rest, and apply the selected retention policy.

The pipeline must survive restarts. Preserve job state and partial outputs. Do not redo completed expensive stages.

LIVE ASSIST MODE

Build a local live-assist screen for a user’s own microphone/system audio only after explicit permission.

Features:

- Live rolling transcript with timestamps.

- Speaker labels where technically possible.

- Current agenda/topic detection.

- Explicit questions detected.

- Action-item candidates.

- Decisions detected.

- A “Moments to revisit” bookmark button.

- Local resource monitor: CPU, GPU, RAM, model, processing latency.

- A clear local-only indicator.

Do not capture or analyze system audio, another participant’s recording, or any call without appropriate consent and a user-visible disclosure workflow.

MEETING ENGAGEMENT MODEL

Create a transparent, configurable, non-biometric meeting-level Engagement Score from 0 to 100:

Default formula:

- 30% attendance retention.

- 25% explicit interaction: chat, Q&A, polls, reactions, raised hands.

- 20% resource/CTA engagement.

- 15% active-viewing/player signals, only if supplied by an authorized platform.

- 10% technical-quality adjustment.

Rules:

- Explain each score component in the UI.

- Show the underlying events and timestamps.

- Allow admins to adjust organization-wide weights.

- Never score individual emotional state, focus, quality, motivation, personality, or performance.

- Use “engagement activity score,” never “sentiment score.”

DATA MODEL

Use SQLite locally by default, encrypted at rest with SQLCipher or platform-backed encryption.

Models:

- LocalUser

- Organization

- Workspace

- Meeting

- Participant

- AttendanceEvent

- InteractionEvent

- Poll

- PollResponse

- ChatMessage

- Question

- ResourceClick

- TranscriptSegment

- TranscriptEmbedding

- MeetingInsight

- EvidenceCitation

- ActionItem

- TechnicalQualityEvent

- ProcessingJob

- ProcessingProfile

- ModelInstallation

- HardwareProfile

- PrivacyPreference

- DataRetentionPolicy

- AuditLog

- CloudSyncRecord

Every event must include:

- id

- meetingId

- participantId when applicable

- eventType

- timestamp

- sourcePlatform

- metadata JSON

- createdAt

TRANSCRIPT INTELLIGENCE REQUIREMENTS

Every extracted item must cite evidence:

- A transcript timestamp range.

- Speaker label.

- Exact quoted snippet.

- Confidence score.

- The local model/provider/version that generated it.

Example:

Action item: “Send Acme the multi-cloud architecture document.”

Owner: “Vikram”

Evidence: 00:34:18–00:34:26, Speaker 1: “I’ll send you the multi-cloud architecture document after this call.”

Confidence: 0.93

Use cautious language:

- “The transcript explicitly states…”

- “Potential action item detected…”

- “This may need review…”

Do not create unsupported conclusions.

PRODUCT SCREENS

Build these screens:

1. Welcome and Privacy Setup

- Explain local-first processing.

- Explain what gets processed and where.

- Recording/consent acknowledgement.

- Hardware scan.

- Choose processing profile.

- Optional local model installation.

2. Home Dashboard

- Meetings processed.

- Hours processed locally.

- Local-only percentage.

- Engagement activity trend.

- Top discussion topics.

- Open action items.

- Recent reports.

- Processing queue and resource health.

3. Meeting Library

- Search, sort, tags, filters.

- Local-only / encrypted sync / cloud recording indicators.

- Processing status.

- Engagement activity score.

- Technical health score.

- One-click import recording.

4. Import and Process

- Drag-and-drop MP4, MOV, MKV, MP3, M4A, WAV.

- Show local file path only in the desktop app, not in logs synced externally.

- Select language.

- Select transcription model.

- Select processing profile.

- Toggle diarization, PII redaction, embeddings, and sync.

- Estimate processing time, RAM/VRAM, battery and disk impact.

- Show explicit “Process locally on this device” badge.

5. Meeting Detail

Tabs:

- Summary

- Attendance

- Engagement Timeline

- Interactions

- Transcript

- Insights and Action Items

- Technical Quality

- Privacy and Data

6. Local Model Manager

- Installed models.

- Downloaded model size.

- Inference backend.

- Compatibility.

- Disk use.

- Update and delete.

- Model licenses.

- Test inference button.

7. Device and Performance Settings

- Hardware detected.

- Backend selection.

- CPU thread limit.

- GPU profile.

- RAM cap.

- Background processing schedule.

- Battery settings.

- Local diagnostic log export.

8. Privacy Center

- Local-only default setting.

- Per-meeting data location.

- Encryption status.

- Data deletion controls.

- Retention rules.

- Cloud-sync configuration.

- Audit-log viewer.

- Consent template/export.

UI AND DESIGN

- Premium enterprise desktop application.

- Modern dark charcoal/navy interface with indigo or violet accent.

- Use charts, event timelines, clear processing status, tooltips, and evidence panels.

- Make CPU/GPU/local status visible but not distracting.

- Build responsive layouts for desktop first, then web/mobile read-only reports.

- No surveillance-themed graphics or language.

- Use plain, credible, privacy-focused copy.

SECURITY

- Encrypt local database.

- Store keys in OS Keychain on macOS, Credential Manager on Windows, and Secret Service/KWallet equivalent on Linux.

- Encrypt optional synced content client-side before upload.

- Use signed model manifests and checksum verification.

- Never include raw transcript or recording content in crash reports, analytics, or telemetry.

- Default product telemetry to off.

- Use structured audit logs for exports, sharing, deletion, and cloud-sync changes.

SEED DATA

Create three demo meetings:

1. “Kloudbean Product Demo — Acme Digital”

   - 45 minutes, 8 participants.

   - Discussion around multi-cloud Node.js deployment and pricing.

   - Several questions around architecture.

   - Explicit statement requesting a technical follow-up call.

   - Short audio-quality issue around minute 29.

2. “Scale Node.js Apps — Growth Webinar”

   - 60 minutes, 240 registrations, 164 attendees.

   - Two polls, high chat volume during case study.

   - CTA click spike after deployment checklist.

   - Drop-off during extended Q&A.

3. “Internal Product Sprint Review”

   - 32 minutes, 6 participants.

   - Decisions and owner-assigned action items.

   - Low interaction volume; do not describe this as low morale, boredom, or disengagement.

DEVELOPER DELIVERABLES

Generate:

- Tauri + React + TypeScript application.

- Rust native module architecture.

- Local encrypted SQLite schema and migrations.

- Clean service interfaces for transcription, diarization, local LLM, embeddings, GPU backend selection, and optional cloud sync.

- Mock CPU/GPU capability detection when native implementation is unavailable.

- Working seeded demo mode.

- Background job queue with persistence.

- README with local setup instructions.

- README section explaining model installation, GPU acceleration, CPU fallback, privacy model, and future integration approach.

- Automated tests for the engagement score, data retention deletion, job resumption, evidence citations, and cloud-sync opt-in enforcement.

IMPORTANT ACCEPTANCE CRITERIA

- The app must function fully in local-only mode with internet disconnected after models are installed.

- Raw recording and transcript remain on the device unless a user explicitly enables sync.

- All major insights show evidence and timestamps.

- No facial analysis, voiceprint analysis, biometric identifiers, emotion labels, mood labels, sentiment claims from appearance, or individual attention scoring.

- CPU/GPU resource limits work and are visible.

- The product makes its local-first privacy advantage obvious at every meaningful step.

Start by building the fully functional local-demo version, including seeded data, dashboard, meeting detail pages, local job queue, settings, and simulated inference progress. Then organize code so actual Whisper.cpp/faster-whisper, Ollama/llama.cpp, and native GPU providers can be connected cleanly.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6fb5dd4d-90c5-4600-9e0b-9204777bcaf7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
