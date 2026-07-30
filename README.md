# aios-workspace-gui

The AIOS Workspace GUI — the local cockpit for an AIOS individual workspace: a
Claude Agent SDK server (`gui/server/`), a React client (`gui/client/`), and the
(currently do-not-demo) Tauri desktop shell (`src-tauri/`).

## Provenance

Cut from [`aiosbrain/aios-workspace`](https://github.com/aiosbrain/aios-workspace)
at frozen SHA `d6dcdeb74a44c8424e85b0781f5f11d4e06a3dfa` (tag `cut/gui-freeze`),
with full history for the moved paths preserved via `git filter-repo`
(AIO-594 / AIO-603 runbook). The seam contract this repo builds against is
`docs/gui-toolkit-contract.md` in the toolkit repo.

## Toolkit location (the one seam)

The server consumes exactly two toolkit surfaces: the published
`@aiosbrain/foundation` package and the `aios` CLI spawned from a **toolkit
checkout**. The toolkit checkout is resolved by `gui/server/toolkit-locate.mjs`
in this order:

1. `--toolkit-dir <path>` argv flag;
2. `AIOS_TOOLKIT_DIR` env var;
3. pre-split adjacency fallback (`gui/server/../../`, which only validates when
   the server runs from inside a toolkit checkout) — standalone installs should
   point 1 or 2 at a toolkit checkout, e.g. an adjacent `../aios-workspace`;
4. otherwise an actionable error naming the candidate, its source, the missing
   markers, and the fix.

A valid toolkit contains `scripts/aios.mjs`, `scaffold/`, and a root
`package.json`. An explicit source (1 or 2) that fails validation is a hard
error — no silent fallback.

Server tests that exercise the toolkit seam (CLI spawns, seam-parity suites,
the compiled operator-loop capability, the UX harness) require
`AIOS_TOOLKIT_DIR` pointing at a toolkit checkout and skip with an explicit
message otherwise.

## Desktop shell

`src-tauri/` runs in **adjacent-checkout mode only** and is **do-not-demo**.
Repointing/bundling the desktop shell for the standalone repo is owned by
AIO-581 in this repo.

## Provisional dependency note

`@aiosbrain/foundation@0.1.0` is not yet on the npm registry (publish pending);
until it lands, the root `package.json` carries an `overrides` entry mapping it
to the committed `vendor/aiosbrain-foundation-0.1.0.tgz` (packed from the frozen
toolkit SHA). Once the registry publish is proven, delete the override + the
`vendor/` tarball and refresh `package-lock.json`.

## Commands

```bash
npm install
npm run build:client     # vite build
npm run test:client      # vitest
npm run test:server      # node --test gui/server/
AIOS_TOOLKIT_DIR=/path/to/aios-workspace npm run test:server   # full seam suites
```

Node is pinned to 22 (`engines`).

## License

MIT — see `LICENSE`.
