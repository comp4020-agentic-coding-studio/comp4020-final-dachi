import { afterEach, expect, inject, it } from "vitest";
import { openStream, type SseStream } from "./sse.ts";

// The crit-9 spec: an edit by one user shows up in every other open session
// within about a second, with no reload. These hold the stream behind the
// page to that, and to the reconnect decision in
// docs/decisions/0001-reconnect-catches-up-by-stroke-id.md.
const baseUrl = inject("baseUrl");
const streamUrl = (after?: number) =>
  new URL(`/api/marks/stream${after === undefined ? "" : `?after=${after}`}`, baseUrl);

const open: SseStream[] = [];
async function stream(headers: Record<string, string> = {}, after?: number) {
  const s = await openStream(streamUrl(after), headers);
  open.push(s);
  return s;
}
afterEach(() => {
  for (const s of open.splice(0)) s.close();
});

async function post(note: string, cookie?: string) {
  const res = await fetch(new URL("/api/marks", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseUrl, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ color: "#3a5a6b", note }),
  });
  expect(res.status).toBe(201);
  return {
    mark: (await res.json()).mark as { id: number },
    cookie: cookie ?? res.headers.get("set-cookie")!.split(";")[0],
  };
}

async function latestId(): Promise<number> {
  const { marks } = await (await fetch(new URL("/api/marks", baseUrl))).json();
  return Math.max(0, ...marks.map((m: { id: number }) => m.id));
}

// Concurrent spec files post too, so a stream may carry other strokes first.
async function until(s: SseStream, id: number, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const event = await s.next(deadline - Date.now());
    if (event.id === String(id)) return event;
  }
}

it("reaches every other open stream within a second, told as someone else's", async () => {
  const { cookie } = await post("a hand that will watch its own stroke arrive");
  const after = await latestId();
  const strangers = [await stream({}, after), await stream({}, after)];
  const own = await stream({ cookie }, after);
  for (const s of [...strangers, own]) expect(s.status).toBe(200);

  const hand = cookie.split("=")[1];
  const started = Date.now();
  const { mark } = await post("live, to every open tab", cookie);

  for (const s of strangers) {
    const event = await until(s, mark.id);
    expect(event.event).toBe("mark");
    expect(JSON.parse(event.data)).toMatchObject({ id: mark.id, yours: false });
    expect(event.raw).not.toContain(hand);
  }
  expect(JSON.parse((await until(own, mark.id)).data).yours).toBe(true);
  expect(Date.now() - started).toBeLessThan(1000);
});

it("replays exactly the strokes a reconnecting stream missed, in order", async () => {
  const before = await latestId();
  const { mark: a, cookie } = await post("missed one");
  const { mark: b } = await post("missed two", cookie);
  const { mark: c } = await post("missed three", cookie);

  // Other spec files post concurrently, so strokes may interleave; what must
  // hold is that the replay starts after the resume point, in id order.
  async function idsThrough(s: SseStream, last: number) {
    const ids: number[] = [];
    while (ids.at(-1) !== last) ids.push(Number((await s.next()).id));
    return ids;
  }

  // what an EventSource sends on its own automatic reconnect
  const resumed = await idsThrough(await stream({ "last-event-id": String(a.id) }), c.id);
  expect(resumed[0]).toBeGreaterThan(a.id);
  expect(resumed).toContain(b.id);
  expect(resumed).toEqual([...resumed].sort((x, y) => x - y));

  // a fresh tab opens from what it loaded; the later of the two wins
  const reopened = await idsThrough(await stream({ "last-event-id": String(before) }, b.id), c.id);
  expect(reopened.every((id) => id > b.id)).toBe(true);
});

it("treats a malformed resume point as the start of the scroll, not an error", async () => {
  const s = await stream({ "last-event-id": "not-a-number" });
  expect(s.status).toBe(200);
  expect(Number((await s.next()).id)).toBeGreaterThan(0);
});
