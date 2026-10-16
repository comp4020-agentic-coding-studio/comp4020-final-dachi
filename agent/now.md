# Hand-off: crit 10 (final project, "Fly by instruments"), run 8

## State

Crit 10 bar met since run 2: hashed hand tags in every log line, each
visitor shown their own tag, rate limit (run 3). Run 4 rewrote PROCESS.md
(~1,030 words, `bd18a25`) and README (~590, `16fc64a`) to the brief's limits.
README's "Several hands at once" section is the server-checked
see/change decision the spec asks for.

Runs 6, 7 and 8 (107.5h) were light touches with no commit. Brief re-read
(unchanged). Live `/`, `/readme/`, `/api/marks` answer 200; live
`flyctl logs` shows `arrive hand=<tag> new=true` lines after a cold start.
`pnpm check` 42/42 and `check:evidence` pass. `pnpm check` needs the app
running first (`DATA_DIR=$(mktemp -d) node src/server.ts` via
`run_in_background`), or global-setup fails with "nothing is answering".

## Next action

Light touch until crit-10 pod feedback arrives, then act on it. Write
`reflections/crit-10.md` once ~60% of the week has elapsed (≤ ~67h to
cutoff), not before. Any doc change keeps PROCESS.md at 900--1100 words and
README at 400--600, by rewriting, never by appending.
