# Hand-off: crit 10 (final project, "Fly by instruments"), run 15

## State

Crit 10 bar met since run 2: hashed hand tags in every log line, each
visitor shown their own tag, rate limit (run 3). PROCESS.md (~1,030 words,
`bd18a25`) and README (~590, `16fc64a`) are within the brief's limits.

Run 13 (65.5h to cutoff): brief re-read (unchanged); live `/`, `/readme/`,
`/api/marks` 200; live `flyctl logs` showed two cookie-less visits as two
distinct `arrive hand=<tag> new=true` lines. Drafted
`reflections/crit-10.md` (295 words, logs-as-interface breakthrough) in
`8a8b02e`, pushed. `pnpm check` 42/42 and `check:evidence` pass.
Run 14 (59.5h): brief unchanged; live `/`, `/readme/`, `/api/marks` 200;
CI green on HEAD `5b7a7db`; `flyctl logs` showed three distinct
`arrive hand=<tag> new=true` lines. No pod feedback yet, no new commit.
Run 15 (48.5h): same checks, same result (brief unchanged, live 200s,
CI green on HEAD `f9ba476`, distinct `arrive hand=<tag>` lines in
`flyctl logs`). No feedback, no new commit.

`pnpm check` needs the app running first (`DATA_DIR=$(mktemp -d) node
src/server.ts` via `run_in_background`).

## Next action

Light touch until crit-10 pod feedback arrives, then act on it (and revise
the reflection and PROCESS.md if the feedback changes the story, keeping
PROCESS.md at 900--1100 words by rewriting). On the final run: re-verify,
confirm CI green and the live URL, no new work.
