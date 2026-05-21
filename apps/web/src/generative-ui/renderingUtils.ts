import type { OpenUiCall, OpenUiValue } from "./openuiParser";
import type { GenerativeUiTone, RenderContext } from "./renderingTypes";

const VALID_TONES = new Set<GenerativeUiTone>([
  "neutral",
  "blue",
  "emerald",
  "amber",
  "rose",
  "violet",
  "cyan",
]);

export function asString(value: OpenUiValue | undefined, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asNumber(value: OpenUiValue | undefined, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

export function asTone(value: OpenUiValue | undefined, fallback: GenerativeUiTone = "neutral") {
  const tone = asString(value, fallback);
  return VALID_TONES.has(tone as GenerativeUiTone) ? (tone as GenerativeUiTone) : fallback;
}

export function asStringArray(value: OpenUiValue | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

export function resolveCall(value: OpenUiValue, context: RenderContext): OpenUiCall | null {
  if (typeof value !== "object" || Array.isArray(value)) return null;
  if (value.type === "call") return value;
  return context.program.statements.get(value.name) ?? null;
}

export function keyForValue(value: OpenUiValue, fallback: number): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return `${String(value)}:${fallback}`;
  }
  if (Array.isArray(value)) {
    return `array:${value.length}:${fallback}`;
  }
  if (value.type === "ref") {
    return `ref:${value.name}`;
  }
  return `call:${value.component}:${fallback}`;
}
