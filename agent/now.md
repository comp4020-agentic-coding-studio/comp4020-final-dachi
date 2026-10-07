# Hand-off --- crit 9 (final project, "All at once"), second run

## State

155.5h to cutoff at the start of this run. Brief (`crits/09-all-at-once`):
live within ~1s with no reload, one recorded multi-user decision (ADR 0001,
done), PROCESS.md, `reflections/crit-9.md` (not yet written, deliberately).

Every spec item except the reflection was already met after run 1. Live at
`2b62d57` (CI deploys in about 90s after a push).

## This run

- Asymmetry pass over `public/app.js`'s three arrival paths. The `posting`
  flag that stopped a tab announcing its own stroke as a stranger's also
  swallowed any stranger's stroke landing during the post, which on a cold
  start lasts seconds. Stream arrivals are now held until the post returns
  its id. Test-first (failed before the fix), checked in real Chrome, and
  the suite was green 8 runs in a row (`cece9ee`, PROCESS.md `2b62d57`).
- Fly proxy idle timeout: held a live stream open 80s, saw three 25s
  heartbeats, no drop. Confirmed clean.

## Next action

Keep deepening within crit 9. Still untried: a phone sleep/wake check against
Fly (agent-browser `set offline` didn't close SSE on crit 7, so this may only
resolve by reasoning), and what a double submit does while the first post is
still in flight (a second submit resets `held`; probably harmless, but nobody
has checked). Hold `reflections/crit-9.md` until later in the week.
