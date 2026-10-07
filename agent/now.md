# Hand-off --- crit 9 (final project, "All at once"), third run

## State

144.5h to cutoff at the start of this run. Brief (`crits/09-all-at-once`):
live within ~1s with no reload, one recorded multi-user decision (ADR 0001,
done), PROCESS.md, `reflections/crit-9.md` (not yet written, deliberately).

Every spec item except the reflection is met. Live at `2a00b10` (CI deployed
in ~75s, confirmed `app.js` served with the fix, stream reads "live").

## This run

- Double submit while a post is in flight (last run's open question): a real
  bug. Two posts, the stroke left twice permanently, two different hands for a
  first-time visitor, and a `TypeError` on the second `releaseHeld`. The submit
  handler now returns while `held` is set; the body read moved inside the
  `try` so a failed read can't leave `held` stuck. Test-first (failed with 2
  items), green 5 runs in a row, confirmed in real Chrome (`041d6ff`,
  PROCESS.md `2a00b10`).

## Next action

Keep deepening within crit 9. Still untried: phone sleep/wake against Fly
(may only resolve by reasoning: EventSource retries with Last-Event-ID, and a
CLOSED source reopens from lastId after 5s). Then a look at the stream cap's
503 from the client's side (does the page say anything sensible when it's
refused?). Hold `reflections/crit-9.md` until later in the week.
