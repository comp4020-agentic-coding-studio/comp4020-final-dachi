# Hand-off --- crit 8 (final project, "It's alive!"), first run

## State

167.5h to cutoff at prompt time; this is week 9 of the 12-week final-project
arc (crits 8, 9, 10, then submission), a brand-new deliverable
(`comp4020-final-dachi`) with only the template's initial commit when this
run started.

Fetched both the crit-8 source and the full final-project brief (the crit
body's "Related" points at it). Read the repo's fixed harness comments
(`fly.toml`, `Dockerfile`, `spec/README.md`, `CLAUDE.md`'s own empty
starting note) rather than guessing at what they fix.

Concept: **Long Scroll** --- a single shared, append-only scroll. Any visitor
(an anonymous per-browser `hand` cookie, no account) can add one stroke: a
colour from a fixed six-ink palette, plus an optional 140-character note.
Nothing is ever edited or deleted. Chosen from the brief's own "small is
fine" / "design for co-presence" framing, and honestly, from this agent's
own naming (a long scroll that survives, imperfectly, across hands and
time).

Built and shipped this run:

- Backend: plain `node:http` (no framework), `node:sqlite` for persistence
  (built into Node 24, no native module to compile --- deliberate stack
  choice, argued in `PROCESS.md`). One table, no accounts.
- Front end: vanilla HTML/CSS/JS, no build step. Colour is always
  decorative; note, timestamp and a `— yours` suffix are the text
  equivalent for every visual signal.
- `spec/marks.test.ts`: server-side validation (colour must be in the
  palette, note capped at 140 chars, request body capped at 8KB) checked
  against a request that skips the form entirely, plus a persistence-
  across-requests check and a malformed-body-doesn't-crash-the-process
  check.
- `README.md` (598 words), `CLAUDE.md`, `PROCESS.md` (1002 words),
  `reflections/crit-8.md` (297 words) --- all first versions, all citing
  real commits.
- `placeholder/` removed (Dockerfile now builds the real app).

Verified before shipping: `pnpm check` (typecheck + vitest, 9/9 passing)
against the exact CI-built Docker image (`docker build` + the same
`docker run --tmpfs /data` line `checks.yml` uses, not just a local
`node --watch`); a real persistence check (bind-mounted `/data`, not
`--tmpfs`) confirming the SQLite file survives a container restart, not
just a page reload; a real-browser walkthrough (`agent-browser`, both
marking viewports, keyboard tab order, a clean `agent-browser a11y` sweep,
0 violations/0 incomplete on both `/` and `/readme/`) locally, then again
against the deployed `https://comp4020-final-dachi.fly.dev/` after
`flyctl deploy --remote-only --ha=false` (first deploy for this app, no
prior image). Left one real, permanent "first hand" stroke on the live
deployed scroll via the actual form (not a raw API call) as both the live
proof-of-life demo and an honest founding mark, not throwaway test data ---
the app has no delete path, so anything added live is there for good; chose
to make it something worth leaving rather than avoid the live check
entirely.

A real bug caught before it ever reached a commit: the first cut of the
body-size guard called `req.destroy()` before writing the 413 response,
which closes the socket in both directions and drops the response along
with it. `pnpm test`'s new size-cap regression test caught this immediately
against the real container; fixed by writing and ending the response first,
destroying the socket only afterwards. Worth noting as a specific
`node:http` gotcha, distinct from anything in the Astro/framework-adapter
lessons logged for crit 7: a hand-rolled server has no framework layer to
get this right by default, so it's on the app code, not something to assume
is handled.

Six commits, all pushed to `origin/main` (repo is still private; nothing
public yet, expected, per the crit's own "goes public at this week's
cutoff"). No fly.io CI deploy yet either, for the same reason (`checks.yml`
gates on `!github.event.repository.private`); this run's deploy was by hand,
per doctrine step 7.

## Next action

Crit 9 ("All at once") is where real-time and a documented decision about
several people acting at once are due; crit 10 ("Fly by instruments") adds
server-side logging. Both are explicitly deferred, not forgotten --- the
scroll's schema and validation are meant to be the foundation those build on,
not a placeholder. Before adding real-time (SSE is the natural fit here,
matching prior crit experience), re-read this repo's own `PROCESS.md` for
the no-rate-limit call, flagged there as the first thing worth re-arguing
once several hands can add strokes within the same few seconds.
