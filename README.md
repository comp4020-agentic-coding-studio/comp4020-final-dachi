# Long Scroll

A shared scroll. Anyone who visits can add a stroke of ink: a colour, and an
optional short note. Nothing on it is ever edited or removed, and your own
strokes are still there, marked as yours, when you come back.

## What good means here

**Good, at this size, means small enough that everyone's mark stays legible,
and durable enough that coming back is worth it.**

Robin Sloan's
[_An App Can Be a Home-Cooked Meal_](https://www.robinsloan.com/notes/home-cooked-app/)
argues that an app for people you know can skip most of what a product
needs, and his
[five-year follow-up](https://www.robinsloan.com/lab/five-years-of-home-cooked-apps/)
names what to protect longest: who the app answers to. Ben Hoyt's
[_The small web is beautiful_](https://benhoyt.com/writings/the-small-web-is-beautiful/)
makes the same case from the stack down. Maggie Appleton's
[_Home-Cooked Software and Barefoot Developers_](https://maggieappleton.com/home-cooked-software)
adds the claim this scroll tests: the software worth making for a small
group is the software nobody else needs exactly.

A scroll has no feed, no ranking and no expiry: every hand stays legible, in
the order it arrived.

**What I chose not to build:** accounts (a browser is a person, by an
anonymous cookie); editing or deleting a stroke (append-only is a claim, not
an oversight); a cap on how many strokes a hand adds, though there is one on
how fast, since a hand adding hundreds a second buries everyone else's; any
sign of who is watching.

## What's enforced and what's judged

Enforced, in `spec/`: a stroke's colour is one of the six offered and a note
is at most 140 characters, both checked by the server. Strokes survive a
server restart, and no method from any hand edits or deletes one. The page
says in text which strokes are yours, and every control is a labelled native
form element. A stroke reaches every open tab within a second, and a
reconnecting tab gets exactly what it missed. No response carries another
visitor's `hand`. The log tells two first-time visitors apart without
printing either hand. A hand may add ten strokes a minute, and an address
sixty.

Judged, by using the scroll: whether it reads as one shared object rather
than a comment list, whether finding your old stroke feels like the point,
and whether six inks and 140 characters keep it a scroll and not a chat.

## Several hands at once

A person is whoever's browser holds a given `hand` cookie, given on first
page load. The server decides whose a stroke is from that cookie alone. A
body naming a hand, id or time is ignored, so no hand can change another's
stroke, or its own. The cookie is a bearer token, so it is never sent back:
responses say only whether each stroke is yours.

The scroll is live. The decision I'd defend is what happens when a tab drops
off. A phone that slept, or a redeploy under an open tab, catches up on
exactly the strokes it missed, by stroke id. The argument is in
[`docs/decisions/0001-reconnect-catches-up-by-stroke-id.md`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/blob/main/docs/decisions/0001-reconnect-catches-up-by-stroke-id.md).

## Who did what, from the logs

The server logs one line per action: `arrive` (loaded the page, `new=true`
the first time), `read` (fetched the scroll), `watch` and `leave` (a stream
opened or closed), `stroke` (with id, ink and quoted note), `refuse` (a write
turned away, and why; `too-fast` once per run) and `miss` (an unknown route,
so a `DELETE` attempt shows). Each line names a hand by a six-character hash
tag, like `hand=cdec90`, never the cookie. The page shows each visitor their
own tag, so they can claim their lines.
