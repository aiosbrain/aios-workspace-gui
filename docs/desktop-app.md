# Desktop app (Tauri shell)

> **Status (v0.9.0): do-not-demo.** The desktop shell runs in
> **adjacent/configured-toolkit mode only** — it is not a v0.9.0 deliverable and
> must not be demoed. Making it self-contained in this standalone repo
> (repointing the bundle + sidecar launch at the split layout, or bundling the
> toolkit) is owned by **AIO-581** (post-cut, in this repo). See
> "Post-cut reality" below for what the current code actually requires.

The desktop app makes AIOS Workspace usable without a terminal: double-click, pick
your workspace folder, and you're in the cockpit (chat · integrations · review & push).

It is a thin **Tauri** shell over the existing local server + SPA. On launch it:
1. resolves your workspace folder (remembered between runs; a native folder picker on
   first run);
2. starts the Node sidecar (`gui/server`) on a free `127.0.0.1` port with a one-shot
   session token — under `dotenvx run --` when the workspace has an encrypted `.env`,
   so the agent's MCP servers get decrypted provider tokens;
3. waits for it to come up and opens the window at the tokened localhost URL;
4. kills the sidecar when you close the window.

The agent runtime, skills, hooks, and connectors all live in the sidecar — unchanged.

## Post-cut reality: what the shell actually requires

The shell was written before the GUI was cut out of the toolkit repo, and it still
assumes it is building **inside a full toolkit checkout** (the pre-split
`aiosbrain/aios-workspace` layout). Concretely, in this standalone repo:

- **`src-tauri/tauri.conf.json`** bundles `../scripts`, `../validation`,
  `../scaffold`, and `../node_modules` as app resources. Here `../scaffold` does
  not exist, and `../scripts` / `../validation` hold only this repo's governance
  scripts — not the toolkit's `run-gui.mjs`, `scaffold-project.sh`,
  `ensure-env.mjs`, or `aios.mjs`. A bundle build therefore fails on the missing
  resource dir, or would package the wrong content.
- **`src-tauri/src/main.rs`** resolves a "toolkit dir" (the bundled resource dir,
  else it walks up from the executable looking for `gui/server/index.mjs`) and
  launches toolkit scripts from it directly: `scripts/run-gui.mjs` (the sidecar
  entry), `scripts/scaffold-project.sh` (first-run scaffolding), and
  `scripts/ensure-env.mjs`. None of those exist in this repo, so in `tauri dev`
  the walk-up finds this repo's root (it does contain `gui/server/index.mjs`)
  and the sidecar launch then fails. The shell has **no** `--toolkit-dir` /
  `AIOS_TOOLKIT_DIR` awareness — it does not go through
  `gui/server/toolkit-locate.mjs`.

So running or bundling the desktop shell only works when `src-tauri/` sits inside
a directory tree that provides the full toolkit layout — a root containing the
toolkit's `scripts/` (with `run-gui.mjs`, `scaffold-project.sh`,
`ensure-env.mjs`), `scaffold/`, `validation/`, `gui/`, and an installed
`node_modules`. Nothing in this standalone repo establishes that layout.
Repointing the config + launch code at the split layout (or bundling the
toolkit) is exactly the AIO-581 work.

## Develop

> **Post-cut unsupported.** `npm run app:dev` is not wired in this repo's
> `package.json` (the `app:*` scripts lived in the pre-split toolkit root), and
> per the above the shell cannot find its sidecar scripts here. The commands
> below describe the pre-split workflow and only apply once the required
> toolkit layout is explicitly established (AIO-581).

```bash
npm install                 # installs deps + @tauri-apps/cli
npm run app:dev             # builds the SPA, then `tauri dev` (hot-reload shell)
```

Requires the Rust toolchain (`rustup`); the default stable works.

> **Lockfile note:** `src-tauri/Cargo.lock` pins `alloc-stdlib = 0.2.2`. Tauri pulls
> `brotli 8.0.3` (asset compression), which mixes `alloc-no-stdlib` 2.0.4 (direct)
> with 3.0.0 (via `alloc-stdlib 0.2.3`) → a type-mismatch that fails to compile.
> Pinning `alloc-stdlib` to 0.2.2 keeps everything on `alloc-no-stdlib` 2.0.4. Keep
> the committed lockfile; don't `cargo update -p alloc-stdlib` until brotli ships a fix.

## Build a distributable

> **Post-cut unsupported.** `npm run app:build` is likewise not wired in this
> repo's `package.json`, and the bundle step fails here because
> `tauri.conf.json` references `../scaffold` (absent) and expects the toolkit's
> scripts under `../scripts`. Self-contained bundling for this repo is AIO-581.

```bash
npm run app:build           # → src-tauri/target/release/bundle/ (.app/.dmg, .msi, .deb/.AppImage)
```

Replace the placeholder icon:

```bash
npm run app:icon -- path/to/icon-1024.png
```

## Known gaps before shipping to non-technical users

These are deliberately deferred (they pair with code-signing as the finishing pass):

- **Bundled Node runtime.** The shell currently launches the *system* `node` (resolved
  via a login shell, then common install paths). End users without Node installed
  can't run it yet — bundle a Node runtime as a Tauri sidecar binary and point
  `start_sidecar` at it.
- **Prune resources.** `tauri.conf.json` bundles the whole `node_modules` for correct
  module resolution; prune to runtime deps (`ws`, `@anthropic-ai/claude-agent-sdk` +
  transitive) to shrink the bundle.
- **Bundle `dotenvx`** (or vendor its resolution) so secret decryption doesn't depend
  on a system install.

## Code-signing & notarization (your finishing step)

Unsigned builds run locally but warn on other machines. To ship:

- **macOS** — set an Apple Developer ID in `tauri.conf.json` → `bundle.macOS`
  (`signingIdentity`) and notarize (`tauri build` integrates with `notarytool`; supply
  `APPLE_ID`, `APPLE_PASSWORD`/API key, `APPLE_TEAM_ID`).
- **Windows** — provide a signing certificate (`bundle.windows.certificateThumbprint`
  or a custom `signCommand`).

See the Tauri distribution docs for the current, exact fields.
