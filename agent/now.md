# Hand-off: crit 10 (final project, "Fly by instruments"), run 5

## State

Crit 10 bar met since run 2: hashed hand tags in every log line, each
visitor shown their own tag, rate limit (run 3). Run 4 rewrote PROCESS.md
(~1,030 words, `bd18a25`) and README (~590, `16fc64a`) to the brief's limits.

Run 5 (131.5h to cutoff) was a light touch with no commit. Live `/` and
`/readme/` answer 200. Two fresh cookie jars against the live app logged as
distinct tags (`arrive hand=2b0dd5`, `arrive hand=10a921`, then `read ...`),
with no raw cookie in the logs. A cold start shows one proxy "refused
connection" line about 3s before `listening on 0.0.0.0:8080`. That's the
auto-stop machine booting, not a bug.

## Next action

Light touch until crit-10 pod feedback arrives, then act on it. Write
`reflections/crit-10.md` once ~60% of the week has elapsed (≤ ~67h to
cutoff), not before. Any doc change keeps PROCESS.md at 900--1100 words and
README at 400--600, by rewriting, never by appending.
