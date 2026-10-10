# Process overview

## From the brief to a concept

The final project brief fixes three things &mdash; multi-user, real-time,
persists &mdash; and leaves everything else, including what "good" means, to
me. Crit 8's own brief narrows that further: ship a working slice and a first
README, and explicitly says the feature list, the real-time layer and the
polish can all wait, because this week's mark reads the exercise, not the
in-flight project. Two lines in the final project brief shaped the concept
more than any other: "small is fine: an app for twelve people, one street,
one book club or one afternoon is on-brief," and "design for co-presence: the
app should be more interesting because other people are using it at the same
time." I wanted a shared object that gets more interesting as more hands
touch it, without needing accounts, moderation, or anything that only makes
sense at a market's scale &mdash; which is also, not coincidentally, an
object I'm named after: a scroll that survives, imperfectly, across a long
time and several hands.

Long Scroll is the result: everyone who visits can add one stroke &mdash; a
colour, and an optional short note &mdash; to a single, shared, append-only
scroll. There's no feed, no ranking, no expiry. Multi-user is real (an
anonymous per-browser cookie is a person, and every visitor sees the same
persisted rows); persistence is real (SQLite on the Fly volume, verified to
survive a container restart, not just a page reload); real-time is
deliberately not built yet, because the brief stages it at the next crit
("All at once") and building it now, with nothing yet to test the several-
viewers story against, would have been work with no way to verify it was the
right call. Crit 9 built it, against exactly that story; see
"Crit 9: all at once" below.

## Stack, and the trade-offs

The whole backend is a plain `node:http` server
([`2bfeff5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/2bfeff5)):
no Express, no Astro, no ORM. I weighed this against the stack I used for a
prior full-stack crit (Astro + Drizzle + better-sqlite3 + SSE) and chose
differently on purpose. That stack earns its weight when a site has many
content pages or needs a templating layer; this app has four JSON routes and
three static files, and a framework would be machinery the README's own
argument (fewer moving parts, matching Ben Hoyt's small-web case) would then
have to justify away. `node:sqlite`, not `better-sqlite3`, was the sharper
call: it ships inside Node 24 (already pinned in `mise.toml`), so there's no
native module to compile for the deploy target &mdash; one whole failure mode
(a missing build toolchain in a slim Docker image) doesn't exist. The cost is
real: it's a newer API with a smaller track record than `better-sqlite3`'s.
I judged that cost worth it against a 256MB machine and a course-long
project, where fewer things that can fail to build outweighs a library's
maturity.

The one runtime dependency is `marked`, to render `README.md` at `/readme/`
&mdash; hand-rolling a Markdown renderer for one file felt like exactly the
kind of premature abstraction the brief's "small is fine" argues against in
the other direction: pulling in machinery to avoid a small, well-tested
dependency isn't smaller, just differently complicated.

## Workflow: verify against the real thing before writing the claim

I built in the order a marker would read it, backwards: server and schema
first, front end second, then the checks in `spec/`
([`d417b24`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/d417b24)),
then `README.md`
([`8e66feb`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/8e66feb))
and `CLAUDE.md`
([`6ae9b34`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/6ae9b34))
last, so that every claim the README makes about what's enforced was already
true and tested, not aspirational. Before any of that landed, I built the
exact CI image locally (`docker build -t app .`, then the same
`docker run --tmpfs /data` line `checks.yml` uses) and ran `pnpm check`
against the running container, not just against a local `node --watch`
process &mdash; the same gap crit 7 taught me to check for: a stack behaving
correctly in dev and differently in the image CI actually gates on.

That local-against-Docker discipline caught a real bug before it ever
reached a commit. My first cut of the body-size guard called
`req.destroy()` the moment a request exceeded the cap, then tried to write a
413 response &mdash; but destroying the request's socket closes the
connection in both directions, so the response never reached the client;
`fetch` saw a bare connection reset instead of a 413. The regression test now
in `d417b24`
("rejects a body larger than the server's own cap") caught it immediately on
the first `pnpm test` run against the container. The fix
(`src/server.ts`) writes and ends the 413 response first, and only destroys
the socket afterwards. This is the shape of correction the brief asks for: a
real mistake, caught by a check written for a different reason (verifying the
cap exists at all), fixed in the code the check now guards &mdash; not a
retry until the suite went green.

The same discipline, applied to the front end rather than the server: once
every server-side boundary-validation and response-header check I could find
had come back clean, I asked what `fly.toml`'s own `auto_stop_machines`
setting implies for a real visitor &mdash; the one machine stops when idle
and starts on the next request, so a cold start (or any dropped connection)
is a genuine way for `app.js`'s `fetch` calls to reject, not just answer with
a bad status. Neither `load()` nor the submit handler checked for that;
confirmed live by routing `/api/marks` to abort mid-request
([`f1704db`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/f1704db)):
an unhandled promise rejection in the console, and the status text stuck at
"adding your mark&hellip;" forever. Fixed with a `try`/`catch` around each
fetch, so a dropped connection degrades to a visible, honest message instead
of a silent hang.

A later pass asked a question none of the field-level validation above
covers: not what a direct request can put *in* the body, but what request
can reach the handler at all. The server never checked where a POST came
from, so I built a tiny page on a different local origin &mdash; a hidden,
auto-submitting `<form enctype="text/plain">`, the standard technique for
smuggling raw JSON past a server that (like this one) never checks the
`Content-Type` header &mdash; and confirmed live that visiting it silently
added a real row to the scroll, no click or confirmation involved. Into a
store with no edit or delete path, that is not a cosmetic gap: any visitor
who merely loaded an unrelated malicious page could have their browser
vandalise the scroll on their behalf, permanently. Fixed by checking every
POST's `Origin` header against its own `Host` &mdash; browsers set `Origin`
on every unsafe-method request and never let page script override it, so
this is the same defence Astro's own framework gave crit 7's project for
free; here, with no framework underneath, it had to be written by hand. Ran
the exact same attack page against the patched server afterward and
confirmed it no longer lands a row, while the real form still works.

A sixth pass asked a narrower question about the same body-size guard: the
existing test only ever sends a complete, over-cap request. A client whose
connection actually drops mid-upload (a flaky network, a closed tab) hits a
different branch of `readBody` &mdash; the socket's own `error` event, not the
size-cap check &mdash; which nothing exercised. Confirmed live with a raw
`node:net` socket that sends a partial body and then resets the connection:
the server already handles it correctly (the existing `req.on("error",
reject)` was wired up for the size-cap case but covers this one too), so this
didn't change `src/server.ts`. It did close a real coverage gap, landed as a
regression test
([`67e28e7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/67e28e7))
that now pins the behaviour down rather than leaving it to coincidence.

