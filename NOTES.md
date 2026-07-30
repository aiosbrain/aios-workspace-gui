# Cut notes (AIO-594 bootstrap PR)

## Nightly inbox-authorization mutation floor — flagged for AIO-612 review

Core's nightly `inbox-authorization` mutation group (`scripts/run-mutation.mjs` in
`aiosbrain/aios-workspace`) mutates core's `src/operator-loop/inbox/capability.ts`,
but its **calibrated oracle** — the capability suite whose measured kill rate set the
90% floor — is `gui/server/runtime-adapters/inbox-capability.test.mjs`, which now
lives in **this** repo. Per the runbook (§7, bullet 2) and AIO-539's measured-decision
rules, core must either:

1. run this repo's capability suite from an installed gui checkout as the oracle, or
2. re-calibrate the 90% floor against a core-owned oracle (a measured decision,
   recorded with the evidence AIO-539 prescribes).

Nothing in this repo enforces or changes that floor; this note exists so the
**AIO-612 deletion PR review** (which removes the moved paths + gui CI lanes from
core) resolves it explicitly rather than letting the floor silently point at a suite
core no longer carries.

## Remaining provisional items

- ~~Remove the root `package.json` `overrides` entry and `vendor/aiosbrain-foundation-0.1.0.tgz`;
  reinstall from the registry and commit the refreshed `package-lock.json`.~~
  **Done** — `@aiosbrain/foundation@0.1.0` is published; the lockfile now resolves it
  from `registry.npmjs.org` and the vendored tarball is gone.
- The compiled operator loop is loaded from `<toolkit>/dist/operator-loop` (toolkit-dist
  fallback); replace with the published `@aios-alpha/operator-loop` package when it exists
  (runbook F7).

## CI toolkit provisioning — **done in this PR** (commit `7a0afc2`)

~~The bootstrap-seeded `.github/workflows/ci.yml` test job runs `npm run test` with no
toolkit checkout, so the live-server suites fail with the toolkit-locate actionable
error.~~ **Done** — the unit-tests lane now provisions a real toolkit and the resulting
CI contract is:

- **Pinned toolkit checkout.** The test job checks out `aiosbrain/aios-workspace` at
  `d6dcdeb74a44c8424e85b0781f5f11d4e06a3dfa` (the freeze SHA, tag `cut/gui-freeze`) into
  `toolkit-checkout/`, runs `npm ci` + `npm run build:loop` there (compiled operator-loop
  dist for the inbox-capability suite), and exports `AIOS_TOOLKIT_DIR` for `npm test`.
  **Repin to the `v0.9.0` release tag once it is cut.**
- **Fail-closed leak gate.** The governance job asserts `AIOS_LEAK_TERMS_B64` is
  non-empty on `push` and same-repo `pull_request` events *before* running
  `scripts/leak-gate.sh`, so a repo-settings regression fails loudly instead of passing
  baseline-only. Known limitation: fork PRs never receive secrets and run the always-on
  baseline shape rules only — the full identifier sweep for fork contributions happens on
  the push after merge and via maintainers' local pre-push hooks.

## Dependency-audit follow-up (inherited, not introduced by the cut)

`npm audit --omit=dev` reports **7 high / 0 critical** advisories, all reached through
the existing `@aios-alpha/design` / `@aios-alpha/ui` build-tool chain inherited from the
source repo — not introduced by this cut. Owner: Linear follow-up pending (issue to be
filed by the split orchestrator; update this line with the AIO id once it exists).
