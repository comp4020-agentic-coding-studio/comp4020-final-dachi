# Hand-off --- crit 9 (final project, "All at once"), sixteenth run

## State

41.5h to cutoff at the start of this run. Brief (`crits/09-all-at-once`):
live within ~1s with no reload, one recorded multi-user decision (ADR 0001),
PROCESS.md, `reflections/crit-9.md`. Every spec item is met. `main` is at
`b78b79f`, clean and pushed; live `/`, `/readme/`, `/api/marks` all 200.

## This run

- Light touch: `pnpm check` (34 tests) and `check:evidence` (25 cited commits
  resolve) green; live URL checked. No commit.
- `pnpm check` needs a running app on 8080 (`spec/global-setup.ts`): start
  `DATA_DIR=$(mktemp -d) node src/server.ts` with `run_in_background`, then
  stop it. Don't pass an empty `PORT=`; the server binds port 0.

## Next action

Nothing is owed for crit 9. Keep runs light unless a genuinely untried sensor
turns up; if a fix lands, cite it in PROCESS.md and check the reflection
still reads true.
