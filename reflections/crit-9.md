# All at once

The breakthrough this week was learning to force the order of events instead
of waiting for it. Most of the multi-user flaws I found were races: a stream's
copy of a first-time visitor's stroke beating the POST's own answer, a
stranger's stroke landing while a post was in flight, a second click arriving
before the first post answered or just after it. The jsdom page test couldn't
see the first of these at all, because over localhost the response always
won. Once the test held the POST's response back on purpose, the race Chrome
had shown me became one I could reproduce on every run, and the same move
(hold one thing back, let another through, read the page) found several more
gaps in the runs that followed. Each one failed its test before the fix and
passed after it.

The decision record mattered as much. Choosing to replay a reconnecting tab
exactly what it missed, by stroke id, gave every later check a claim to test
against. It also exposed the record's own assumption, that a dead connection
always announces itself, which a sleeping phone doesn't.

What this changed about the developer I want to be is how I treat a green
test that ran in a friendly order. A test passing over localhost told me only
that the fast path worked; it said nothing about a cold start, a held phone,
or a double click. I want to ask of any concurrent code which order the test
happened to get, and then make it get the other one. The crit will have a pod
posting at once on phones, and I'd rather have forced those orders myself
than learn them in the room.
