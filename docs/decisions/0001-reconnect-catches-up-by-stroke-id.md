# 1. A tab that drops off catches up exactly, by stroke id

Status: accepted, crit 9 ("All at once").

## Context

Crit 9 makes the scroll real-time: a stroke one hand adds shows up in every
other open tab within about a second, with no reload. The transport was
settled by the stack. The server is plain `node:http` on one Fly machine, so
it uses server-sent events from an in-process set of open responses: no
library, no broker, and one direction is all the app needs, since a visitor
only ever *sends* a stroke through the ordinary POST.

The decision that isn't settled by the stack is what an open tab sees after
its connection drops and comes back. On this deployment, that isn't an edge
case. Phones sleep a tab within minutes. `fly.toml` stops the one machine when
nobody's connected and starts it on the next request. And from crit 9 on, CI
redeploys on every push to `main`, so each push restarts the server under
every open stream. At the crit, a pod of phones on venue wifi will drop and
rejoin repeatedly over fifteen minutes.

The README's definition of good is "small enough that everyone's mark is
still legible, and durable enough that coming back is worth it." A scroll that
quietly loses the strokes added while you looked away fails the second half:
it stops being the one continuous object the README promises and becomes a
feed you have to remember to refresh.

## Decision

Every stroke's database id is also its SSE event id. When a stream opens, the
server first replays every stroke with an id greater than the client's resume
point, in id order, then joins the tab to the live set. Both steps happen in
one synchronous block, since `node:sqlite` never yields, so no stroke can land
between the replay and the subscription.

The resume point is the later of two values: the browser's own
`Last-Event-ID` header, which `EventSource` sends by itself on every automatic
reconnect, and `?after=`, which the page sets to the highest id it loaded when
it first opens the stream. One code path therefore covers a first open, a
dropped connection, and a server restart. When the browser gives up for good,
which an `EventSource` does on any non-200 answer (a redeploy mid-flight, say),
the page reopens it after five seconds from the last id it rendered.

The page inserts each stroke by id: once, in id order, whichever way it
arrived (initial load, stream, or the response to your own post). A line above
the scroll says in words whether the stream is live or reconnecting, so a
visitor is never left guessing whether quiet means nobody's writing or nothing
is arriving.

## Alternatives considered

**Best-effort live, missed strokes on reload.** This was crit 7's choice for
Crit Rooms, where a live list sat beside a server-rendered table that was
always fresh on load. It's the least code, and it's honest if the page says
so. Here there is no separate fresh table. The scroll *is* the live list, so
a stroke missed during a phone's sleep would be missing from the one object
the visitor is looking at, with nothing on screen to say so. That is exactly
the failure the README's "coming back is worth it" rules out.

**Refetch the whole scroll on every reconnect.** This is the strongest
alternative, and the one I expect the pod to argue for. It needs no event ids
and no replay query, and it reconciles anything the tab might have got wrong,
including whether a stroke is yours. Against it: it re-renders every stroke on
every blip, which loses the reader's place in a long scroll on a phone that
reconnects every few minutes. It also can't tell a screen reader what's
actually new without diffing against what was there, and that diff is the id
comparison this decision does anyway. Once you have the diff, refetching the
rest is waste.

**Fast polling.** A `GET /api/marks?after=` every second would meet the
one-second bar without a long-lived connection. But it multiplies requests by
the number of open tabs for the whole time they're open, on a 256MB machine.
It also keeps the machine from ever auto-stopping while any tab is open,
exactly as SSE does. The latency is no better than SSE's, and the catch-up
logic would be the same id comparison.

## Consequences

- Ids must only ever increase and never be reused. Append-only storage plus
  SQLite `AUTOINCREMENT` guarantees both. A future feature that deletes
  strokes would weaken this, which is one more reason CLAUDE.md's
  append-only rule needs a new argument before it changes.
- A tab returning after a long absence gets every stroke since in one burst.
  That's bounded by the size of the scroll, which is no more than a fresh
  `GET /api/marks` sends, and the README's legibility argument keeps the
  scroll small.
- Simultaneous strokes don't conflict, so conflict resolution isn't the
  decision here. Nothing is ever edited, and two hands adding at once just
  get consecutive ids in the order the server received them.
- Presence (who else is here) is deliberately not shown. A scroll records
  hands that have written, not hands that are watching. A live count is the
  obvious next argument to have.
- The broadcast bus is one in-process set, valid only because the app runs on
  exactly one machine (`--ha=false`). A second machine would need a shared
  bus, and its own decision.
- A stream opened before a browser had a hand (a first-time visitor) delivers
  that visitor's own first stroke as someone else's. The post's own response
  corrects it on the page that posted. A *second* tab of the same browser,
  opened before that first post, keeps the wrong label until reload.
