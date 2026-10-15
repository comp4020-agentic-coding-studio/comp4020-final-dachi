# Process overview

## From the brief to a concept

The final project fixes three things (multi-user, real-time, persists) and
leaves "good" to me. Two lines shaped the concept: "small is fine", and
"design for co-presence: the app should be more interesting because other
people are using it at the same time." Long Scroll is one shared,
append-only scroll. Each visitor adds strokes (a colour and an optional
140-character note), and a returning visitor finds their own still there.
A browser is a person, identified by an anonymous `hand` cookie. There are
no accounts, no feed, no ranking and no delete.

My position on the readings the README cites is narrower than theirs.
Sloan's home-cooked app and Appleton's barefoot developers argue for software
made for people you know. I took from them the licence to skip accounts and
moderation. I didn't take the trust that licence assumes, though, because the
crits hand the URL to a room and the app's only write is permanent. So most
of the engineering below is about what a stranger, or a stranger's script,
can do to a scroll nobody can clean up.

## Stack, and the trade-offs

The backend is a plain `node:http` server with no framework
([`2bfeff5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/2bfeff5)).
I had used Astro and Drizzle for crit 7. This app has four routes and three
static files, and Hoyt's small-web case cuts against carrying a framework for
that. The cost is that I had to write by hand what a framework gives you for
free: CSRF, body-size limits, security headers. Storage is `node:sqlite`,
which ships inside the pinned Node 24, so no native module has to compile in
the slim image. The trade is a younger API than `better-sqlite3`. The live
layer is server-sent events, with no library: each open tab is a response
held in an in-process set. That is only correct on one machine, and
`CLAUDE.md` says so. The one runtime dependency is `marked`, which renders
`/readme/`.

## Workflow: the harness does the remembering

Each rule in `CLAUDE.md` comes from an argument in the README, and each one
has a test in `spec/`. Every test runs against the CI Docker image rather
than a dev server. Before I keep a test, I break the code it guards and
watch it fail. When something goes wrong, the fix lands in `CLAUDE.md` or
`spec/`. Retrying until green doesn't count. Five corrections show how
this works.

The first cut of the body-size guard destroyed the socket before writing its
413, so the client got a reset instead of an answer. The cap's own test
caught it against the container
([`d417b24`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/d417b24)),
and it now pins the order.

Later I grepped the README's "enforced" claims against the test files. Two
had nothing behind them. One was surviving a restart, which no test ever
did, since they all share one running app. The other was the append-only
rule, which held only because no route happened to answer `DELETE`. One new
test spawns two servers on one data directory
([`5987420`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/5987420)),
and another tries every edit method as the stroke's own hand
([`ae4b724`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/ae4b724)).

Before building the live layer, I read what `/api/marks` already sent,
because a broadcast pushes that shape to every tab. It included every
stroke's `hand`, which is a bearer token. Responses now carry a `yours` flag
instead, and `CLAUDE.md` forbids sending a hand
([`606eaae`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/606eaae)).

The real-time bugs were all races that localhost timing hides. A mutation
check failed at five seconds instead of one, which exposed that Node holds
headers back until the first body write
([`a217a9e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/a217a9e)).
Chrome showed a first-time visitor's own stroke arriving by stream before
their POST answered. jsdom never did, so the test now holds the response
back to force that order
([`368269c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/368269c)).
A double click 150ms apart left two permanent strokes
([`91eba67`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/91eba67)).
Two tabs of one fresh browser each called the other's stroke a stranger's
([`62fa03a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/62fa03a)).
Every one of these tests fails with its fix removed. The way a dropped tab
catches up is argued in
[an ADR](docs/decisions/0001-reconnect-catches-up-by-stroke-id.md): it gets
exactly the strokes it missed, by stroke id.

My first rate limiter used a TypeScript parameter property. `tsc` passed it,
but `node`, which only strips types, refused to boot. `erasableSyntaxOnly` in
`tsconfig.json` now makes `pnpm check` catch that class of mistake
([`42d3f6e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/42d3f6e)).

The same habit applied to the boundary. I asked what a request that isn't
the form can send, then confirmed each answer live before writing the fix.
That covered a malformed or oversized cookie
([`98148df`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/98148df),
[`6a63225`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/6a63225)),
cookie flags
([`e3afe35`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/e3afe35)),
and the fetch failure a cold-starting Fly machine makes reachable
([`f1704db`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/f1704db)).
It also covered a cross-site `text/plain` form that silently posted from
another origin, and framing for clickjacking
([`70cc828`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/70cc828)).
I proved those last two with a real attacker page on a second origin, not
with `curl`.

## Crit 10: telling people apart from the logs

Crit 10 has two classmates use the URL in separate Chrome profiles while I
narrate from `flyctl logs`. The server already decided ownership from the
cookie alone, but until now it logged nothing. Now every action logs one
line ([`5366999`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/5366999)).
A line names a hand by six hex characters of a SHA-256 of the cookie, never
the cookie itself, because these logs are read out on a projector. The hand
used to be minted on a browser's first stroke. It is now minted on page
load, so two people who have only looked at the page are already two tags.
Notes are JSON-quoted so a newline can't forge a line. A spec runs its own
server and reads its stdout. Making `handTag()` return the raw cookie fails
it. The page shows each visitor their own tag
([`0f36c35`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/0f36c35)),
so a classmate can claim their own lines.

With logs in place, I measured the README's "no limit" stance. One script
holding one cookie added 1,120 permanent strokes in five seconds. The README
now separates how many from how fast. A hand may add ten strokes a minute,
and an address sixty, for a script that drops its cookie
([`b09f41f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/b09f41f),
argued in [`75355a4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/75355a4)).
The same flood then landed ten strokes and logged one `too-fast` line. Live,
61 spoofed `Fly-Client-IP` headers counted as one address, because Fly's
proxy overwrites the header.
