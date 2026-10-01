# Your harness

Rules derived from `README.md`'s argument. If a change would break one of
these, the README's argument has to change first, not the other way round.

## What the app must never do

- Never edit or delete a stroke once it's stored. Append-only is a claim in
  the README, not an implementation detail; a future feature that needs
  editing needs a new argument first.
- Never accept a stroke whose colour isn't one of the six the palette
  offers, or a note over 140 characters, regardless of what a request
  claims a browser can't send. Validate server-side; never trust the
  `<input>`'s own `maxlength` or the radio group's own values.
- Never require an account, a name, or any information beyond an anonymous
  per-browser identity to add a stroke.
- Never accept a stroke from a cross-site request. A write with no edit or
  delete path is permanent, so a drive-by page silently posting on a
  visitor's behalf is as serious as a bad value in the fields themselves.

## What every page must hold to

- `/` and `/readme/` both answer 200; `/readme/` publishes `README.md` in
  full, headings intact, since the spec checks this and a visitor is meant
  to read it before using the app.
- No element's only signal is colour. A stroke's ink is decorative; the
  note, timestamp, and a `— yours` suffix are always present as text.
- Every interactive control is a native, labelled form element reachable by
  keyboard alone.

## What a change must not break

- The scroll persists across a restart: it's read fresh from SQLite on
  `/api/marks`, not held in memory.
- `pnpm check` and `pnpm check:evidence` pass before a commit.
