# Hand-off --- crit 8 (final project, "It's alive!"), second run

## State

160.5h to cutoff at prompt time (7h after the first run); still crit 8's own
168h window, not crit 9 --- the first run's build, README, PROCESS.md,
reflection and deploy were already done and pushed. This run continued
plan/build/deepen rather than treating anything as finished, since the crit's
own bar (proof of life) was already fully met and there was no reason to
invent crit-9-shaped work (real-time, rate-limiting) the brief explicitly
defers.

Re-fetched the literal crit-8 body (not the paraphrase) and the final-project
brief via WebFetch, to check nothing in the summary had flattened a
requirement (e.g. whether "a note on the sources consulted" meant something
beyond the inline citations README.md already has --- it didn't; the brief's
own wording is "with what you read or looked at while deciding," which the
existing Sloan/Hoyt/Appleton links already satisfy).

Read every source file fresh (`src/server.ts`, `marks.ts`, `db.ts`,
`readme.ts`, `public/*`, both spec files) looking for the same "what could a
request that isn't the form send" boundary-validation gaps that found real
bugs on crit 7 and the previous final-project sibling repos. Found one: a
`Cookie` header with malformed percent-encoding (`hand=%zz`) made
`decodeURIComponent` throw inside `parseCookies`, which the outer try/catch
turned into a 500 rather than the graceful degrade the app already holds
itself to for a malformed JSON body. Fixed by wrapping the decode in its own
try/catch and skipping that cookie on failure
([`98148df`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/98148df)),
with a regression test alongside the fix.

Verified against the real thing, not just a dev server: built the exact CI
Docker image by hand (`sudo -n docker build`/`run --tmpfs /data` --- this
sandbox's user isn't in the `docker` group, but passwordless `sudo` reaches
the socket), ran `pnpm check` (10/10) and `pnpm check:evidence` against the
running container, then a fresh live-browser sweep that hadn't been run on
this project yet: 320px reflow (no horizontal overflow), `agent-browser a11y`
on both `/` and `/readme/` (0 violations/0 incomplete each), and a genuine
keyboard-only walkthrough (Tab into the radio group, ArrowRight to change the
selected ink colour, Tab to the note field, real `keyboard type` keystrokes,
Tab to the submit button, Enter to submit) --- confirmed the mark landed with
the right colour and note and rendered as "yours." All clean; no other bugs
found. Pushed the fix, redeployed
(`flyctl deploy --remote-only --ha=false -a comp4020-final-dachi`), and
confirmed the live URL: `/` and `/readme/` both 200, the malformed-cookie
fix works live (200 instead of 500), and the first run's founding stroke
survived the redeploy.

## Next action

Nothing left to deepen within crit 8's own scope that isn't either already
covered or explicitly crit-9/10 territory (real-time, the no-rate-limit
call, server-side logging) --- the brief is explicit that this week's mark
reads only the proof-of-life exercise, not the in-flight project, so don't
build those early. The next run (whenever it lands, still within crit 8's
window unless the prompt says otherwise) should re-check whether new time
has actually moved the needle: if nothing changed, a repeat a11y/keyboard/
reflow pass would just reproduce this run's result. Once a run is told
crit 9 ("All at once") is live, re-read this repo's own PROCESS.md's
"what's next" section first --- it names the no-rate-limit choice as the
first thing worth re-arguing once several hands can add strokes within the
same few seconds.
