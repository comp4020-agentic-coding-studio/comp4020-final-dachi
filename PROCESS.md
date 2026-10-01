# Process overview

## From the brief to a concept

The final project brief fixes three things &mdash; multi-user, real-time,
persists &mdash; and leaves everything else, including what "good" means, to
me. Crit 8's own brief narrows that further: ship a working slice and a first
README, and explicitly says the feature list, the real-time layer and the
polish can all wait, because this week's mark reads the exercise, not the
in-flight project. Two lines in the final project brief shaped the concept
more than any other: "small is fine: an app for twelve people, one street,
one book club or one afternoon is on-brief," and "design for co-presence: the
app should be more interesting because other people are using it at the same
time." I wanted a shared object that gets more interesting as more hands
touch it, without needing accounts, moderation, or anything that only makes
sense at a market's scale &mdash; which is also, not coincidentally, an
object I'm named after: a scroll that survives, imperfectly, across a long
time and several hands.

Long Scroll is the result: everyone who visits can add one stroke &mdash; a
colour, and an optional short note &mdash; to a single, shared, append-only
scroll. There's no feed, no ranking, no expiry. Multi-user is real (an
anonymous per-browser cookie is a person, and every visitor sees the same
persisted rows); persistence is real (SQLite on the Fly volume, verified to
survive a container restart, not just a page reload); real-time is
deliberately not built yet, because the brief stages it at the next crit
("All at once") and building it now, with nothing yet to test the several-
viewers story against, would have been work with no way to verify it was the
right call.

## Stack, and the trade-offs

The whole backend is a plain `node:http` server
([`2bfeff5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/2bfeff5)):
no Express, no Astro, no ORM. I weighed this against the stack I used for a
prior full-stack crit (Astro + Drizzle + better-sqlite3 + SSE) and chose
differently on purpose. That stack earns its weight when a site has many
content pages or needs a templating layer; this app has four JSON routes and
three static files, and a framework would be machinery the README's own
argument (fewer moving parts, matching Ben Hoyt's small-web case) would then
have to justify away. `node:sqlite`, not `better-sqlite3`, was the sharper
call: it ships inside Node 24 (already pinned in `mise.toml`), so there's no
native module to compile for the deploy target &mdash; one whole failure mode
(a missing build toolchain in a slim Docker image) doesn't exist. The cost is
real: it's a newer API with a smaller track record than `better-sqlite3`'s.
I judged that cost worth it against a 256MB machine and a course-long
project, where fewer things that can fail to build outweighs a library's
maturity.

The one runtime dependency is `marked`, to render `README.md` at `/readme/`
&mdash; hand-rolling a Markdown renderer for one file felt like exactly the
kind of premature abstraction the brief's "small is fine" argues against in
the other direction: pulling in machinery to avoid a small, well-tested
dependency isn't smaller, just differently complicated.

## Workflow: verify against the real thing before writing the claim

I built in the order a marker would read it, backwards: server and schema
first, front end second, then the checks in `spec/`
([`d417b24`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/d417b24)),
then `README.md`
([`8e66feb`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/8e66feb))
and `CLAUDE.md`
([`6ae9b34`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/6ae9b34))
last, so that every claim the README makes about what's enforced was already
true and tested, not aspirational. Before any of that landed, I built the
exact CI image locally (`docker build -t app .`, then the same
`docker run --tmpfs /data` line `checks.yml` uses) and ran `pnpm check`
against the running container, not just against a local `node --watch`
process &mdash; the same gap crit 7 taught me to check for: a stack behaving
correctly in dev and differently in the image CI actually gates on.

That local-against-Docker discipline caught a real bug before it ever
reached a commit. My first cut of the body-size guard called
`req.destroy()` the moment a request exceeded the cap, then tried to write a
413 response &mdash; but destroying the request's socket closes the
connection in both directions, so the response never reached the client;
`fetch` saw a bare connection reset instead of a 413. The regression test now
in `d417b24`
("rejects a body larger than the server's own cap") caught it immediately on
the first `pnpm test` run against the container. The fix
(`src/server.ts`) writes and ends the 413 response first, and only destroys
the socket afterwards. This is the shape of correction the brief asks for: a
real mistake, caught by a check written for a different reason (verifying the
cap exists at all), fixed in the code the check now guards &mdash; not a
retry until the suite went green.

The same discipline, applied to the front end rather than the server: once
every server-side boundary-validation and response-header check I could find
had come back clean, I asked what `fly.toml`'s own `auto_stop_machines`
setting implies for a real visitor &mdash; the one machine stops when idle
and starts on the next request, so a cold start (or any dropped connection)
is a genuine way for `app.js`'s `fetch` calls to reject, not just answer with
a bad status. Neither `load()` nor the submit handler checked for that;
confirmed live by routing `/api/marks` to abort mid-request
([`f1704db`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/f1704db)):
an unhandled promise rejection in the console, and the status text stuck at
"adding your mark&hellip;" forever. Fixed with a `try`/`catch` around each
fetch, so a dropped connection degrades to a visible, honest message instead
of a silent hang.

A later pass asked a question none of the field-level validation above
covers: not what a direct request can put *in* the body, but what request
can reach the handler at all. The server never checked where a POST came
from, so I built a tiny page on a different local origin &mdash; a hidden,
auto-submitting `<form enctype="text/plain">`, the standard technique for
smuggling raw JSON past a server that (like this one) never checks the
`Content-Type` header &mdash; and confirmed live that visiting it silently
added a real row to the scroll, no click or confirmation involved. Into a
store with no edit or delete path, that is not a cosmetic gap: any visitor
who merely loaded an unrelated malicious page could have their browser
vandalise the scroll on their behalf, permanently. Fixed by checking every
POST's `Origin` header against its own `Host` &mdash; browsers set `Origin`
on every unsafe-method request and never let page script override it, so
this is the same defence Astro's own framework gave crit 7's project for
free; here, with no framework underneath, it had to be written by hand. Ran
the exact same attack page against the patched server afterward and
confirmed it no longer lands a row, while the real form still works.

## What's next

Crit 9 is where real-time and a documented decision about several people
acting at once are due; crit 10 adds server-side logging. Both build on what
this crit ships rather than replace it: the schema, the validation, and the
append-only argument in this README are the foundation, not a placeholder to
be rewritten away. What I expect to revisit hardest by crit 9 is the
no-rate-limit choice &mdash; fine for a handful of known visitors, and the
first thing worth re-arguing once the scroll has to hold up with several
people adding strokes in the same few seconds.
