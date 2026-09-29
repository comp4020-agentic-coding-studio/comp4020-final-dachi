import { expect, inject, it } from "vitest";

// The two things spec/invariants.test.ts already checks (/ answers, /readme/
// publishes README.md) aren't repeated here. Everything below is what
// CLAUDE.md commits this app to on top of that: a request that isn't the
// form can send anything, so the server, not the browser, is what these
// tests hold to account.
const baseUrl = inject("baseUrl");

function firstCookie(res: Response): string | undefined {
  return res.headers.get("set-cookie")?.split(";")[0];
}

it("rejects a colour outside the six the palette offers", async () => {
  const res = await fetch(new URL("/api/marks", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ color: "#ff00ff", note: "not on the palette" }),
  });
  expect(res.status).toBe(422);
  expect((await res.json()).error).toBe("unknown-color");
});

it("rejects a note over 140 characters even though the input's own maxlength would stop it", async () => {
  const res = await fetch(new URL("/api/marks", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ color: "#2b2118", note: "x".repeat(141) }),
  });
  expect(res.status).toBe(422);
  expect((await res.json()).error).toBe("note-too-long");
});

it("rejects a body larger than the server's own cap, before it ever reaches validation", async () => {
  const res = await fetch(new URL("/api/marks", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ color: "#2b2118", note: "x".repeat(20_000) }),
  });
  expect(res.status).toBe(413);
});

it("rejects a malformed JSON body without crashing the server", async () => {
  const res = await fetch(new URL("/api/marks", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "not json",
  });
  expect(res.status).toBe(400);

  // the same process still answers the next request
  const health = await fetch(new URL("/", baseUrl));
  expect(health.status).toBe(200);
});

it("adds a valid stroke, and a fresh read of the scroll includes it", async () => {
  const note = `crit-8 spec run ${Date.now()}`;
  const post = await fetch(new URL("/api/marks", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ color: "#3f5d40", note }),
  });
  expect(post.status).toBe(201);
  const created = (await post.json()).mark;
  expect(created.note).toBe(note);
  expect(created.color).toBe("#3f5d40");

  const list = await fetch(new URL("/api/marks", baseUrl));
  const { marks } = await list.json();
  expect(marks.some((m: { id: number }) => m.id === created.id)).toBe(true);
});

it("remembers a hand across requests, and a returning hand can see its own past strokes", async () => {
  const first = await fetch(new URL("/api/marks", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ color: "#3a5a6b", note: "first visit" }),
  });
  const cookie = firstCookie(first);
  expect(cookie, "no hand cookie was set on first contact").toBeTruthy();
  const created = (await first.json()).mark;

  // a second request from the same hand, cookie carried by hand this time
  const returned = await fetch(new URL("/api/marks", baseUrl), {
    headers: { cookie: cookie! },
  });
  const { marks, you } = await returned.json();
  expect(you).toBe(created.hand);
  expect(marks.some((m: { id: number; hand: string }) => m.id === created.id && m.hand === you)).toBe(
    true,
  );
});

it("answers 404 for a route that isn't part of the app", async () => {
  const res = await fetch(new URL("/not-a-real-route", baseUrl));
  expect(res.status).toBe(404);
});
