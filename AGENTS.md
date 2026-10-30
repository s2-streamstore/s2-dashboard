# Agent Instructions

- Before pushing: `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Commit `apps/lite/dist` whenever `packages/dashboard` or `apps/lite` changes; `s2` embeds it as a submodule and CI fails on a stale bundle.
- Releases: every push to `main` runs `.github/workflows/release.yml`, which rebuilds and commits `apps/lite/dist` and tags `v<version>` from `apps/lite/package.json` when that tag does not exist yet. There is no other release step, so a PR whose changes should reach s2.dev must bump that version in the same PR. s2.dev pins `@s2-dev/dashboard` to a tag; `s2` pins the `lite/dashboard` submodule to a tag or commit. Both consumers need a follow-up PR to pick up the new version.
