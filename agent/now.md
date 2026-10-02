# Hand-off --- crit 8 (final project, "It's alive!"), tenth run

## State

95.5h to cutoff at prompt time, still crit 8's own window (brief re-fetched,
unchanged). The ninth hand-off had closed the header-hardening vein and
suggested one remaining untried lens: re-read the README's own "what good
means"/"Enforced, in `spec/`" claims against the actual `spec/` tests one
more time, rather than assume the sensor well had gone fully dry.

That lens paid off. README.md lists, under "Enforced, in `spec/`," that "a
returning hand's past strokes are still in the response after a fresh server
restart" --- but grepping every spec file and `global-setup.ts` confirmed no
test ever restarts the server process; the existing "remembers a hand across
requests" test only makes two HTTP calls to the one already-running app the
whole `pnpm check` run shares. The claim was real (SQLite on a Fly volume
genuinely does persist across restarts) but untested, the same "claim vs.
what's actually checked" gap this project has caught in itself before (the
`spec:` frontmatter and `related:` dedup gaps on `comp4020-ass2-dachi`).

Fixed with a new `spec/persistence.test.ts`
([`5987420`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/5987420)):
spawns two short-lived `node src/server.ts` child processes against an
isolated `DATA_DIR` (mirroring the Fly-volume path `src/db.ts` already
supports via that env var), posts a stroke against the first, kills it,
starts a second against the *same* data dir, and confirms the stroke and the
hand are both still recognised. Verified the test is a real sensor, not a
vacuous pass, by hand-running the identical two-process sequence with the
second instance pointed at a *different* temp dir instead: the stroke
correctly vanished, proving the assertion would catch the regression it
exists to catch. Cited in `PROCESS.md`
([`7823d0c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/7823d0c)).

Verified against the real Docker image (`docker build` + `docker run --tmpfs
/data`, matching `checks.yml` exactly): `pnpm check` now 17 tests (was 16),
all green; `pnpm check:evidence` green. Deployed
(`flyctl deploy --remote-only --ha=false -a comp4020-final-dachi`) and
confirmed `/`, `/readme/`, `/api/marks` all live and correct --- the scroll
still holds only "the first hand," no live write needed this run. Pushed
both commits.

## Next action

Ten runs deep, nine distinct real findings (eight security/robustness fixes
plus this run's test-coverage-vs-claim gap). The specific technique this run
used --- reading every "Enforced, in spec/" or "What a change must not
break" bullet in README.md/CLAUDE.md against the actual test file contents,
not just trusting a green `pnpm check` --- is worth repeating once more next
run before assuming it's exhausted, since it only got applied to one claim
(the restart one) rather than every claim in those two files. The other
README/CLAUDE.md claims (colour whitelist, 140-char cap, no-account identity,
cross-site-write rejection, colour-isn't-the-only-signal) already each have
a direct, named test --- checked this run, not just assumed --- so the
remaining open question is really just "did I miss any other claim," not
"redo the whole check from scratch."

95.5h is still comfortably plan/build/deepen territory (prompt hasn't called
this crit's final run). Still don't start crit 9/10 work (real-time,
rate-limiting, logging) while inside crit 8's own window --- the prompt will
say when that crit is current.
