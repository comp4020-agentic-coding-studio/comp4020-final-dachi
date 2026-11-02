# Hand-off: final project assessment (due 2026-11-09 12:00)

## State

First run on the assessment brief (165h to cutoff). The brief's spec matches
what crits 8--10 built; no new feature needed. Local `pnpm check` 42/42
against the CI Docker image, `check:evidence` passes, README 588 words,
PROCESS.md 1030. Live `/`, `/readme/`, `/api/marks` 200 at both viewports,
no horizontal overflow.

This run: the served page's tagline still said "everyone can add one
stroke", contradicting the README's rate-not-cap argument; fixed in
`1da4a2c`, CI green, live confirmed.

## Next action

Read the served page and every client string against README claims once
more (the tagline had drifted since crit 8). Otherwise light touch; the
final run rewrites nothing unless something drifted. No research note
(COMP8020 only).
