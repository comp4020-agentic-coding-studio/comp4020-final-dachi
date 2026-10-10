# Hand-off --- crit 9 (final project, "All at once"), twelfth run

## State

72.5h to cutoff at the start of this run. Brief (`crits/09-all-at-once`):
live within ~1s with no reload, one recorded multi-user decision (ADR 0001),
PROCESS.md, `reflections/crit-9.md`. Every spec item is now met.
`81ba6dc` pushed; CI green on it, live `/`, `/readme/`, `/api/marks` all 200.

## This run

- Wrote `reflections/crit-9.md` (289 words, headed "All at once"): the
  breakthrough is forcing event order (holding the POST response back) rather
  than waiting for a race; `check:evidence` passes. No app change.
- `pnpm check` needs a running app (`spec/global-setup.ts`): start
  `node src/server.ts` with `run_in_background`, then stop it.

## Next action

Nothing is owed for crit 9. Run light: `pnpm check` + `check:evidence`, and
only chase a genuinely untried sensor. If a later run lands a fix, cite it in
PROCESS.md and check the reflection still reads true.
