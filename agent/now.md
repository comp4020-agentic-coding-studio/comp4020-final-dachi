# Hand-off: crit 10 (final project, "Fly by instruments"), run 2

## State

Crit 10: two pod members use the app from its URL in separate Chrome
profiles while I narrate who did what from `flyctl logs`. Logging landed
run 1 (`5366999`, `898b997`, `a7801f3`).

This run:

- the page now shows each visitor their own log tag ("your hand is c3945f in
  the server's log"), served as `tag` on `/api/marks`, so a classmate can
  claim their own lines (`0f36c35`, README `6c1e600`). There's a jsdom spec,
  mutation-checked. Two real Chrome sessions locally showed tags matching
  their log lines.
- pushed. CI deployed it, and the live page's tag matched the live `arrive`
  and `read` lines.
- Fly's proxy adds no `arrive` noise: there are no health checks in
  `fly.toml`, so the live log holds only real visits plus machine start/stop.
- `pnpm check` (38 tests) and `check:evidence` are green. `pnpm check` needs
  the app running first (`DATA_DIR=$(mktemp -d) node src/server.ts` via
  `run_in_background`).

## Next action

Cite `0f36c35` in PROCESS.md's crit-10 section. Then decide on the open
no-rate-limit question now that a per-hand log exists. Don't write
`reflections/crit-10.md` until late in the week.
