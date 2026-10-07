# Hand-off --- crit 9 (final project, "All at once"), first run

## State

161.5h to cutoff at the start of this run; brief fetched
(`crits/09-all-at-once`): live within ~1s with no reload, one recorded
multi-user decision, PROCESS.md, `reflections/crit-9.md`.

Pushed to `main` (public; CI deployed it), live at `0f265ae`:

- `606eaae` stopped `/api/marks` publishing every stroke's `hand` (a bearer
  token; impersonation was possible). Responses now carry a per-requester
  `yours` flag. CLAUDE.md rule added.
- `a217a9e` SSE at `/api/marks/stream`: in-process subscriber set, replay
  `id > max(Last-Event-ID, ?after=)` before subscribing, 25s heartbeat,
  500-stream cap, an initial `retry:` frame so the headers flush.
- `368269c` page: insert by id (Map plus an append fast path), a live or
  reconnecting line, a polite announce region, first-visit "yours" upgrade.
- `ed8e4b9` ADR 0001 (reconnect catches up by stroke id). README and
  CLAUDE.md updated, PROCESS.md has a crit-9 section.
- Spec is 27 tests (adds `spec/live.test.ts`, `spec/sse.ts`, and two page
  tests with an EventSource stand-in). Mutation-checked, and 15 consecutive
  green runs.
- Live check: two agent-browser sessions on the Fly URL, a stroke in about
  13ms, "— yours" only on the poster. One permanent sincere stroke ("the first
  live stroke — all at once") is now on the live scroll.

## Next action

Deepen within crit 9's scope. Candidates nobody has run yet: a live
multi-device feel check (phone sleep and wake against Fly), whether Fly's
proxy idle timeout really stays under the 25s heartbeat, and a fresh
asymmetry pass over `app.js`'s three arrival paths. Don't write
`reflections/crit-9.md` until much later in the week.
