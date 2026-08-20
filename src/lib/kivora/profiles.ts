import type { InferenceBackend, ProcessingProfileId } from "./types";

export const PROFILES: Array<{
  id: ProcessingProfileId;
  name: string;
  tagline: string;
  bullets: string[];
  recommended?: boolean;
  requiresApproval?: boolean;
}> = [
  {
    id: "private_cpu",
    name: "Private CPU",
    tagline: "Maximum compatibility, CPU only",
    bullets: [
      "Runs entirely on CPU with quantized small models",
      "Best for laptops without a compatible GPU",
      "Lower speed, no GPU driver requirements",
    ],
  },
  {
    id: "balanced_local",
    name: "Balanced Local",
    tagline: "Recommended default",
    bullets: [
      "Uses the local GPU when available",
      "Medium transcription model",
      "Quantized local LLM for summaries and action items",
    ],
    recommended: true,
  },
  {
    id: "high_accuracy_local",
    name: "High Accuracy Local",
    tagline: "Best for important calls",
    bullets: [
      "Strongest compatible local transcription and diarization",
      "Aggressive GPU acceleration",
      "Slower processing, higher local resource use",
    ],
  },
  {
    id: "live_assist",
    name: "Live Assist",
    tagline: "Low-latency local streaming",
    bullets: [
      "Processes short audio chunks locally",
      "Live transcript, questions, action-item candidates, topic shifts",
      "Adaptive throttling so the call app is never blocked",
    ],
  },
  {
    id: "cloud_assisted",
    name: "Cloud Assisted",
    tagline: "Disabled by default, opt-in only",
    bullets: [
      "Requires separate approval before any data leaves the device",
      "Shows exactly which fields would be transmitted",
      "Local-only alternatives stay available and visible",
    ],
    requiresApproval: true,
  },
];

export const BACKEND_LABEL: Record<InferenceBackend, string> = {
  metal_mlx: "Metal / Core ML / MLX (Apple Silicon)",
  cuda: "CUDA / TensorRT (NVIDIA)",
  directml: "DirectML (Windows AI hardware)",
  rocm: "ROCm (AMD)",
  openvino: "OpenVINO (Intel)",
  cpu: "CPU fallback (ONNX Runtime / llama.cpp)",
};

export const BACKEND_PRIORITY: InferenceBackend[] = [
  "metal_mlx",
  "cuda",
  "directml",
  "rocm",
  "openvino",
  "cpu",
];

/** Selects the highest-priority available backend, always falling back to CPU. */
export function selectBackend(available: InferenceBackend[]): InferenceBackend {
  return BACKEND_PRIORITY.find((b) => available.includes(b)) ?? "cpu";
}

export const DATA_LOCATION_LABEL = {
  local_only: "Local only",
  encrypted_sync: "Encrypted sync",
  cloud_recording: "Cloud recording enabled",
} as const;
