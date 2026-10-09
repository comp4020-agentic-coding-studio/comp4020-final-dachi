import { JSDOM } from "jsdom";
import { randomUUID } from "node:crypto";
import { afterEach, expect, inject, it } from "vitest";
import { openStream, type SseStream } from "./sse.ts";

// marks.test.ts holds the server to CLAUDE.md; this holds the page's own
// script to the two rules only the browser side can keep: a stroke's owner is
// told in text, not just ink, and every control is a native labelled form
// element. It loads the served page and the served public/app.js against the
// running app, so it sees what a visitor's browser would.
const baseUrl = inject("baseUrl");

async function addStroke(note: string, cookie?: string): Promise<string> {
  const res = await fetch(new URL("/api/marks", baseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseUrl,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({ color: "#3f5d40", note }),
  });
  expect(res.status).toBe(201);
  return cookie ?? res.headers.get("set-cookie")!.split(";")[0];
}

// jsdom has no cookie jar shared with Node's fetch, so the page's fetch is
// Node's own, carrying this hand's cookie the way the browser would, and
// keeping any fresh one the server mints. jsdom has no EventSource either;
// the stand-in below reads the real stream with that same cookie.
const streams: SseStream[] = [];
afterEach(() => {
  for (const s of streams.splice(0)) s.close();
});

const opened: { url: string; closed: boolean }[] = [];

async function openPage(cookie = "", { holdPostMs = 0, postStatus = 0 } = {}): Promise<Document> {
  const html = await (await fetch(new URL("/", baseUrl))).text();
  const script = await (await fetch(new URL("/app.js", baseUrl))).text();
  const { window } = new JSDOM(html, { url: baseUrl, runScripts: "outside-only" });
  window.fetch = (async (input: string, init: RequestInit = {}) => {
    // stands in for Fly's proxy answering when it couldn't reach the machine
    if (init.method === "POST" && postStatus) return new Response("", { status: postStatus });
    const res = await fetch(new URL(input, baseUrl), {
      ...init,
      headers: { ...(init.headers as Record<string, string>), cookie, origin: baseUrl },
    });
    cookie = res.headers.get("set-cookie")?.split(";")[0] ?? cookie;
    if (init.method === "POST") await new Promise((resolve) => setTimeout(resolve, holdPostMs));
    return res;
  }) as typeof window.fetch;

  class StreamStandIn extends window.EventTarget {
    static OPEN = 1;
    static CLOSED = 2;
    readyState = 0;
    record = { url: "", closed: false };
    stream: SseStream | undefined;
    constructor(url: string) {
      super();
      this.record.url = url;
      opened.push(this.record);
      void (async () => {
        const stream = await openStream(new URL(url, baseUrl), { cookie });
        streams.push(stream);
        this.stream = stream;
        if (this.record.closed) return stream.close();
        this.readyState = 1;
        this.dispatchEvent(new window.Event("open"));
        for (;;) {
          const event = await stream.next(60_000).catch(() => null);
          if (!event || this.record.closed) return;
          this.dispatchEvent(new window.MessageEvent(event.event, { data: event.data }));
        }
      })();
    }
    close() {
      this.record.closed = true;
      this.readyState = 2;
      this.stream?.close();
    }
  }
  (window as unknown as { EventSource: unknown }).EventSource = StreamStandIn;

  window.eval(script);
  return window.document;
}

async function until(check: () => boolean, what: string, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

async function itemFor(doc: Document, note: string): Promise<Element> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const li = [...doc.querySelectorAll("#scroll li")].find((el) =>
      el.textContent?.includes(note),
    );
    if (li) return li;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`the page never rendered the stroke "${note}"`);
}

it("says in text which strokes are yours, not just in ink", async () => {
  const mine = `page test, mine ${randomUUID()}`;
  const theirs = `page test, theirs ${randomUUID()}`;
  const cookie = await addStroke(mine);
  await addStroke(theirs);

  const doc = await openPage(cookie);
  expect((await itemFor(doc, mine)).textContent).toMatch(/ — yours$/);
  expect((await itemFor(doc, theirs)).textContent).not.toContain("yours");

  const welcome = doc.getElementById("welcome-back")!;
  expect(welcome.hidden).toBe(false);
  expect(welcome.textContent).toMatch(/still there/);
});

