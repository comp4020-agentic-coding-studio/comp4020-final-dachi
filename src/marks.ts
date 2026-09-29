// A request that isn't the form can send anything: the shape a browser form
// enforces (a fixed set of radio values, a maxlength attribute) is re-checked
// here rather than trusted.
export const PALETTE = [
  "#2b2118", // walnut
  "#5b4636", // umber
  "#8a6d3b", // ochre
  "#3f5d40", // pine
  "#3a5a6b", // slate
  "#7a3b3b", // madder
] as const;

export type Color = (typeof PALETTE)[number];

const MAX_NOTE_LENGTH = 140;

export type ValidationResult =
  | { ok: true; note: string; color: Color }
  | { ok: false; reason: "unknown-color" | "note-too-long" };

export function isColor(value: unknown): value is Color {
  return typeof value === "string" && (PALETTE as readonly string[]).includes(value);
}

export function validateMark(input: { note?: unknown; color?: unknown }): ValidationResult {
  if (!isColor(input.color)) {
    return { ok: false, reason: "unknown-color" };
  }
  const rawNote = typeof input.note === "string" ? input.note : "";
  const note = rawNote.trim();
  if (note.length > MAX_NOTE_LENGTH) {
    return { ok: false, reason: "note-too-long" };
  }
  return { ok: true, note, color: input.color };
}