A seventh pass asked a question none of the five before it had: not what a
request can carry, but what a genuine request, from a real visitor's own
browser, can be tricked into doing. The server had no defence against being
loaded inside another site's `<iframe>` at all. Confirmed live: a plain
cross-origin page embedding this app's `/` rendered it in full, no frame-
busting of any kind. Cross-origin JS can't read what's inside that frame,
but it doesn't need to &mdash; an attacker can overlay their own UI on top of
the iframe and trick a visitor into clicking "Add to the scroll" believing
they're clicking something else, landing a stroke under that visitor's own
real `hand` cookie. The Origin check from the fourth pass doesn't catch
this: the request is genuinely same-origin, made by the real page, with a
real cookie &mdash; only the click that triggered it was misdirected. Into a
store with no edit or delete path, that is exactly as serious as the forged-
origin gap it sits beside. Fixed with `X-Frame-Options: DENY` and a
`Content-Security-Policy: frame-ancestors 'none'` on every response
([`70cc828`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/70cc828)),
re-confirmed against the same attacker page: the frame now renders as a
broken image, nothing inside it.

An eighth pass stayed in the same family as the seventh rather than opening a
new area: once clickjacking was closed, what else belongs beside it among
response headers a browser reads on every request regardless of what the page
itself does. Neither `X-Content-Type-Options: nosniff` nor `Referrer-Policy`
were set anywhere. Both are cheap, zero-cost additions here &mdash; every
response already names its own content-type explicitly, so nosniff only
removes a browser's option to override that; and the page links out (the
source repo, the README's own cited essays) with nothing secret in its own
URL, so `no-referrer` costs nothing it needed to send
([`d908ddd`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/d908ddd)).
Neither closes a reachable attack the way the Origin check or the frame
defence do; both are the kind of hardening worth having anyway once the
sharper gaps in the same family are already fixed.

A ninth pass turned the same "verify against the real thing before writing
the claim" discipline back on the README itself. It lists, under "Enforced,
in `spec/`," that a returning hand's past strokes survive a fresh server
restart &mdash; but every test in `spec/` hits the one app
`spec/global-setup.ts` finds already running; none of them ever restart it,
so that specific claim had nothing behind it. Closed the gap with a test
that spawns two short-lived `node src/server.ts` processes against an
isolated `DATA_DIR`, the same path production uses (a Fly volume standing in
for the temp directory), killing the first before starting the second
([`5987420`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/5987420)).
Checked the test was a real sensor, not a vacuous pass, by running the same
two-process sequence by hand with the second instance pointed at a
deliberately different data directory: the stroke correctly vanished,
confirming the assertion would have caught the regression it's there to
catch.

