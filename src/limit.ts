// How fast strokes may be tried, not how many a hand may leave. One script
// holding one cookie added 1,120 permanent strokes in five seconds, and a
// scroll buried under one hand's is no longer small enough to read. Someone
// adding strokes through the form never comes near either number.
export const PER_HAND = 10;
// A script that drops its cookie is a fresh hand every request, so the
// address is the limit that holds it. It's set high enough that a crit room
// behind one NAT, all posting at once, stays well inside it.
export const PER_ADDRESS = 60;
const WINDOW_MS = 60_000;

// Each key's attempt times within the last window, and how many attempts
// it has had refused since. A key whose window has emptied is dropped on the
// next check, so the map holds only the last minute's writers.
export class Limiter {
  private seen = new Map<string, { times: number[]; refused: number }>();
  private readonly max: number;

  constructor(max: number) {
    this.max = max;
  }

  // 0 if one more attempt under this key is allowed now (and it's counted);
  // otherwise how many have been refused in a row, this one included, so a
  // caller can log a flood once rather than once per request.
  take(key: string, now = Date.now()): number {
    for (const [k, entry] of this.seen) {
      if (entry.times.at(-1)! <= now - WINDOW_MS) this.seen.delete(k);
    }
    const entry = this.seen.get(key) ?? { times: [], refused: 0 };
    entry.times = entry.times.filter((t) => t > now - WINDOW_MS);
    this.seen.set(key, entry);
    if (entry.times.length < this.max) {
      entry.times.push(now);
      entry.refused = 0;
      return 0;
    }
    return ++entry.refused;
  }
}