it("offers only native, labelled, keyboard-reachable controls", async () => {
  const doc = await openPage(await addStroke(`page test, controls ${randomUUID()}`));
  const form = doc.getElementById("add-mark-form")!;

  const radios = [...form.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
  expect(radios).toHaveLength(6);

  const controls = [...form.querySelectorAll<HTMLInputElement>("input, button")];
  for (const control of controls) {
    const name =
      control.tagName === "BUTTON"
        ? control.textContent
        : [...(control.labels ?? [])].map((l) => l.textContent).join("");
    expect(name?.trim(), `${control.outerHTML} has no label`).toBeTruthy();
    expect(control.tabIndex, `${control.outerHTML} is out of the tab order`).toBeGreaterThanOrEqual(0);
    expect(control.disabled).toBe(false);
  }
  expect(form.querySelectorAll("[tabindex], [onclick], [role='button']")).toHaveLength(0);
});

it("shows another hand's stroke within a second, with no reload, and announces it", async () => {
  const doc = await openPage(await addStroke(`page test, watcher ${randomUUID()}`));
  const liveState = doc.getElementById("live-state")!;
  await until(() => liveState.textContent!.startsWith("live"), "the stream to open");

  const theirs = `page test, arriving live ${randomUUID()}`;
  await addStroke(theirs);
  await until(
    () => [...doc.querySelectorAll("#scroll li")].some((li) => li.textContent?.includes(theirs)),
    "the other hand's stroke to appear",
  );
  const announce = doc.getElementById("scroll-announce")!;
  expect(announce.textContent).toContain(theirs);
  // New strokes land at the foot of the scroll, screens below a phone's first
  // view, so the announcement is shown as well as spoken.
  expect(announce.textContent).toContain("at the foot of the scroll");
  expect(announce.matches(".visually-hidden, [hidden]")).toBe(false);
});

// In a real browser the stream's copy of your own stroke usually beats the
// post's response; holding the response back makes that order certain here.
it("marks a first-time visitor's own first stroke as theirs, even when the stream's copy lands first", async () => {
  const doc = await openPage("", { holdPostMs: 300 });
  await until(() => doc.getElementById("live-state")!.textContent!.startsWith("live"), "the stream to open");
  const announce = doc.getElementById("scroll-announce")!;
  const before = announce.textContent;

  const mine = `page test, first visit ${randomUUID()}`;
  (doc.getElementById("note") as HTMLInputElement).value = mine;
  doc.querySelector<HTMLButtonElement>("#add-mark-form button")!.click();

  await until(
    () => doc.getElementById("form-status")!.textContent === "added to the scroll.",
    "the post to finish",
  );
  const items = [...doc.querySelectorAll("#scroll li")].filter((li) => li.textContent?.includes(mine));
  expect(items).toHaveLength(1);
  expect(items[0].textContent).toMatch(/ — yours$/);
  expect(announce.textContent).toBe(before);
});

// "Before" means before this visit: a stroke made on this page, or arriving
// from another of this hand's tabs, isn't news to welcome anyone back with.
it("welcomes a hand back only for strokes left before this visit", async () => {
  const first = await openPage();
  await until(() => first.getElementById("live-state")!.textContent!.startsWith("live"), "the stream to open");
  (first.getElementById("note") as HTMLInputElement).value = `page test, welcome ${randomUUID()}`;
  first.querySelector<HTMLButtonElement>("#add-mark-form button")!.click();
  await until(
    () => first.getElementById("form-status")!.textContent === "added to the scroll.",
    "the post to finish",
  );
  expect(first.getElementById("welcome-back")!.hidden).toBe(true);

  const cookie = await addStroke(`page test, welcome old ${randomUUID()}`);
  const returning = await openPage(cookie);
  await until(() => returning.getElementById("live-state")!.textContent!.startsWith("live"), "the stream to open");
  const welcome = returning.getElementById("welcome-back")!;
  expect(welcome.textContent).toMatch(/left a mark/);
  const fromOtherTab = `page test, welcome other tab ${randomUUID()}`;
  await addStroke(fromOtherTab, cookie);
  await itemFor(returning, fromOtherTab);
  expect(welcome.textContent).toMatch(/left a mark/);
});

// Holding this tab's own announcement back while its post is in flight mustn't
// swallow a stranger's stroke that happens to land in the same window.
it("still announces another hand's stroke that arrives while your own post is in flight", async () => {
  const doc = await openPage(await addStroke(`page test, poster ${randomUUID()}`), { holdPostMs: 400 });
  await until(() => doc.getElementById("live-state")!.textContent!.startsWith("live"), "the stream to open");
  const heard: string[] = [];
  const announce = doc.getElementById("scroll-announce")!;
  new doc.defaultView!.MutationObserver(() => heard.push(announce.textContent ?? "")).observe(announce, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  const mine = `page test, in flight ${randomUUID()}`;
  (doc.getElementById("note") as HTMLInputElement).value = mine;
  doc.querySelector<HTMLButtonElement>("#add-mark-form button")!.click();
  const theirs = `page test, meanwhile ${randomUUID()}`;
  await addStroke(theirs);

  await until(
    () => doc.getElementById("form-status")!.textContent === "added to the scroll.",
    "the post to finish",
    2000,
  );
  expect(heard.some((text) => text.includes(theirs))).toBe(true);
  expect(heard.some((text) => text.includes(mine))).toBe(false);
});

// The scroll never forgets, so a double click (or Enter pressed twice) while
// the first post is still in flight must not leave the same stroke twice.
it("posts once when the form is submitted again before the first post answers", async () => {
  const doc = await openPage("", { holdPostMs: 300 });
  await until(() => doc.getElementById("live-state")!.textContent!.startsWith("live"), "the stream to open");

  const mine = `page test, double submit ${randomUUID()}`;
  (doc.getElementById("note") as HTMLInputElement).value = mine;
  const button = doc.querySelector<HTMLButtonElement>("#add-mark-form button")!;
  button.click();
  button.click();

  await until(
    () => doc.getElementById("form-status")!.textContent === "added to the scroll.",
    "the post to finish",
  );
  await new Promise((resolve) => setTimeout(resolve, 600));
  const items = [...doc.querySelectorAll("#scroll li")].filter((li) => li.textContent?.includes(mine));
  expect(items).toHaveLength(1);
});

// On a warm machine a post can answer faster than a person double-clicks, so
// the second click lands after the first post and, with the note cleared,
// would leave a blank stroke nobody meant on a scroll that never forgets.
it("ignores a second submit just after a post answers, but takes a deliberate one", async () => {
  const doc = await openPage();
  await until(() => doc.getElementById("live-state")!.textContent!.startsWith("live"), "the stream to open");

  const status = doc.getElementById("form-status")!;
  const button = doc.querySelector<HTMLButtonElement>("#add-mark-form button")!;
  const yours = () => doc.querySelectorAll("#scroll .mark--yours").length;
  (doc.getElementById("note") as HTMLInputElement).value = `page test, fast answer ${randomUUID()}`;
  button.click();
  await until(() => status.textContent === "added to the scroll.", "the post to finish");
  button.click();
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(yours()).toBe(1);

  await new Promise((resolve) => setTimeout(resolve, 800));
  button.click();
  await until(() => yours() === 2, "a deliberate second stroke to land");
});

// The real form can't send an over-long note (maxlength matches the server's
// cap), so a refused post is almost always the server or Fly's proxy failing,
// and advice to shorten the note would be wrong.
it("doesn't blame the note when the server, not the note, refused the post", async () => {
  const doc = await openPage("", { postStatus: 502 });
  await until(() => doc.getElementById("live-state")!.textContent!.startsWith("live"), "the stream to open");

  (doc.getElementById("note") as HTMLInputElement).value = "a perfectly short note";
  doc.querySelector<HTMLButtonElement>("#add-mark-form button")!.click();
  const status = doc.getElementById("form-status")!;
  await until(() => status.textContent !== "adding your mark…", "the post to finish");
  expect(status.textContent).not.toMatch(/shorter/);
  expect(status.textContent).toMatch(/try again/);
  expect((doc.getElementById("note") as HTMLInputElement).value).toBe("a perfectly short note");
});

// A stream can die without either end saying so (a phone waking on a
// connection the server already dropped). EventSource still reads OPEN, so the
// page has to notice the silence itself and reopen from where it was.
it("reopens a stream that has gone silent, from the last stroke it showed", async () => {
  const doc = await openPage(await addStroke(`page test, sleeper ${randomUUID()}`));
  const liveState = doc.getElementById("live-state")!;
  await until(() => liveState.textContent!.startsWith("live"), "the stream to open");
  const first = opened.at(-1)!;
  const shown = Math.max(...[...doc.querySelectorAll<HTMLElement>("#scroll li")].map((li) => Number(li.dataset.id)));

  const window = doc.defaultView!;
  const now = window.Date.now.bind(window.Date);
  window.Date.now = () => now() + 120_000;
  Object.defineProperty(doc, "hidden", { value: false, configurable: true });
  doc.dispatchEvent(new window.Event("visibilitychange"));

  expect(first.closed).toBe(true);
  expect(opened.at(-1)).not.toBe(first);
  expect(opened.at(-1)!.url).toContain(`after=${shown}`);
  await until(() => liveState.textContent!.startsWith("live"), "the stream to reopen");
});
