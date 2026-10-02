# Hand-off --- crit 8 (final project, "It's alive!"), ninth run

## State

106.5h to cutoff at prompt time, still crit 8's own window (brief re-fetched,
unchanged). Eight runs deep with seven real findings; the prior hand-off
flagged two specific candidates worth a deliberate look rather than assuming
the header-hardening vein was exhausted after two findings in it:
`Referrer-Policy` and `X-Content-Type-Options: nosniff`.

Checked: neither was set anywhere (`rg` across `src`, `spec`, `public` for
all four header names confirmed only the two clickjacking headers existed).
Added both
([`d908ddd`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/d908ddd),
cited in `PROCESS.md` at
[`3b1fa9e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/3b1fa9e)):
`nosniff` since every response already sets its own content-type explicitly
so this only removes a browser's option to override that; `no-referrer`
since the page links out (source repo, README's cited essays) with nothing
secret in its own URL worth sending along. Framed this honestly in
`PROCESS.md` as hardening, not a closed attack, unlike the Origin check or
the frame defence before it --- there was no live exploit to demonstrate
here, just an absent header.

Verified against the real Docker image (`docker build` + `docker run
--tmpfs /data`, matching `checks.yml` exactly): `pnpm check` (16 tests, was
15) and `pnpm check:evidence` both green. Spot-checked headers directly with
`curl -D -` (not `-I`/HEAD, which this server doesn't route and 404s) on
`/`, `/readme/`, `/api/marks`. Deployed
(`flyctl deploy --remote-only --ha=false -a comp4020-final-dachi`) and
re-verified the same four headers live on all three routes; scroll still
holds only "the first hand" (no live write this run, nothing to clean up).
Pushed both commits.

## Next action

Nine runs deep, eight distinct real findings (seven security/robustness,
one response-header completeness pass). The explicit candidates the eighth
hand-off named are now both closed, so the header-hardening vein is
genuinely exhausted, not just assumed to be: `x-frame-options`,
`content-security-policy`, `x-content-type-options`, `referrer-policy` are
all set, tested, and confirmed live. 106.5h is still comfortably
plan/build/deepen territory (prompt hasn't called this crit's final run).
If a fresh source read goes quiet next run, this hand-off has no further
specific candidate queued --- the honest next moves are (1) re-read the
brief's own "what good means" README commitments against `spec/` one more
time from the actual current text, since that's the one source-read lens
not yet repeated since the seventh hand-off suggested it, or (2) accept the
sensor well is thinning for real at this point and let the next run's own
fresh read decide, rather than inventing a speculative new area pre-emptively.
Don't start crit 9/10 work (real-time, rate-limiting, logging) while still
inside crit 8's own window --- the prompt will say when that crit is
current.
