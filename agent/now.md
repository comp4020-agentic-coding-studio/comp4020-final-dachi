# Hand-off --- crit 8 (final project, "It's alive!"), sixth run

## State

130.5h to cutoff at prompt time, still crit 8's own window (brief re-fetched,
unchanged). The fifth run's hand-off flagged that `public/app.js` had changed
for the first time since the a11y/keyboard/reflow sweep, and said to re-verify
that sweep plus do one more fresh source read before concluding sensors were
dry.

Did both. The sweep (a11y on `/` and `/readme/`, Tab order, arrow-key radio
navigation, a full keyboard-only fill-and-submit, 320px reflow, both marking
viewports) all came back clean against the rebuilt Docker image. The fresh
source read found a real one, though: `src/server.ts`'s POST handler never
checked where a request came from. A hidden, auto-submitting
`<form enctype="text/plain">` on an unrelated page smuggles raw JSON past the
server's own Content-Type-blind body parser (it never checked Content-Type at
all) --- confirmed live with a throwaway cross-origin page that silently
added a real mark with zero user interaction. Into a store with no edit or
delete path, that's permanent drive-by vandalism, not a cosmetic gap. Fixed
with an `isSameOrigin` check (Origin header's host vs. the request's own
Host) on the one state-changing route, rejecting both a mismatched Origin and
a missing one --- mirroring the equivalent framework-provided check crit 7
got for free from Astro, hand-written here because there's no framework.
Thirteen tests now (`spec/marks.test.ts`), all passing against the real
Docker image; re-ran the same attack page against the patched server and
confirmed it no longer lands a row, while the real form still works.
([`872ad20`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/872ad20),
docs in
[`dd07c17`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/dd07c17)).

Deployed (the repo is still private this crit, so `/ship`-style CI deploy
doesn't run yet --- deployed by hand per doctrine step 7). Verified live:
cross-site POST gets 403, same-origin POST still gets 201. The live
same-origin verification POST itself landed a real row in production (no
delete path); cleaned it up via `flyctl ssh console` + a direct
`node:sqlite` `DELETE`, confirmed the scroll is back to just "the first
hand" afterward.

## Next action

Six runs deep, five distinct bugs found across the lenses this project has
accumulated (cookie decode, cookie shape, response-header hardening, front-
end fetch-rejection handling, now cross-site POST). The next genuinely
untried question, if a fresh read goes quiet again: whether the GET
`/api/marks` route itself should also gate on anything (it's read-only,
shared, already-public data, so probably not worth an Origin check --- but
worth asking explicitly rather than assuming). Otherwise, 130.5h is still
comfortably plan/build/deepen territory, not finish: keep re-reading
`src/*.ts` and `public/app.js` fresh each run before falling back to a
repeat browser sweep, the way the last several runs each found exactly one
real thing this way. If the prompt is ever crit 9 ("All at once"),
`PROCESS.md`'s "what's next" already names the no-rate-limit choice as the
first thing to re-argue, and real-time/several-people-at-once is the new
work that crit actually asks for.
