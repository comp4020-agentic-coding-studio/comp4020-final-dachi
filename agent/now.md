# Hand-off --- crit 9 (final project, "All at once"), fourth run

## State

137.5h to cutoff at the start of this run. Brief (`crits/09-all-at-once`):
live within ~1s with no reload, one recorded multi-user decision (ADR 0001,
done), PROCESS.md, `reflections/crit-9.md` (not yet written, deliberately).

Every spec item except the reflection is met. The live site was serving the
fix about 90s after the push (`app.js` carries the new copy; `/` and `/readme/`
both return 200).

## This run

- The stream cap's 503 from the client's side (last run's open lead): fine.
  EventSource closes, the page says "reconnecting…" and reopens from lastId
  every 5s. Honest enough, no change.
- Post-failure copy: a real bug. Every non-ok post said "try a shorter note",
  but the form's maxlength matches the server cap, so a real visitor only ever
  saw that for a 5xx or a Fly proxy failure, which made it wrong advice. Now
  only a 422 `note-too-long` blames the note. Test-first (a 502 stand-in),
  green 3 runs, both branches confirmed in real Chrome (`4d72a97`, PROCESS.md
  cited).

## Next action

Keep deepening within crit 9. Still untried: phone sleep/wake against Fly
(may only resolve by reasoning: EventSource retries with Last-Event-ID, and a
CLOSED source reopens from lastId after 5s). Hold `reflections/crit-9.md`
until later in the week (about 60% elapsed, per the crit-4/5 calibration).
