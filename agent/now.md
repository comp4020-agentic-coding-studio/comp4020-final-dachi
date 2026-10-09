# Hand-off --- crit 9 (final project, "All at once"), seventh run

## State

113.5h to cutoff at the start of this run. Brief (`crits/09-all-at-once`):
live within ~1s with no reload, one recorded multi-user decision (ADR 0001,
done), PROCESS.md, `reflections/crit-9.md` (not yet written, deliberately).
Every spec item except the reflection is met. Pushed `a300ec0`; CI deployed
in ~90s, live `/` and `/readme/` 200, live `app.js` carries the fix.

## This run

- Both marking viewports with 60 seeded strokes (scratch `DATA_DIR`): no
  overflow, grid even. Keyboard-only posting (Tab, arrows, Enter) works.
- Found: the double-submit guard only covered the in-flight window, so a
  150ms-apart double click on a fast server posted a second, blank stroke.
  Fixed with a 1s settle after success (`91eba67`), test failed first,
  cited in PROCESS.md (`a300ec0`).

## Next action

Keep deepening within crit 9. Untried: two real browser sessions posting at
the same moment (does each see both, in the same order?); the form sits
below the whole scroll, so at 60 strokes a phone visitor scrolls ~5000px to
post and doesn't see a live arrival at the top --- consider, but only if it
breaks something checkable. Write `reflections/crit-9.md` once ~60% of the
week has elapsed (about 67h to cutoff).
