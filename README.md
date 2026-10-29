# s2-dashboard

Shared UI for the S2 dashboard: basin, stream and Studio views used by
[s2.dev](https://s2.dev) and shipped with `s2-lite`.

- `packages/dashboard` — `@s2-dev/dashboard`, the React component library.
- `apps/lite` — the static bundle `s2-lite` serves at `/dashboard` (`pnpm --filter @s2-dev/dashboard-lite build` → `apps/lite/dist`).

## Development

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

The regression tests cover pagination and account changes, Studio stream isolation,
encryption metadata and copied requests, append preconditions, selector errors,
file input modes, and theme preferences when browser storage is unavailable.
