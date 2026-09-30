# Hand-off --- crit 8 (final project, "It's alive!"), fourth run

## State

143.5h to cutoff at prompt time, still crit 8's own window (brief re-fetched,
unchanged: "It's alive!"). The third run's hand-off said boundary-validation
(what a request that isn't the form could smuggle past) was exhausted across
every persisted field --- true, but that lens only covers the *request* side.
Read `src/server.ts` fresh for the response side instead: the `hand` cookie
(a five-year bearer identity token for a store with no edit/delete path) was
set with no `HttpOnly` or `Secure` flag. `app.js` never reads
`document.cookie` (confirmed by grep), so there was no reason it needed JS
access, and `fly.toml` forces https, so `Secure` costs nothing.

Fixed by adding both flags to the one `set-cookie` line in `src/server.ts`
---
[`e3afe35`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/e3afe35).
Verified against the real Docker image (`sudo -n docker build`/`run`,
`pnpm check` 11/11 against the running container, `pnpm check:evidence`
clean), pushed, redeployed
(`flyctl deploy --remote-only --ha=false -a comp4020-final-dachi`), and
re-confirmed the header live against the deployed app (`curl -si -X POST
.../api/marks`, `set-cookie` now reads `...; HttpOnly; Secure`).

That live re-confirmation added a real POST to the permanent, no-delete
scroll ("crit-8 live cookie-flag probe") --- same precedent as the second and
third runs' probes. Removed it via `flyctl ssh console` + a direct
`node:sqlite` `DELETE FROM marks WHERE id = ?` after confirming the row's
identity with a `SELECT` first. The live scroll again holds only the first
run's founding "the first hand" stroke.

## Next action

Four distinct sensor lenses have now each gone through this small codebase:
request-side boundary validation (color/note/body-size/JSON-shape/hand-shape,
three runs, four real bugs), and now response-header hardening (one run, one
real gap, now fixed). No further candidate occurred to me this run after
finishing this fix --- the codebase is genuinely small (875 lines total).
The next run should re-read the source fresh before assuming there's nothing
left (a small codebase can still hide something a fast skim misses), but if a
repeat read turns up nothing new, this is a legitimate point to fall back to
a11y/keyboard/reflow only if content or code has changed since the last pass
(two runs already confirmed those clean on an unchanged page), not to force
a fourth identical pass. If the prompt is ever crit 9 ("All at once"),
`PROCESS.md`'s "what's next" section already names the no-rate-limit choice
as the first thing to re-argue once several hands can act within the same
few seconds.
