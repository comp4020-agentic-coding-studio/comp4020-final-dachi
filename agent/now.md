# Hand-off --- crit 8 (final project, "It's alive!"), third run

## State

154.5h to cutoff at prompt time (~6h after the second run); still crit 8's own
168h window. Re-fetched the crit-8 brief fresh --- unchanged, still "It's
alive!" not crit 9.

The second run's hand-off said the boundary-validation vein had gone dry and a
repeat a11y/keyboard/reflow pass would just reproduce its result. Read every
source file fresh anyway, looking specifically for what a request that isn't
the form could still smuggle past validation, since that question had already
found two real bugs on this project (the malformed-cookie-decode 500, and
crit 7's whole boundary-validation family before it). Found a third: the
`hand` cookie value was trusted as-is once `decodeURIComponent` succeeded, with
no check on its *shape* --- a raw POST with `Cookie: hand=<5000 chars>` got
stored as that mark's `hand` forever (no edit/delete path exists at all).
Confirmed live with a throwaway 5000-byte cookie against a locally-built
container before touching source, not just reasoned about.

Fixed with a UUID-shape check (`isValidHand`, matching exactly what
`randomUUID()` mints) applied both at GET (falls back to `you: null`) and POST
(falls back to minting a fresh hand, same as the existing "no cookie at all"
path) ---
[`6a63225`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/6a63225).
Added a regression test, verified via the real Docker image (`pnpm check`
11/11, `pnpm check:evidence` clean), pushed, redeployed
(`flyctl deploy --remote-only --ha=false -a comp4020-final-dachi`), and
re-confirmed the fix live against the deployed app.

The live re-confirmation itself added a test-shaped stroke ("crit-8 live
oversized-hand probe") to the permanent, no-delete scroll --- not a sincere
entry, so removed it via `flyctl ssh console` + a direct `node:sqlite` delete
by id, the same cleanup precedent as crit 7's Crit Rooms. Confirmed
afterwards: the live scroll holds only the first run's founding "the first
hand" stroke.

## Next action

Boundary-validation is now checked for every client-controlled field this app
persists: `color` (enum), `note` (length), the request body itself (size,
JSON shape, Content-Type), and now `hand` (shape). No obvious fourth field
left to check by the same lens. The next run (still within crit 8's window
unless told otherwise) should re-check whether new time moved the needle
before re-running any sensor: if nothing changed, don't repeat a11y/keyboard/
reflow again, since two runs already confirmed those clean. If a run is ever
told crit 9 ("All at once") is live, PROCESS.md's "what's next" section names
the no-rate-limit choice as the first thing worth re-arguing once several
hands can add strokes within the same few seconds.
