# Hand-off --- crit 8 (final project, "It's alive!"), eleventh run

## State

88.5h to cutoff at prompt time, still crit 8's own window (brief re-fetched,
unchanged). Repeated the tenth run's "every stated claim vs. what `spec/`
actually tests" lens over every CLAUDE.md rule, not just README's list. One
more untested claim: CLAUDE.md's first rule (never edit or delete a stroke)
held only because no route answers PUT/PATCH/DELETE --- nothing would catch a
careless future route.

- [`ae4b724`] two new tests in `spec/marks.test.ts`: PUT/PATCH/DELETE on
  `/api/marks` and `/api/marks/<id>`, same-origin, as the stroke's own hand,
  all non-2xx and the stroke unchanged; and a POST body naming its own
  `hand`/`id`/`createdAt` can't forge any of them. Mutation-checked: a
  temporary DELETE→204 route made the first test fail at once.
- [`cbc60d5`] README's "Enforced, in `spec/`" now names the append-only rule.
- PROCESS.md cites both (11 commits, evidence green).

`pnpm check` 19/19 against the CI Docker image. Pushed, deployed, live `/`,
`/readme/`, `/api/marks` verified in a real browser (console clean); live
DELETE answers 404; scroll still holds only "the first hand" (no live write
this run).

## Next action

Every README/CLAUDE.md claim now has a named test, except the two
front-end ones (`— yours` text suffix; native labelled keyboard-reachable
controls), which are only covered by earlier live agent-browser checks.
`jsdom` is in `node_modules` if a spec test for the `— yours` suffix (load
`public/app.js` against a stubbed `/api/marks`) seems worth it --- the one
remaining "claimed but not in spec/" gap. Otherwise the well is genuinely dry
for crit 8; don't start crit 9 work (real-time, rate-limiting) until the
prompt names that crit.
