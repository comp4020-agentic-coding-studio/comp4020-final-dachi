# Long Scroll

A shared scroll. Anyone who visits can add one stroke of ink to it &mdash; a
colour, and an optional short note. Nothing on it is ever edited or removed.
Visit again and your own strokes are still there, marked as yours.

## What good means here, for now

This is the first version of an argument I expect to keep rewriting. Right
now it says: **good, at this size, means small enough that everyone's mark is
still legible, and durable enough that coming back is worth it.**

I take my definition of "small enough" from writing about software built for
a handful of people rather than a market. Robin Sloan's
[_An App Can Be a Home-Cooked Meal_](https://www.robinsloan.com/notes/home-cooked-app/)
argues that an app made for people you actually know can skip almost
everything a product needs; his
[five-year follow-up](https://www.robinsloan.com/lab/five-years-of-home-cooked-apps/)
adds that the property worth protecting longest is sovereignty: who the app
answers to. Ben Hoyt's
[_The small web is beautiful_](https://benhoyt.com/writings/the-small-web-is-beautiful/)
makes the same case from the stack down &mdash; fewer moving parts is most of
why small software stays legible. Maggie Appleton's
[_Home-Cooked Software and Barefoot Developers_](https://maggieappleton.com/home-cooked-software)
extends Sloan's essay into a claim I want this scroll to test: the software
worth making for a small group is the software the group could not buy,
because nobody else needs exactly this.

A scroll fits that brief oddly well. It has no feed, no ranking, no
expiring anything: everyone who has ever added a stroke is still legible in
it, in the order they arrived, the way a real scroll accumulates hands over
years rather than resetting each session.

**What I chose not to build, this week:** accounts (a browser is a person,
distinguished by an anonymous cookie, nothing more); editing or deleting a
stroke once added (the scroll is append-only, on purpose &mdash; that's a
claim, not an oversight); any limit on how many strokes one hand can add
(a guestbook you can only sign once is a worse guestbook); any sign of who
else is watching (a scroll records hands that have written, not hands that
are looking).

## What's enforced and what's judged

Enforced, in `spec/`: a stroke's colour must be one of the six the form
offers (never an arbitrary string), a note is capped at 140 characters
server-side (not just by the input's `maxlength`), a returning hand's
past strokes are still in the response after a fresh server restart, no
method, from any hand, edits or deletes a stroke once it's stored, the page
tells you in text (not just ink) which strokes are yours, and every control
on it is a native, labelled form element in the tab order. Also enforced:
a stroke reaches every other open tab within a second, with no reload; a
tab that reconnects is sent exactly the strokes it missed, in order; and no
response or stream ever carries another visitor's `hand`.

Judged, by a visitor reading this page: whether the scroll reads as one
continuous, shared object rather than a list of comments; whether finding
your own old stroke feels like the point, not an afterthought; and whether
six ink colours and a 140-character note are enough constraint to keep this
feeling like a scroll and not a chat log.

## Several hands at once

A person is whoever's browser holds a given anonymous `hand` cookie &mdash;
no account, no name required. Everyone sees the same scroll; there is no
private view. The cookie is the only proof of whose a stroke is, so the
server never sends it back out: each response just says whether a stroke is
yours.

The scroll is live. When anyone adds a stroke, it appears in every open tab
within about a second, and a line above the scroll says in words whether
your tab is live or reconnecting. Nothing is ever edited, so two hands
writing at once never conflict; they simply land one after the other, in the
order the server received them.

The decision I'd defend at a crit is what happens when a tab drops off and
comes back. A phone that slept, a train tunnel, or a redeploy under an open
tab all get exactly the strokes added in the meantime, in order, without
redrawing the scroll you were reading. A scroll that silently lost what was
added while you looked away would fail the "coming back is worth it" half of
this README's argument. The alternatives and their costs are in
[`docs/decisions/0001-reconnect-catches-up-by-stroke-id.md`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dachi/blob/main/docs/decisions/0001-reconnect-catches-up-by-stroke-id.md).
