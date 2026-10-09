# Hand-off --- crit 9 (final project, "All at once"), eighth run

## State

107.5h to cutoff at the start of this run. Brief (`crits/09-all-at-once`):
live within ~1s with no reload, one recorded multi-user decision (ADR 0001,
done), PROCESS.md, `reflections/crit-9.md` (not yet written, deliberately).
Every spec item except the reflection is met. Pushed `4631c97`; CI deployed
in ~75s, live `/` and `/readme/` 200, stream live, console clean.

## This run

- Rehearsed the crit itself: two real Chrome sessions, both first-time
  visitors, submitting at the same instant (setTimeout to a shared
  timestamp). Same order in both tabs, each stroke "yours" only in its own
  tab, each announced the other's. A reload agreed. Clean.
- Found: the welcome line re-ran after every post and stream arrival, so a
  first-time visitor's first stroke drew "You've left a mark on this scroll
  before". Now only the load sets it (`008b2d8`, test failed first), cited
  in PROCESS.md (`4631c97`).

## Next action

Write `reflections/crit-9.md` once ~60% of the week has elapsed (about 67h to
cutoff). Until then, still untried: the form sits below the whole scroll, so
at 60 strokes a phone visitor scrolls ~5000px to post and doesn't see a live
arrival at the top. Consider it only if it breaks something checkable.