Running the same check over CLAUDE.md's rules found one more claim with
nothing behind it: the first and sharpest, that a stored stroke is never
edited or deleted. It held only because no route answered any method but
GET and POST, so nothing would notice a careless future route. A new test
tries PUT, PATCH and DELETE against both `/api/marks` and a stroke's own
path, as that stroke's own hand, and checks the stroke comes back
field-for-field unchanged; a sibling test confirms a body naming its own
`hand`, `id` or `createdAt` can't pass a stroke off as someone else's
([`ae4b724`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/ae4b724)).
As with the restart test, I checked it would actually fail by temporarily
adding a DELETE route that answered 204: the test caught it at once. The
README now names the rule among what `spec/` enforces
([`cbc60d5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/cbc60d5)).

That left two rules only the page itself can keep, both checked so far only
by hand in a real browser: a stroke's owner is told in text, and every
control is a native labelled form element. A new spec file loads the served
page and the served `app.js` into jsdom against the running app, with the
page's fetch carrying a real `hand` cookie, and checks the visitor's own
stroke ends in "— yours" while someone else's doesn't, and that every input
and button has a label and sits in the tab order
([`0cd898c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/0cd898c)).
Each test failed against a deliberately broken build (the suffix removed;
the note's `<label for>` pointed elsewhere) before I kept it.

## Crit 9: all at once

Before building anything live, I re-read what `/api/marks` already sent,
because a broadcast would push the same shape to every open tab. It included
every stroke's `hand`, the cookie value that *is* a visitor's identity. Anyone
could copy someone else's into their own cookie, post as them, and be told
their strokes were "yours". That undid crit 8's `HttpOnly` fix from the other
side, since the token was published in the JSON while hidden from scripts.
The spec had even read one test's "someone else's hand" straight out of the
listing. The fix sends a per-requester `yours` flag instead, and a new test
checks no response carries a hand at all
([`606eaae`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/606eaae)). This had to land first: a live stream would
otherwise have broadcast each new hand to every open tab the moment it was
minted.

The live layer is server-sent events from the plain `node:http` server
([`a217a9e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/a217a9e)). It needs no library: each open tab is one
response held in an in-process set, which is correct because the app runs on
exactly one machine. The decision the brief asks for sits above that, and I
grounded it in the README's "coming back is worth it". A tab that drops off
(a sleeping phone, a cold start, a redeploy, which is now every push) is
replayed exactly the strokes it missed, by stroke id, using the browser's own
`Last-Event-ID`. The alternatives (best-effort live, refetching everything,
polling) and what each costs are in the decision record
([`ed8e4b9`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/ed8e4b9)).

Three corrections shaped this, and each came from a sensor rather than from
reading the code. A mutation check (remove the broadcast, rebuild, rerun)
failed after five seconds instead of one, which exposed that Node holds
response headers back until the first body write. On a quiet scroll, a new
tab's stream wouldn't have opened, or shown as live, until the 25-second
heartbeat. An initial `retry:` frame fixed it, and the test's stream reader
now times out on headers too. Then two real browser sessions on the CI image
showed a first-time visitor's own first stroke without "— yours". Their stream
opened before their hand existed, and its copy beat the POST's response to
the page. The page now lets a copy that says `yours` replace one that
doesn't. The jsdom page test missed the race at first, because over
localhost the response always won, so it now holds the response back to force
the order Chrome showed. With the fix removed, that test fails
([`368269c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/368269c)). Finally, repeated `pnpm check` runs went
intermittently red, and that had two causes. One was my replay test assuming
no other spec file posted between its strokes. The other was a genuine O(n²)
in `insertMark`, which scanned the whole list for every stroke and timed out
in jsdom once the test database passed 600 strokes. Fifteen consecutive green
runs followed the fix.

A later pass read the page's three arrival paths (load, stream, own post)
side by side, asking whether the guard against announcing your own stroke as
a stranger's could catch anything else. It could. The guard was a plain
`posting` flag, so a stranger's stroke landing while your post was in flight
went unannounced to a screen reader, and a cold start makes that window
seconds long rather than milliseconds. Stream arrivals now wait until the
post answers with its id, and only strangers' strokes are announced. A test
that holds the post back while a second hand posts failed before the fix
([`cece9ee`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/cece9ee)).
The same pass held a stream open on the live Fly URL for 80 seconds. The proxy
kept it open across three 25-second heartbeats, so its idle timeout isn't
quietly cutting streams on a quiet scroll.

The next pass asked what that held list does if a second post starts while
the first is still in flight. A double click answered it: two posts, the same
stroke left twice on a scroll with no delete path (under two different hands,
for a first-time visitor whose cookie didn't exist yet for either post), and
an unhandled `TypeError` when the second answer released a list the first had
already cleared. The page now ignores a submit while a post is in flight. The
test clicks twice against a held-back response and failed before the fix
([`041d6ff`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/041d6ff)).

The same pass's failure branch said "try a shorter note" for every refused
post. The form's `maxlength` matches the server's cap, so a real visitor
could only ever see that line when the server or Fly's proxy failed, and then
it gave the wrong advice. Only the server's own `note-too-long` verdict now
blames the note; anything else says to try again. A test that answers the
post with a 502 failed before the fix
([`4d72a97`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/4d72a97)).

The reconnect decision assumed a dead connection would always tell the
browser it was dead. It needn't. A phone that wakes on a socket the server
dropped while it slept can leave `EventSource` open, and the page saying
"live", with nothing ever arriving. The 25-second heartbeat was a comment
line, which `EventSource` swallows, so the page had no way to hear it. It is
now a `ping` event, and the page reopens from its last id any stream that has
heard nothing for a minute, checking on a timer and again the moment the tab
becomes visible. A jsdom test jumps the page's clock forward and fails without
the fix; in real Chrome the `ping` event dispatched and the forced silence
reopened the stream from the right id
([`48d2b58`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/48d2b58)).

The page had changed across five runs since its last accessibility sweep, so
the next run repeated it rather than adding to it. axe-core was still clean on
both pages, but a 320px viewport (WCAG's reflow width) after posting a note
that was one unbroken run of characters stretched the page to 913px. The form
allows 140 characters, so a pasted URL would do it. jsdom can't see layout, so
the evidence is the real-browser `scrollWidth`, back to the viewport width
once the note was allowed to break anywhere
([`0c67e35`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/0c67e35)).

The double-click guard only held while a post was in flight, and the next run
asked how long that is. Against a local server, a post answered in a few
milliseconds, well inside the 100--250ms between a person's two clicks. The
second click then submitted the cleared form, and a blank stroke nobody meant
landed for good. A CDP double-click hid this, since it fires both clicks
microseconds apart; it took two clicks 150ms apart in real Chrome to show it.
The page now ignores submits for a second after a post succeeds, which no
deliberate next stroke is quick enough to hit. A test that clicks again the
moment the post answers failed before the fix
([`91eba67`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/91eba67)).

The crit itself is a pod posting at the same moment, so the next run staged
that: two real Chrome sessions, both first-time visitors, submitting at the
same instant. Both tabs agreed on the order and each marked only its own
stroke as theirs. The rehearsal did turn up a smaller flaw. The page re-ran
the welcome line after every post and stream arrival, so a stranger's first
stroke drew "You've left a mark on this scroll before". The line now counts
only the strokes the page loaded with. The test posts as a new hand and then
adds a stroke from a returning hand's other tab, and it failed before the fix
([`008b2d8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/008b2d8)).

That rehearsal ran on a desktop viewport. On a phone, the same moment looks
different. New strokes land at the foot of the scroll, which on the live
seventeen strokes is a screen and a half below the first view. A pod member
reading from the top saw nothing arrive. A screen-reader user in the same spot
heard "a new stroke", because that announcement lived in a visually hidden
live region. The announcement is now shown under the live line as well as
spoken, and it says where the stroke went. The test that checks a stranger's
stroke arrives live now also checks that the announcement is visible and
names the foot of the scroll, and it failed before the fix
([`132016b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/132016b)).

The crit itself is a room of people opening the app at once, and each open tab
holds a stream for as long as it stays open. `fly.toml` sets no concurrency
limits, so I measured instead of trusting the defaults. Against the live
app, 60 streams opened at once all got their retry frame and their pings,
and the page and `/api/marks` still answered in about 30ms. Against the same
image held to 256MB locally, 520 streams gave 500 open and 20 refused with the
cap's 503, memory went from 27MB to 36MB, and the page still answered in 4ms.
A crit room is well inside the stream cap, and the cap is well inside the
machine. Nothing needed changing.

The two-session rehearsal used separate cookie jars, so it never asked what
one person with two tabs sees. A stream knows only the hand it opened with,
and a first-time visitor's tabs all open before their hand exists. Two tabs
of one fresh Chrome session, each posting once, each showed the other's
stroke as a stranger's, though both strokes were the same hand's. The tab
that posts now tells its siblings on a `BroadcastChannel` which stroke was
theirs. The test opens two pages on one shared cookie jar and a real channel,
and it failed before the fix
([`62fa03a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/commit/62fa03a)).
The stream copy can still beat the channel message, so a sibling's stroke may
be announced as "a new stroke". The announcement never says whose, so I left it.

## What's next

Crit 10 adds server-side logging. The stream is the first part of the app
that holds state between requests (a set of open responses), so it's the
first thing worth logging: connections opened and closed, replays sent, and
the 503 a visitor gets past the stream cap. The no-rate-limit choice is still
open. The scroll is now live in front of a pod writing at once, and that's
the first time it will be tested.
