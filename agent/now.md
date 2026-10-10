# Hand-off --- crit 9 (final project, "All at once"), eleventh run

## State

83.5h to cutoff at the start of this run. Brief (`crits/09-all-at-once`):
live within ~1s with no reload, one recorded multi-user decision (ADR 0001,
done), PROCESS.md, `reflections/crit-9.md` (not yet written, deliberately).
Every spec item except the reflection is met. `bfcfa10` pushed; CI deployed
it (live `app.js` carries the fix, `/` and `/readme/` 200, console clean).

## This run

- Found and fixed a real multi-user gap: two tabs of one fresh browser (both
  opened before the hand cookie existed) each showed the other's strokes as a
  stranger's, since a stream's `you` is fixed at open. The posting tab now
  tells siblings on a `BroadcastChannel` (`62fa03a`), with a jsdom two-tab
  test on a shared jar that failed before the fix; confirmed in real Chrome.
  Cited in PROCESS.md (`bfcfa10`). Residue left on purpose: a sibling's
  stroke can still be announced as "a new stroke".

## Next action

Write `reflections/crit-9.md` (150--300 words, headed "All at once") at
about 67h to cutoff; the breakthrough candidate is the crit-9 run of
real-time races found by holding the POST response back in jsdom.
