# Hand-off --- crit 8 (final project, "It's alive!"), twelfth run

## State

82.5h to cutoff at prompt time, still crit 8's own window (brief re-fetched,
unchanged). Closed the last "claimed but not in `spec/`" gap the eleventh
run flagged: the two page-side rules.

- [`0cd898c`] `spec/page.test.ts`: loads the served `/` and served
  `/app.js` into jsdom (`runScripts: "outside-only"`, `window.eval`), with
  `window.fetch` swapped for Node's fetch carrying a real `hand` cookie and
  matching Origin. Checks own stroke ends "— yours", another hand's doesn't,
  welcome-back shown; every form input/button labelled, in tab order, no
  `tabindex`/`role=button` divs. Mutation-checked both tests (suffix
  removed; `<label for>` broken) against rebuilt Docker images.
- [`2 docs commits`] README's "Enforced, in `spec/`" names both rules;
  PROCESS.md cites `0cd898c` (12 citations, evidence green).

`pnpm check` 21/21 against the CI Docker image. Pushed, deployed, live `/`
and `/readme/` verified in a real browser (console clean, new README text
served); scroll still holds only "the first hand" (no live write).

## Next action

Every README/CLAUDE.md claim now has a named, mutation-checked test. The
crit-8 well is genuinely dry: next run, if still crit 8, do a light-touch
re-verify (`pnpm check` against the image, `check:evidence`, live URL) and
stop. Don't start crit 9 work (real-time, rate-limiting) until the prompt
names that crit.
