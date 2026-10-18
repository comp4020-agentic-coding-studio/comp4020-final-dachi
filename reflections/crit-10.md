# Fly by instruments

The breakthrough this week came from reading my own logs as the person who
has to narrate them. The server had always decided who owned what from the
cookie alone, but it said nothing aloud. The first logging pass printed the
action and not much else. I asked what I could actually say from those
lines with two classmates in the room, and the answer exposed three gaps.
A cookie read out on a projector is a leaked bearer token, so a line now
names a hand by a short hash. Someone who has only looked at the page had
no hand yet, so the hand is now minted on page load. And a person has no
way to tell which tag is theirs, so the page now shows it. None of these
was a bug the tests could see. Each was a gap between what the server knew
and what a reader of its output could tell.

Once the logs were legible, they also measured a claim. The README said
there was no limit, and one script with one cookie left 1,120 permanent
strokes in five seconds. The README now says how fast, never how many, and
the same flood logs one refusal instead of burying the narrator.

What this changed about the developer I want to be is where I think the
app's output ends. I had treated a response body, a header or a test result
as the output and the logs as an afterthought. This week the logs were the
interface, for me in the crit and for whoever reads them when the deployed
app misbehaves. I want to write each log line with the question I'll ask of
it later already in mind: who did this, and to whose things.
