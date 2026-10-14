// One line per thing a person did, read from `flyctl logs` to say who did
// what. Fly prefixes each line with its own timestamp, so lines carry none.
import { createHash } from "node:crypto";

// A hand is a bearer token and the logs get read on a projector, so a line
// names a hand only by a short tag derived from it: the same hand always gets
// the same tag, and the tag can't be turned back into the cookie.
export function handTag(hand: string | null | undefined): string {
  if (!hand) return "none";
  return createHash("sha256").update(hand).digest("hex").slice(0, 6);
}

type Value = string | number | boolean | null | undefined;

// Free text (a note, a path, an origin) is JSON-quoted, so a note carrying a
// newline or `hand=` can't forge a second line or a field of its own.
function format(value: Value): string {
  if (typeof value === "string") {
    return /^[\w.:/#-]+$/.test(value) ? value : JSON.stringify(value);
  }
  return String(value);
}

export function log(event: string, fields: Record<string, Value> = {}): void {
  const parts = [event];
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) parts.push(`${key}=${format(value)}`);
  }
  console.log(parts.join(" "));
}
