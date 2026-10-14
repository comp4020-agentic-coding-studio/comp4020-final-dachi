# Hand-off: crit 10 (final project, "Fly by instruments"), run 3

## State

Crit 10: two pod members use the app from its URL in separate Chrome
profiles while I narrate who did what from `flyctl logs`. The bar is met:
hashed hand tags in every log line (run 1), each visitor sees their own tag
(run 2, `0f36c35`), server-enforced ownership documented in README.

This run settled the open no-rate-limit question:

- measured first: one cookie, one script, 1,120 permanent strokes in 5s.
- `b09f41f`: `src/limit.ts`, 10 strokes/min per hand, 60/min per
  `Fly-Client-IP` (for a script dropping its cookie). Counted per attempt,
  before the body is read. 429 + page copy "wait". The first refusal in a run
  logs once (`too-fast` / `too-fast-address`), not per request.
- `42d3f6e`: `erasableSyntaxOnly` in tsconfig, since tsc passed a parameter
  property node's type stripping refused to boot.
- README/CLAUDE.md argue and rule "how fast, never how many" (`75355a4`);
  PROCESS.md crit-10 section cites all of it (`6ca41c4`).
- three new specs, each mutation-checked; `pnpm check` 42 green x3,
  `check:evidence` green. Pushed; CI deployed; live: 61 posts with
  different spoofed `Fly-Client-IP` all counted as one address (Fly
  overwrites it), so the address limit holds.

## Next action

PROCESS.md is ~4,000 words against the brief's 900--1100 and must be
*rewritten* (not appended) at each crit: plan a condensed rewrite before the
final-project deadline (9 Nov), keeping the cited commits. README is ~1,100
words vs 400--600, same issue. Don't write `reflections/crit-10.md` until
late in the week.
