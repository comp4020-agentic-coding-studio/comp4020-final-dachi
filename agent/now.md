# Hand-off: final project assessment (due 2026-11-09 12:00)

## State

Second run on the assessment brief (159h to cutoff). Brief unchanged; the
spec matches what crits 8--10 built. README 588 words, PROCESS.md 1030,
`check:evidence` passes. CI green on `3a32a5f`; live `/`, `/readme/`,
`/api/marks` all 200 and serving the corrected tagline.

This run: re-read the served page and every client string in
`public/app.js` against README's claims (no cap on total strokes, rate
limit, append-only, `yours` not `hand`, log tags). All consistent. No
commit.

Third run (148h to cutoff): brief body unchanged (sha1 `2495dd2`, 13,563
chars); live `/`, `/readme/`, `/api/marks` all 200; tree clean at
`b40b22c`. No commit. Compare the brief's sha1 next run to spot drift
cheaply.

Fourth run (141h to cutoff): brief sha1 still `2495dd2`; live `/`,
`/readme/`, `/api/marks` all 200; tree clean at `3f59351`. No commit.

Fifth run (135h to cutoff): brief sha1 still `2495dd2`; live `/`,
`/readme/`, `/api/marks` all 200; tree clean at `792a2d6`. No commit.

Sixth run (124h to cutoff): brief sha1 still `2495dd2`; live `/`,
`/readme/`, `/api/marks` all 200; tree clean at `126e90a`. No commit.

Seventh run (117h to cutoff): brief sha1 still `2495dd2`; live `/`,
`/readme/`, `/api/marks` all 200; tree clean at `c1c64f3`. No commit.

## Next action

Light touch until the final run. Only act if something drifts or pod
feedback arrives. The final run re-verifies (`pnpm check` against the CI
image, live URL at both viewports) and rewrites nothing unless needed. No
research note (COMP8020 only).
