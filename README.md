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

Server tests that exercise the toolkit seam require `AIOS_TOOLKIT_DIR`
pointing at a toolkit checkout. Without one, prereq-gated seam suites
(seam-parity, the compiled operator-loop capability, the UX harness) skip
with an explicit message, but the live-server suites — which boot the real
server — **fail** with the actionable toolkit-locate error above. A
toolkit-less run is therefore never expected to be green; the normal test
path always sets `AIOS_TOOLKIT_DIR` (see Commands).

## Desktop shell

`src-tauri/` runs in **adjacent-checkout mode only** and is **do-not-demo**.
Repointing/bundling the desktop shell for the standalone repo is owned by
AIO-581 in this repo.

## Dependency note

`@aiosbrain/foundation@^0.1.0` resolves from the public npm registry
(`@aiosbrain/foundation@0.1.0`, published from the frozen toolkit SHA). The
committed `package-lock.json` pins the registry tarball + integrity; install
with a plain `npm ci` / `npm install`.

## Commands

```bash
npm install
npm run build:client     # vite build
npm run test:client      # vitest (no toolkit needed)

# Server tests and the full suite need a toolkit checkout (see "Toolkit
# location" above) — this is the normal path, matching what CI provisions:
AIOS_TOOLKIT_DIR=/path/to/aios-workspace npm run test:server   # node --test gui/server/
AIOS_TOOLKIT_DIR=/path/to/aios-workspace npm test              # server + client
```

Running `npm run test:server` **without** `AIOS_TOOLKIT_DIR` is a diagnostic
mode only, not an expected-green path: prereq-gated seam suites skip, and the
live-server suites fail with the actionable toolkit-locate error telling you
how to point the server at a toolkit checkout.

Node is pinned to 22 (`engines`).

## License

MIT — see `LICENSE`.
