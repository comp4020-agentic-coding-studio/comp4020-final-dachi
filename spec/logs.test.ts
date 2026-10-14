import { type ChildProcess, spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";

// At crit 10 the presenter narrates two classmates' use of the live app from
// `flyctl logs` alone, so the log has to say who did what. The shared app
// spec/global-setup.ts finds keeps its stdout to itself, so like
// persistence.test.ts this runs its own server and reads what it prints.

const dataDir = mkdtempSync(join(tmpdir(), "long-scroll-logs-"));
const port = 18174;
const origin = `http://localhost:${port}`;
let child: ChildProcess;
let stdout = "";

beforeAll(async () => {
  child = spawn("node", ["src/server.ts"], {
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDir },
    stdio: ["ignore", "pipe", "inherit"],
  });
  child.stdout?.on("data", (chunk: Buffer) => {
    stdout += chunk.toString();
  });
  for (let attempt = 0; ; attempt++) {
    try {
      await fetch(origin);
      return;
    } catch {
      if (attempt >= 100) throw new Error(`nothing answered at ${origin}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
});

afterAll(async () => {
  await new Promise((resolve) => {
    child.on("exit", resolve);
    child.kill();
  });
  rmSync(dataDir, { recursive: true, force: true });
});

// What a fresh browser profile does: load the page, keep the cookie it's
// given, then post with it.
async function visit(): Promise<{ cookie: string; hand: string }> {
  const res = await fetch(new URL("/", origin));
  const cookie = res.headers.get("set-cookie")?.split(";")[0];
  expect(cookie, "the page itself should give a new browser its hand").toBeTruthy();
  return { cookie: cookie!, hand: cookie!.split("=")[1] };
}

async function post(cookie: string, body: unknown, from = origin) {
  return fetch(new URL("/api/marks", origin), {
    method: "POST",
    headers: { "content-type": "application/json", origin: from, cookie },
    body: JSON.stringify(body),
  });
}

async function linesFor(event: string, count: number): Promise<string[]> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const lines = stdout.split("\n").filter((line) => line.startsWith(`${event} `));
    if (lines.length >= count) return lines;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`fewer than ${count} "${event}" lines in:\n${stdout}`);
}

const tag = (line: string) => /\bhand=(\S+)/.exec(line)?.[1];

it("tells two visitors apart, from their first page load, without printing either hand", async () => {
  const ada = await visit();
  const bo = await visit();
  expect((await post(ada.cookie, { color: "#3f5d40", note: "ada's stroke" })).status).toBe(201);
  expect((await post(bo.cookie, { color: "#7a3b3b", note: "bo's stroke" })).status).toBe(201);

  const arrivals = await linesFor("arrive", 2);
  const strokes = await linesFor("stroke", 2);
  const adaStroke = strokes.find((line) => line.includes("ada's stroke"))!;
  const boStroke = strokes.find((line) => line.includes("bo's stroke"))!;

  expect(tag(adaStroke)).not.toBe(tag(boStroke));
  expect(arrivals.slice(-2).map(tag)).toEqual([tag(adaStroke), tag(boStroke)]);
  expect(adaStroke).toContain("ink=pine");
  expect(boStroke).toContain("ink=madder");
  expect(stdout).not.toContain(ada.hand);
  expect(stdout).not.toContain(bo.hand);
});

it("logs a refused write against the hand that tried it, and why", async () => {
  const { cookie } = await visit();
  const arrive = (await linesFor("arrive", 1)).at(-1)!;
  await post(cookie, { color: "#ff00ff", note: "not a palette ink" });
  await post(cookie, { color: "#2b2118" }, "https://elsewhere.example");
  await fetch(new URL("/api/marks/1", origin), { method: "DELETE", headers: { cookie, origin } });

  const refusals = await linesFor("refuse", 2);
  expect(refusals.at(-2)).toMatch(/reason=unknown-color/);
  expect(refusals.at(-1)).toMatch(/reason=cross-site-request/);
  const misses = await linesFor("miss", 1);
  expect(misses.at(-1)).toMatch(/method=DELETE/);
  for (const line of [...refusals.slice(-2), misses.at(-1)!]) expect(tag(line)).toBe(tag(arrive));
});

it("keeps a note to one line, so a note can't forge a log line of its own", async () => {
  const { cookie } = await visit();
  const forged = "hi\nstroke hand=000000 id=1 note=forged";
  expect((await post(cookie, { color: "#2b2118", note: forged })).status).toBe(201);
  await linesFor("stroke", 3);
  expect(stdout).not.toMatch(/^stroke hand=000000/m);
});

// A script's flood is refused thousands of times a second; one line says so,
// and the rest would only bury the lines a narrator is reading.
it("logs a hand held back for writing too fast once, not once per refused write", async () => {
  const { cookie } = await visit();
  const arrive = (await linesFor("arrive", 1)).at(-1)!;
  for (let i = 0; i < 15; i++) await post(cookie, { color: "#2b2118", note: `flood ${i}` });

  const fast = (await linesFor("refuse", 1)).filter((line) => line.includes("reason=too-fast"));
  expect(fast).toHaveLength(1);
  expect(tag(fast[0])).toBe(tag(arrive));
});
