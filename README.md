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
claim, not an oversight); live updates (the brief stages real-time for the
next crit, so for now the shared state is real &mdash; every stroke is a row
every visitor's next load can see &mdash; but you see it on reload, not
pushed to an open tab); any limit on how many strokes one hand can add
(a guestbook you can only sign once is a worse guestbook).

## What's enforced and what's judged

Enforced, in `spec/`: a stroke's colour must be one of the six the form
offers (never an arbitrary string), a note is capped at 140 characters
server-side (not just by the input's `maxlength`), and a returning hand's
past strokes are still in the response after a fresh server restart, and no
method, from any hand, edits or deletes a stroke once it's stored.

Judged, by a visitor reading this page: whether the scroll reads as one
continuous, shared object rather than a list of comments; whether finding
your own old stroke feels like the point, not an afterthought; and whether
six ink colours and a 140-character note are enough constraint to keep this
feeling like a scroll and not a chat log.

## Multi-user, for now

A person is whoever's browser holds a given anonymous `hand` cookie &mdash;
no account, no name required. Everyone sees the same scroll; there is no
private view. What "real-time" and "several hands at once" mean here is
still being decided, and the next crit is where that gets written down and
defended.
