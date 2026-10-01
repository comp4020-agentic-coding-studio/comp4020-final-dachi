# Hand-off --- crit 8 (final project, "It's alive!"), fifth run

## State

136.5h to cutoff at prompt time, still crit 8's own window (brief re-fetched,
unchanged). The fourth run's hand-off said four sensor lenses (request-side
boundary validation, three runs; response-header hardening, one run) had each
gone dry, and the next run should re-read the source fresh before falling
back to a repeat a11y/keyboard/reflow pass.

Did that fresh read and found a fifth: neither `load()` nor the submit
handler in `public/app.js` had any failure path for a `fetch` that *rejects*
(network drop, not just a bad HTTP status) --- and `fly.toml`'s own
`auto_stop_machines = "stop"` / `min_machines_running = 0` makes a cold start
a real, not hypothetical, way for that to happen to an actual visitor.
Confirmed live (`agent-browser network route "**/api/marks" --abort`, a real
`addEventListener('unhandledrejection', ...)` listener): an unhandled
rejection in the console, and the status text stuck at "adding your mark…"
forever on the submit path; the scroll silently never populated on the load
path. Fixed with a `try`/`catch` around each fetch call, degrading to a
visible, honest message instead of a silent hang ---
[`f1704db`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/f1704db).
Verified against the real Docker image (`sudo -n docker build`/`run`, 11/11
`pnpm check` against the container), re-confirmed the fix live with
`agent-browser` both before and after, pushed, redeployed, and confirmed the
live `app.js` serves the fixed text (`curl`, no live form submission needed
since this was a pure client-side JS fix --- nothing new landed in the
permanent scroll this run). Cited in `PROCESS.md`
([`a2860a7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/a2860a7)).

## Next action

Five sensor lenses deep now (request-side validation ×3, response headers
×1, front-end network-failure handling ×1). `public/app.js` changed this
run for the first time since the second run's a11y/keyboard/reflow sweep ---
worth a quick re-verify of that sweep next run specifically because the file
changed, not as a blind repeat. Re-read `src/*.ts` and `public/app.js` fresh
first regardless; this is still a genuinely small codebase (~900 lines) and
each of the last three runs found exactly one real thing by reading it again
with a new question, not by re-running an old one. If a repeat source read
and the a11y/keyboard/reflow sweep both come back clean, that's a legitimate
point to stop inventing new lenses for a while --- 136.5h is still >24h out,
so the job is still plan/build/deepen, not finish, but "deepen" doesn't mean
force a sixth lens where none occurs after a genuine fresh look. If the
prompt is ever crit 9 ("All at once"), `PROCESS.md`'s "what's next" already
names the no-rate-limit choice as the first thing to re-argue.
