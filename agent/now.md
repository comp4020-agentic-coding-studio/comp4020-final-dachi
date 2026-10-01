# Hand-off --- crit 8 (final project, "It's alive!"), seventh run

## State

119.5h to cutoff at prompt time, still crit 8's own window (brief re-fetched,
unchanged). The sixth run's hand-off left one open question --- whether GET
`/api/marks` needs any Origin gating --- and otherwise said to keep re-reading
`src/*.ts`/`public/app.js` fresh each run.

Settled the GET question by reasoning, no code change: it's read-only,
already-public data (the whole point of the scroll is that every visitor sees
every stroke), and browsers already block cross-origin JS from reading the
response body without CORS headers this server never sends --- so there's
nothing an Origin check on a GET would protect that isn't already protected,
and no state-changing side effect to gate in the first place. Not worth its
own commit.

Did a full fresh read of every source file (`server.ts`, `db.ts`, `marks.ts`,
`readme.ts`, `app.js`, `style.css`, `index.html`, both spec files, Dockerfile,
fly.toml, PROCESS.md) and found the boundary-validation/a11y/CSS lenses this
project has already run dry on genuinely dry again --- but one new question
hadn't been asked: does the existing body-size guard handle a client that
*vanishes mid-upload* (a raw TCP reset), not just a complete request that's
simply too large? The existing regression test only ever sends a complete
over-cap body. Tested live with a raw `node:net` socket sending a partial
body then `resetAndDestroy()`: confirmed clean (`req.on("error", reject)`
already covers this), so no source change, just a new regression test
closing the coverage gap
([`67e28e7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/67e28e7),
cited in PROCESS.md at
[`ec23d03`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/ec23d03)).

Worth flagging for future self: the first attempt at this test looked like a
genuine crash (server unreachable, no error logged) --- that was a tooling
artefact (a shell-backgrounded server doesn't survive into a later, separate
Bash tool call), not a real bug. Re-ran with the Bash tool's own
`run_in_background: true`, which the harness does track across calls, and
got the true (clean) result. Logged in global `MEMORY.md` under Environment
so it doesn't get re-discovered the hard way next time a live multi-call
server test is needed.

Verified against the real Docker image (`docker build` + `docker run
--tmpfs /data`, matching `checks.yml`): `pnpm check` (14 tests, was 13) and
`pnpm check:evidence` both green. Deployed
(`flyctl deploy --remote-only --ha=false -a comp4020-final-dachi`) and
verified live: `/`, `/readme/`, `/api/marks` all 200, cross-site POST still
403. No live write this run, so nothing needed cleaning up in production ---
the scroll still holds just "the first hand." Pushed both commits.

## Next action

Seven runs deep, six distinct real findings (cookie decode, cookie shape,
response-header hardening, front-end fetch-rejection handling, cross-site
POST, and now a confirmed-clean coverage gap closed) plus one settled
non-issue (GET gating). The sensor well is genuinely thinning: this run's
real find came from asking a narrower question about an *already-fixed*
area (the body-size guard) rather than a new area entirely. If a fresh
source read goes quiet next run too, 119.5h is still comfortably
plan/build/deepen territory (not finish), so look two directions: (1)
anything the brief's own "what good means" README commitments imply but
`spec/` doesn't yet check directly, re-read against the actual current
`README.md`/`CLAUDE.md` text rather than assumed from memory; (2) if the
prompt is ever crit 9 ("All at once"), `PROCESS.md`'s "what's next" already
names the no-rate-limit choice as the first thing to re-argue, and
real-time/several-people-at-once is the new work that crit actually asks
for --- don't start that early while still inside crit 8's own window.
