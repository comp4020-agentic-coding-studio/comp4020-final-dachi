# Hand-off --- crit 8 (final project, "It's alive!"), eighth run

## State

112.5h to cutoff at prompt time, still crit 8's own window (brief re-fetched,
unchanged). Seven runs deep already with six real findings plus one settled
non-issue (GET gating); the prior hand-off flagged the sensor well as
"genuinely thinning" and suggested either a narrower question about an
already-fixed area, or re-reading the brief's own commitments against
`spec/`.

Did a full fresh read of every source file again (`server.ts`, `db.ts`,
`marks.ts`, `readme.ts`, `app.js`, `index.html`, both spec files, Dockerfile,
fly.toml) and found a genuinely new gap: the server had no defence at all
against being framed. The existing `isSameOrigin` check (crit 8's fourth
finding) guards against a *forged* request; it does nothing against a
*genuine* one a real visitor was tricked into making, by a cross-origin page
overlaying its own UI on top of an iframe of the real app (clickjacking).
Confirmed live before touching source: built a throwaway attacker page on a
second local origin (`python3 -m http.server`), iframed `http://localhost:8080/`
in it, and screenshotted via `agent-browser` --- the real app rendered in
full inside the frame, no frame-busting of any kind. Into a store with no
edit or delete path, a visitor tricked into clicking "Add to the scroll"
leaves a permanent, unwanted stroke under their own real `hand` cookie ---
exactly as serious as the forged-origin gap it sits beside.

Fixed with `X-Frame-Options: DENY` and `Content-Security-Policy:
frame-ancestors 'none'` set once at the top of the request handler in
`src/server.ts`, covering every response (static files, `/readme/`, both
`/api/marks` methods, the 404 fallback) rather than threading it through
each individual `writeHead` call. Added a regression test checking both
headers on `/`, `/readme/`, and `/api/marks`
([`70cc828`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/70cc828),
cited in `PROCESS.md` at
[`fd01e3b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/fd01e3b)).
Re-ran the exact same attacker-page screenshot after the fix: the frame now
renders as a broken image, confirming the block is real, not just a header
read back by `curl`.

Verified against the real Docker image (`docker build` + `docker run
--tmpfs /data`, matching `checks.yml`): `pnpm check` (15 tests, was 14) and
`pnpm check:evidence` both green. Deployed
(`flyctl deploy --remote-only --ha=false -a comp4020-final-dachi`) and
verified live: headers present on the real response, `/`, `/readme/`,
`/api/marks` all 200, scroll still holds only "the first hand" (no live
write this run, nothing to clean up). Pushed both commits.

## Next action

Eight runs deep, seven distinct real findings now. This run's find came from
the same "what can a genuine visitor be tricked into doing, not just what
can a forged request send" shift in question shape that the front-end
fetch-rejection and cross-site-POST findings both already used --- worth
remembering that *that* reframing (not a new area of the codebase) is what
unstuck the well this time, in case a future run needs the same move again.
112.5h is comfortably plan/build/deepen territory still. If a fresh source
read goes quiet next run, look at: (1) the brief's own "what good means"
README commitments against `spec/` again, re-read from the actual current
text; (2) whether any other response-side hardening in the same family as
this run's (clickjacking) and the cookie-flags run before it remains ---
e.g. `Referrer-Policy`, `X-Content-Type-Options: nosniff` on the static
JS/CSS responses, worth a deliberate look next run rather than assuming the
header-hardening vein is exhausted after two findings in it. Don't start
crit 9/10 work (real-time, rate-limiting, logging) while still inside crit
8's own window --- the prompt will say when that crit is current.
